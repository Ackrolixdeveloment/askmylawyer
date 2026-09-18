import { HttpStatus, Injectable } from '@nestjs/common';
import { LawyerDocumentType, OnboardingStatus, Prisma } from '@prisma/client';
import { AppException } from '../../common/app-exception';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { StorageService } from '../../infrastructure/storage/storage.service';
import { LawyerNotificationsService } from '../notifications/lawyer-notifications.service';
import { ListOnboardingDto, OnboardingBucket } from './dto/list-onboarding.dto';
import type { CorrectionNoteDto, SaveReviewProgressDto } from './dto/review.dto';

/** The admin's unfinished work on the review screen. */
interface ReviewProgress {
  step: string;
  blocks: Record<string, { decision: string; note: string | null }>;
  updatedAt: string;
  updatedById: string;
}

/**
 * States an admin can still decide on. A correction already sent can be
 * changed or approved outright; only a draft, an approval or a rejection is
 * final as far as this screen is concerned.
 */
const REVIEWABLE: OnboardingStatus[] = [
  'submitted',
  'resubmitted',
  'in_review',
  'correction_requested',
];

/** Which application statuses each admin screen shows. */
const BUCKET_STATUSES: Record<OnboardingBucket, OnboardingStatus[]> = {
  [OnboardingBucket.new]: ['submitted'],
  [OnboardingBucket.correction]: ['correction_requested'],
  [OnboardingBucket.resubmission]: ['resubmitted'],
  [OnboardingBucket.rejected]: ['rejected'],
  [OnboardingBucket.draft]: ['draft'],
};

const lawyerSelect = {
  id: true,
  fullName: true,
  phone: true,
  email: true,
  status: true,
  createdAt: true,
  lawyerProfile: {
    select: {
      onboardingStatus: true,
      kycMethod: true,
      enrollmentNumber: true,
      barCouncilState: true,
      experienceBand: true,
      submittedAt: true,
      updatedAt: true,
      correctionRequestedAt: true,
      correctionNotes: true,
      personalCompletedAt: true,
      kycCompletedAt: true,
      professionalCompletedAt: true,
      bankCompletedAt: true,
      profileCompletedAt: true,
    },
  },
} satisfies Prisma.UserSelect;

type LawyerRow = Prisma.UserGetPayload<{ select: typeof lawyerSelect }>;

/** ISO yyyy-mm-dd, which is what the admin tables sort and format. */
const isoDate = (value: Date) => value.toISOString().slice(0, 10);

const daysSince = (value: Date) =>
  Math.max(0, Math.floor((Date.now() - value.getTime()) / 86_400_000));

/**
 * The registration form, in the order the app walks the lawyer through it.
 * Each step stamps its timestamp when saved, so the first one still missing
 * is where the lawyer stopped.
 */
const REGISTRATION_STEPS = [
  { field: 'personalCompletedAt', label: 'Personal Information' },
  { field: 'kycCompletedAt', label: 'KYC Verification' },
  { field: 'professionalCompletedAt', label: 'Professional Verification' },
  { field: 'bankCompletedAt', label: 'Bank Details' },
  { field: 'profileCompletedAt', label: 'Professional Profile' },
] as const;

type StepTimestamps = Partial<Record<(typeof REGISTRATION_STEPS)[number]['field'], Date | null>>;

/** How far a half-finished registration got. */
function registrationProgress(profile: StepTimestamps | null | undefined) {
  const done = REGISTRATION_STEPS.map((step) => Boolean(profile?.[step.field]));
  const stoppedIndex = done.indexOf(false);

  return {
    completedSteps: done.filter(Boolean).length,
    totalSteps: REGISTRATION_STEPS.length,
    // Null once every step is filled in — the lawyer only has to submit.
    stoppedAtStep: stoppedIndex === -1 ? null : stoppedIndex + 1,
    stoppedAt: stoppedIndex === -1 ? null : REGISTRATION_STEPS[stoppedIndex].label,
    steps: REGISTRATION_STEPS.map((step, index) => ({
      label: step.label,
      completed: done[index],
    })),
  };
}

/** Which review step each flagged block belongs to. */
const BLOCK_SECTIONS: Record<string, string> = {
  'Aadhar Card': 'Identity Verification',
  'PAN Card': 'Identity Verification',
  Certificate: 'Bar Council Verification',
  'Bank Details': 'Bank Details',
  'Professional Profile': 'Professional Profile',
};

/** Short, readable handle for a lawyer until the platform issues its own codes. */
const lawyerCode = (id: string) => `LAW-${id.slice(0, 8).toUpperCase()}`;

@Injectable()
export class AdminLawyersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly notifications: LawyerNotificationsService,
  ) {}

  /** The full application behind the review screen. */
  async application(id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, role: 'lawyer', deletedAt: null },
      select: {
        id: true,
        fullName: true,
        phone: true,
        email: true,
        createdAt: true,
        lawyerProfile: true,
        bankAccount: true,
        documents: {
          select: { type: true, originalName: true, mimeType: true, sizeBytes: true, updatedAt: true },
        },
      },
    });

    if (!user || !user.lawyerProfile) {
      throw new AppException(
        HttpStatus.NOT_FOUND,
        'LAWYER_NOT_FOUND',
        'This lawyer application was not found.',
      );
    }

    const profile = user.lawyerProfile;
    const bank = user.bankAccount;
    const notes = (profile.correctionNotes ?? null) as Record<string, string> | null;
    const file = (type: LawyerDocumentType) => {
      const found = user.documents.find((document) => document.type === type);
      return found
        ? {
            type,
            fileName: found.originalName,
            mimeType: found.mimeType,
            sizeBytes: found.sizeBytes,
            uploadedAt: found.updatedAt,
          }
        : null;
    };

    return {
      id: user.id,
      name: user.fullName ?? '',
      // Practice headline under the name.
      title: profile.specialisations.join(', '),
      experience: profile.experienceBand ?? '',
      location: profile.residentialAddress ?? '',
      digilockerVerified: profile.kycMethod === 'digilocker',
      onboardingStatus: profile.onboardingStatus,
      // How far a half-finished registration got.
      progress: registrationProgress(profile),
      submittedAt: profile.submittedAt,
      reviewedAt: profile.reviewedAt,
      rejectionReason: profile.rejectionReason,
      correctionNotes: notes,
      // Pre-flags the blocks on the review screen: what was asked for while it
      // sits in the correction queue, and what the lawyer redid once it is back.
      reviewProgress: (profile.reviewProgress ?? null) as ReviewProgress | null,
      corrections: profile.onboardingStatus === 'correction_requested' ? notes ?? undefined : undefined,
      resubmitted: profile.onboardingStatus === 'resubmitted' ? notes ?? undefined : undefined,
      personal: {
        fullName: user.fullName ?? '',
        email: user.email ?? '',
        phone: user.phone ?? '',
        languages: profile.languages.join(', '),
      },
      identity: {
        address: profile.residentialAddress ?? '',
        documents: [
          {
            label: 'Aadhar Card',
            // Stored encrypted; only the last four digits are readable.
            number: profile.aadhaarLast4 ? `XXXX XXXX ${profile.aadhaarLast4}` : '',
            ...(file('aadhaar') ?? { type: 'aadhaar', fileName: '', mimeType: '', sizeBytes: 0, uploadedAt: null }),
          },
          {
            label: 'PAN Card',
            number: profile.panNumber ?? '',
            ...(file('pan') ?? { type: 'pan', fileName: '', mimeType: '', sizeBytes: 0, uploadedAt: null }),
          },
        ],
      },
      barCouncil: {
        number: profile.enrollmentNumber ?? '',
        stateCouncil: profile.barCouncilState ?? '',
        qualification: profile.qualification ?? '',
        certificate: file('bar_certificate'),
      },
      professional: {
        experience: profile.experienceBand ?? '',
        // Not collected during registration yet.
        consultationTypes: [] as string[],
        practiceAreas: profile.specialisations,
        caseCategories: profile.caseCategories,
        bio: profile.about ?? '',
        photo: file('profile_photo'),
        signature: file('signature'),
      },
      bank: bank
        ? {
            accountHolderName: bank.holderName,
            accountNumberMasked: `XXXXXX${bank.accountLast4}`,
            ifscCode: bank.ifscCode,
            bankName: bank.bankName,
            swiftCode: bank.swiftCode,
            proof: file('bank_proof'),
          }
        : null,
    };
  }

  /** Approve the application — the lawyer becomes a verified lawyer. */
  approve(id: string, adminId: string) {
    return this.decide(id, adminId, 'approved', {
      onboardingStatus: 'approved',
      approvedAt: new Date(),
      rejectedAt: null,
      rejectionReason: null,
      correctionRequestedAt: null,
      correctionNotes: Prisma.DbNull,
    });
  }

  /** Turn the application down, with a reason the lawyer can read. */
  reject(id: string, adminId: string, reason: string) {
    return this.decide(id, adminId, 'rejected', {
      onboardingStatus: 'rejected',
      rejectedAt: new Date(),
      rejectionReason: reason,
      approvedAt: null,
    });
  }

  /** Send it back so the lawyer can fix the flagged sections. */
  requestCorrection(id: string, adminId: string, notes: CorrectionNoteDto[]) {
    const unknown = notes.filter((note) => !(note.block in BLOCK_SECTIONS));
    if (unknown.length > 0) {
      throw new AppException(
        HttpStatus.BAD_REQUEST,
        'UNKNOWN_REVIEW_BLOCK',
        `Cannot ask for a correction on: ${unknown.map((note) => note.block).join(', ')}.`,
      );
    }

    return this.decide(id, adminId, 'correction', {
      onboardingStatus: 'correction_requested',
      correctionRequestedAt: new Date(),
      correctionNotes: Object.fromEntries(notes.map((item) => [item.block, item.note])),
      approvedAt: null,
      rejectedAt: null,
      rejectionReason: null,
    });
  }

  /**
   * Saves the ticks, crosses and draft notes for one step, so the review
   * survives a refresh and can be picked up again later.
   */
  async saveReviewProgress(id: string, adminId: string, dto: SaveReviewProgressDto) {
    const profile = await this.prisma.lawyerProfile.findFirst({
      where: { userId: id, user: { role: 'lawyer', deletedAt: null } },
      select: { onboardingStatus: true, reviewProgress: true },
    });

    if (!profile) {
      throw new AppException(
        HttpStatus.NOT_FOUND,
        'LAWYER_NOT_FOUND',
        'This lawyer application was not found.',
      );
    }
    if (!REVIEWABLE.includes(profile.onboardingStatus)) {
      throw notReviewable(profile.onboardingStatus);
    }

    // Steps already reviewed keep their decisions.
    const saved = (profile.reviewProgress ?? null) as ReviewProgress | null;
    const blocks = { ...(saved?.blocks ?? {}) };
    for (const block of dto.blocks) {
      blocks[block.block] = { decision: block.decision, note: block.note ?? null };
    }

    await this.prisma.lawyerProfile.update({
      where: { userId: id },
      data: {
        reviewProgress: {
          step: dto.step,
          blocks,
          updatedAt: new Date().toISOString(),
          updatedById: adminId,
        },
      },
    });

    return this.application(id);
  }

  /** Records the outcome, then returns the refreshed application. */
  private async decide(
    id: string,
    adminId: string,
    outcome: 'approved' | 'rejected' | 'correction',
    data: Prisma.LawyerProfileUncheckedUpdateManyInput,
  ) {
    const profile = await this.prisma.lawyerProfile.findFirst({
      where: { userId: id, user: { role: 'lawyer', deletedAt: null } },
      select: { onboardingStatus: true },
    });

    if (!profile) {
      throw new AppException(
        HttpStatus.NOT_FOUND,
        'LAWYER_NOT_FOUND',
        'This lawyer application was not found.',
      );
    }
    if (!REVIEWABLE.includes(profile.onboardingStatus)) {
      throw notReviewable(profile.onboardingStatus);
    }

    // Guarded on the status just read, so two admins can't decide at once.
    const { count } = await this.prisma.lawyerProfile.updateMany({
      where: { userId: id, onboardingStatus: profile.onboardingStatus },
      data: {
        ...data,
        reviewedById: adminId,
        reviewedAt: new Date(),
        reviewProgress: Prisma.DbNull,
      },
    });
    if (count === 0) throw notReviewable(profile.onboardingStatus);

    const application = await this.application(id);
    await this.announce(outcome, application);
    return application;
  }

  /** Lets the lawyer know what was decided. Email today; SMS and push later. */
  private announce(
    outcome: 'approved' | 'rejected' | 'correction',
    application: Awaited<ReturnType<AdminLawyersService['application']>>,
  ) {
    const to = { name: application.name || 'there', email: application.personal.email || null };

    switch (outcome) {
      case 'approved':
        return this.notifications.approved(to);
      case 'rejected':
        return this.notifications.rejected(to, application.rejectionReason ?? '');
      case 'correction':
        return this.notifications.correctionRequested(to, application.correctionNotes ?? {});
    }
  }

  /** One of the lawyer's uploaded files, for preview and download. */
  async document(userId: string, type: LawyerDocumentType) {
    const document = await this.prisma.lawyerDocument.findUnique({
      where: { userId_type: { userId, type } },
    });
    if (!document) {
      throw new AppException(
        HttpStatus.NOT_FOUND,
        'DOCUMENT_NOT_FOUND',
        'This file has not been uploaded.',
      );
    }
    return { document, body: await this.storage.get(document.storageKey) };
  }

  /** New requests and rejected lawyers — the tables sharing one row shape. */
  async listOnboarding(query: ListOnboardingDto) {
    const { rows, total, page, limit } = await this.page(query);
    return { data: rows.map((row) => this.toRequest(row)), meta: { page, limit, total } };
  }

  /** Correction and resubmission queues. */
  async listCorrections(query: ListOnboardingDto) {
    const { rows, total, page, limit } = await this.page(query);

    return {
      data: rows.map((row) => {
        const profile = row.lawyerProfile;
        const sentOn =
          profile?.correctionRequestedAt ?? profile?.updatedAt ?? row.createdAt;

        // What the admin flagged, and the note the lawyer was sent.
        const notes = Object.entries(
          (profile?.correctionNotes ?? {}) as Record<string, string>,
        );
        const sections = [
          ...new Set(notes.map(([block]) => BLOCK_SECTIONS[block] ?? block)),
        ];

        return {
          id: row.id,
          lawyerId: lawyerCode(row.id),
          name: row.fullName ?? '',
          phone: row.phone ?? '',
          email: row.email ?? '',
          section: sections[0] ?? '',
          sections,
          remarks: notes.map(([block, note]) => `${block}: ${note}`).join(' · '),
          sentOn: isoDate(sentOn),
          state: profile?.barCouncilState ?? '',
          daysWaiting: daysSince(sentOn),
        };
      }),
      meta: { page, limit, total },
    };
  }

  /** Registrations that were started but never submitted. */
  async listDrafts(query: ListOnboardingDto) {
    const { rows, total, page, limit } = await this.page({
      ...query,
      status: OnboardingBucket.draft,
    });

    return {
      data: rows.map((row) => ({
        id: row.id,
        lawyerId: lawyerCode(row.id),
        name: row.fullName ?? '',
        // Not collected during registration yet.
        practiceType: null,
        email: row.email ?? '',
        mobile: row.phone ?? '',
        // Where in the form the lawyer stopped.
        ...registrationProgress(row.lawyerProfile),
        lastUpdated: isoDate(row.lawyerProfile?.updatedAt ?? row.createdAt),
        referredByName: null,
        referredByCode: null,
      })),
      meta: { page, limit, total },
    };
  }

  /** Approved lawyers, live to customers. */
  async listVerified(query: ListOnboardingDto) {
    const where: Prisma.UserWhereInput = {
      role: 'lawyer',
      deletedAt: null,
      lawyerProfile: { onboardingStatus: 'approved' },
    };
    const { page, limit } = query;

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        select: lawyerSelect,
        orderBy: { fullName: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      data: rows.map((row) => {
        const profile = row.lawyerProfile;
        return {
          id: row.id,
          name: row.fullName ?? '',
          phone: row.phone ?? '',
          email: row.email ?? '',
          barId: profile?.enrollmentNumber ?? '',
          verification: profile?.kycMethod ?? 'manual',
          city: null,
          barCouncilState: profile?.barCouncilState ?? null,
          experience: profile?.experienceBand ?? '',
          status: row.status === 'suspended' ? 'suspended' : 'active',
        };
      }),
      meta: { page, limit, total },
    };
  }

  /**
   * Takes the lawyer off the marketplace and ends every open app session, so
   * the app signs them out the moment they touch it.
   */
  async suspend(id: string, reason: string | null) {
    const lawyer = await this.findLawyer(id);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: lawyer.id },
        data: { status: 'suspended', suspendedAt: new Date(), suspensionReason: reason },
      }),
      this.prisma.userSession.updateMany({
        where: { userId: lawyer.id, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    return { id: lawyer.id, status: 'suspended' as const };
  }

  /** Puts a suspended lawyer back on the marketplace. */
  async reactivate(id: string) {
    const lawyer = await this.findLawyer(id);

    await this.prisma.user.update({
      where: { id: lawyer.id },
      data: { status: 'active', suspendedAt: null, suspensionReason: null },
    });

    return { id: lawyer.id, status: 'active' as const };
  }

  private async findLawyer(id: string) {
    const lawyer = await this.prisma.user.findFirst({
      where: { id, role: 'lawyer', deletedAt: null },
      select: { id: true, status: true },
    });
    if (!lawyer) {
      throw new AppException(HttpStatus.NOT_FOUND, 'LAWYER_NOT_FOUND', 'Lawyer not found.');
    }
    return lawyer;
  }

  /** Accounts that were removed; kept for the audit trail. */
  async listDeleted({ page, limit }: ListOnboardingDto) {
    const where: Prisma.UserWhereInput = {
      role: 'lawyer',
      deletedAt: { not: null },
    };

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        select: { ...lawyerSelect, deletedAt: true },
        orderBy: { deletedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      data: rows.map((row) => ({
        id: row.id,
        lawyerId: lawyerCode(row.id),
        name: row.fullName ?? '',
        email: row.email ?? '',
        phone: row.phone ?? '',
        createdOn: isoDate(row.createdAt),
        deletedOn: isoDate(row.deletedAt!),
      })),
      meta: { page, limit, total },
    };
  }

  /** Headline counts above the lawyer tables. */
  async summary() {
    const counts = await this.prisma.lawyerProfile.groupBy({
      by: ['onboardingStatus'],
      _count: { _all: true },
      where: { user: { deletedAt: null } },
    });

    const byStatus = Object.fromEntries(
      counts.map((row) => [row.onboardingStatus, row._count._all]),
    ) as Partial<Record<OnboardingStatus, number>>;
    const count = (status: OnboardingStatus) => byStatus[status] ?? 0;

    return {
      registered: counts.reduce((total, row) => total + row._count._all, 0),
      verified: count('approved'),
      queue: count('submitted') + count('resubmitted'),
      incomplete: count('draft'),
      rejected: count('rejected'),
      corrections: count('correction_requested'),
      resubmitted: count('resubmitted'),
      byStatus,
    };
  }

  private async page({ status, page, limit }: ListOnboardingDto) {
    const where: Prisma.UserWhereInput = {
      role: 'lawyer',
      deletedAt: null,
      lawyerProfile: { onboardingStatus: { in: BUCKET_STATUSES[status] } },
    };

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        select: lawyerSelect,
        // Newest first: by submission where there is one, else by last change.
        orderBy: [
          { lawyerProfile: { submittedAt: 'desc' } },
          { lawyerProfile: { updatedAt: 'desc' } },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return { rows, total, page, limit };
  }

  private toRequest(row: LawyerRow) {
    const profile = row.lawyerProfile;
    return {
      id: row.id,
      name: row.fullName ?? '',
      phone: row.phone ?? '',
      email: row.email ?? '',
      barId: profile?.enrollmentNumber ?? '',
      // Registration does not ask for a city yet.
      city: null,
      barCouncilState: profile?.barCouncilState ?? null,
      experience: profile?.experienceBand ?? '',
      status: profile?.onboardingStatus ?? 'draft',
      submittedOn: isoDate(profile?.submittedAt ?? profile?.updatedAt ?? row.createdAt),
    };
  }
}

const notReviewable = (status: OnboardingStatus) =>
  new AppException(
    HttpStatus.CONFLICT,
    'APPLICATION_NOT_REVIEWABLE',
    `This application is already ${status.replace('_', ' ')}.`,
  );
