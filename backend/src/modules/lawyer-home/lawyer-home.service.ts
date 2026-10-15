import { Injectable } from '@nestjs/common';
import { EarningStatus, ReportStatus } from '@prisma/client';
import { consultationCode } from '../../common/consultation-code';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

/** Midnight, this many days back. */
function daysAgo(days: number) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - days);
  return date;
}

/** A cursor is the moment plus the entry's id, so ties cannot be lost. */
function parseCursor(cursor?: string) {
  if (!cursor) return null;

  const [iso, id] = cursor.split('|');
  const at = new Date(iso);

  return Number.isNaN(at.getTime()) || !id ? null : { at, id };
}

/** Which of the last seven days a moment falls on; 0 is six days ago. */
function dayIndex(at: Date, from: Date) {
  return Math.floor((at.getTime() - from.getTime()) / 86_400_000);
}

/**
 * The lawyer's dashboard.
 *
 * Only what a lawyer can act on: what they have earned, what is holding
 * their money up, and what has happened lately. Scheduling sections are
 * deliberately absent — a lawyer has no diary to show.
 */
@Injectable()
export class LawyerHomeService {
  constructor(private readonly prisma: PrismaService) {}

  async dashboard(lawyerId: string) {
    const weekFrom = daysAgo(6);
    const fortnightFrom = daysAgo(13);

    const [lawyer, earnings, reports, recent] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: lawyerId },
        select: {
          fullName: true,
          lawyerProfile: { select: { approvedAt: true } },
        },
      }),
      // Two weeks, so this week has something to be compared against.
      this.prisma.lawyerEarning.findMany({
        where: { lawyerId, createdAt: { gte: fortnightFrom } },
        select: { net: true, createdAt: true, status: true, releasedAt: true },
      }),
      this.prisma.consultationReport.findMany({
        where: {
          request: { lawyerId },
          status: { in: [ReportStatus.awaiting_review, ReportStatus.failed] },
        },
        orderBy: { draftedAt: 'asc' },
        take: 10,
        select: {
          requestId: true,
          reviewEndsAt: true,
          request: {
            select: {
              number: true,
              createdAt: true,
              customer: { select: { fullName: true } },
              earning: { select: { net: true, status: true } },
            },
          },
        },
      }),
      this.prisma.consultationRequest.findMany({
        where: { lawyerId, assignedAt: { not: null } },
        orderBy: { assignedAt: 'desc' },
        take: 10,
        select: {
          id: true,
          number: true,
          planName: true,
          assignedAt: true,
          customer: { select: { fullName: true } },
          report: { select: { status: true, submittedAt: true } },
          earning: { select: { net: true, status: true, releasedAt: true } },
        },
      }),
    ]);

    // ---- Earnings ----

    const series = Array.from({ length: 7 }, () => 0);
    let thisWeek = 0;
    let lastWeek = 0;

    for (const row of earnings) {
      const index = dayIndex(row.createdAt, weekFrom);
      if (index >= 0 && index < 7) {
        series[index] += row.net;
        thisWeek += row.net;
      } else {
        lastWeek += row.net;
      }
    }

    // ---- Reports holding money up ----

    const pendingReports = reports.map((report) => ({
      consultationId: report.requestId,
      reference: consultationCode(report.request.number),
      client: report.request.customer.fullName ?? 'Client',
      consultedAt: report.request.createdAt,
      reviewEndsAt: report.reviewEndsAt,
      /** What this report is holding back. */
      heldAmount:
        report.request.earning?.status === EarningStatus.held
          ? report.request.earning.net
          : 0,
      overdue: report.reviewEndsAt !== null && report.reviewEndsAt <= new Date(),
    }));

    return {
      greetingName: lawyer?.fullName ?? 'there',
      weeklyEarnings: thisWeek,
      /** Null when there is no previous week to compare against. */
      weeklyChangePercent:
        lastWeek > 0 ? Math.round(((thisWeek - lastWeek) / lastWeek) * 100) : null,
      /** One figure per day, six days ago first, today last. */
      earningsSeries: series,
      pendingReports,
      heldTotal: pendingReports.reduce((total, row) => total + row.heldAmount, 0),
      activity: this.activity(recent, lawyer?.lawyerProfile?.approvedAt ?? null),
    };
  }

  /**
   * The full activity list, a page at a time.
   *
   * The entries are built from several tables rather than a log, so there is
   * no single column to page on. Each one carries the moment it happened and
   * a stable id, and the cursor is both — which keeps two things that
   * happened in the same second from being skipped or repeated.
   */
  async activityPage(lawyerId: string, cursor?: string, limit = 10) {
    const after = parseCursor(cursor);

    // Fetched generously: several entries can come from one consultation,
    // so a page of ten needs fewer than ten rows, never more.
    const [rows, lawyer] = await Promise.all([
      this.prisma.consultationRequest.findMany({
        where: {
          lawyerId,
          assignedAt: { not: null },
          ...(after ? { assignedAt: { lte: after.at, not: null } } : {}),
        },
        orderBy: { assignedAt: 'desc' },
        take: limit * 2,
        select: {
          id: true,
          number: true,
          planName: true,
          assignedAt: true,
          customer: { select: { fullName: true } },
          report: { select: { status: true, submittedAt: true } },
          earning: { select: { net: true, status: true, releasedAt: true } },
        },
      }),
      this.prisma.user.findUnique({
        where: { id: lawyerId },
        select: { lawyerProfile: { select: { approvedAt: true } } },
      }),
    ]);

    const all = this.activity(rows, lawyer?.lawyerProfile?.approvedAt ?? null, rows.length * 3);

    // Everything strictly older than the cursor, ties broken by id so the
    // same entry is never served twice.
    const page = all.filter((entry) => {
      if (!after) return true;
      const at = entry.at.getTime();
      return at < after.at.getTime() || (at === after.at.getTime() && entry.id < after.id);
    });

    const data = page.slice(0, limit);
    const last = data.at(-1);

    return {
      data,
      /** Null when there is nothing older to fetch. */
      nextCursor:
        last && page.length > limit ? `${last.at.toISOString()}|${last.id}` : null,
    };
  }

  /**
   * What has happened lately, newest first.
   *
   * Built from what the consultations themselves record rather than a
   * separate log — there is nothing here that is not already a fact
   * somewhere else, so there is nothing to keep in step.
   */
  private activity(
    rows: {
      id: string;
      number: number | null;
      planName: string;
      assignedAt: Date | null;
      customer: { fullName: string | null };
      report: { status: ReportStatus; submittedAt: Date | null } | null;
      earning: { net: number; status: EarningStatus; releasedAt: Date | null } | null;
    }[],
    approvedAt: Date | null,
    cap = 12,
  ) {
    const entries: {
      /** Stable across requests, so a cursor can break ties on it. */
      id: string;
      kind: string;
      title: string;
      subtitle: string;
      at: Date;
    }[] = [];

    for (const row of rows) {
      const client = row.customer.fullName ?? 'a client';

      if (row.assignedAt) {
        entries.push({
          id: `consultation-${row.id}`,
          kind: 'consultation',
          title: `${row.planName} with ${client}`,
          subtitle: consultationCode(row.number),
          at: row.assignedAt,
        });
      }

      if (row.report?.submittedAt) {
        entries.push({
          id: `report-${row.id}`,
          kind: 'report',
          title: 'Report sent',
          subtitle: `${client} · ${consultationCode(row.number)}`,
          at: row.report.submittedAt,
        });
      }

      if (row.earning?.releasedAt) {
        entries.push({
          id: `payment-${row.id}`,
          kind: 'payment',
          title: `₹${row.earning.net} released`,
          subtitle: 'Available for payout',
          at: row.earning.releasedAt,
        });
      }
    }

    // A lawyer with no history at all still has this one.
    if (approvedAt) {
      entries.push({
        id: 'approval',
        kind: 'approval',
        title: 'Account approved',
        subtitle:
          'Your profile has been verified. You are ready to receive ' +
          'consultation requests.',
        at: approvedAt,
      });
    }

    return entries
      .sort((a, b) =>
        b.at.getTime() === a.at.getTime()
          ? b.id.localeCompare(a.id)
          : b.at.getTime() - a.at.getTime(),
      )
      .slice(0, cap);
  }
}
