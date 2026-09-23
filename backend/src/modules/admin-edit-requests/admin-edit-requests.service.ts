import { HttpStatus, Injectable } from "@nestjs/common";
import { EditRequestStatus, Prisma } from "@prisma/client";
import { AppException } from "../../common/app-exception";
import { PrismaService } from "../../infrastructure/prisma/prisma.service";
import { StorageService } from "../../infrastructure/storage/storage.service";
import { LawyerNotificationsService } from "../notifications/lawyer-notifications.service";

/** The requested account, as stored on the request. */
interface BankPayload {
  holderName: string;
  accountNumberEnc: string;
  accountLast4: string;
  ifscCode: string;
  bankName: string;
  swiftCode: string | null;
}

const requestSelect = {
  id: true,
  section: true,
  status: true,
  payload: true,
  proofName: true,
  requestedAt: true,
  decidedAt: true,
  feedback: true,
  user: {
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      bankAccount: true,
      documents: { select: { type: true, originalName: true } },
    },
  },
} satisfies Prisma.LawyerEditRequestSelect;

type RequestRow = Prisma.LawyerEditRequestGetPayload<{
  select: typeof requestSelect;
}>;

const isoDate = (value: Date) => value.toISOString().slice(0, 10);
/** Activity times read in IST, the timezone the admin team works in. */
const istTime = (value: Date) =>
  value
    .toLocaleTimeString("en-IN", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
    .toUpperCase();

const shortCode = (prefix: string, id: string) =>
  `${prefix}-${id.slice(0, 8).toUpperCase()}`;

/** Changes an approved lawyer asked for, waiting on an admin. */
@Injectable()
export class AdminEditRequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly notifications: LawyerNotificationsService,
  ) {}

  async list(status: EditRequestStatus) {
    const rows = await this.prisma.lawyerEditRequest.findMany({
      where: { status, user: { deletedAt: null } },
      select: requestSelect,
      orderBy: { requestedAt: "desc" },
    });

    return {
      data: rows.map((row) => this.toRequest(row)),
      meta: { total: rows.length },
    };
  }

  /** One row per lawyer who has ever asked for a change. */
  async history() {
    const rows = await this.prisma.lawyerEditRequest.findMany({
      where: { user: { deletedAt: null } },
      select: {
        status: true,
        requestedAt: true,
        user: {
          select: { id: true, fullName: true, email: true, phone: true },
        },
      },
      orderBy: { requestedAt: "desc" },
    });

    const byLawyer = new Map<string, ReturnType<typeof emptyHistoryRow>>();

    for (const row of rows) {
      const entry =
        byLawyer.get(row.user.id) ?? emptyHistoryRow(row.user, row.requestedAt);
      entry.totalRequests += 1;
      entry[row.status] += 1;
      byLawyer.set(row.user.id, entry);
    }

    const data = [...byLawyer.values()];
    return { data, meta: { total: data.length } };
  }

  async detail(id: string) {
    const row = await this.prisma.lawyerEditRequest.findUnique({
      where: { id },
      select: requestSelect,
    });
    if (!row) throw notFound();

    return this.toRequest(row);
  }

  /** Applies the change and points future payouts at the new account. */
  async approve(id: string, adminId: string) {
    const row = await this.pending(id);
    const payload = row.payload as unknown as BankPayload;

    const previousProof = row.user.documents.find(
      (doc) => doc.type === "bank_proof",
    );
    const account = {
      holderName: payload.holderName,
      accountNumberEnc: payload.accountNumberEnc,
      accountLast4: payload.accountLast4,
      ifscCode: payload.ifscCode,
      bankName: payload.bankName,
      swiftCode: payload.swiftCode,
    };

    const document = {
      storageKey: row.proofKey!,
      originalName: row.proofName ?? "cancelled-cheque",
      mimeType: row.proofMime ?? "image/png",
      sizeBytes: row.proofSize ?? 0,
    };

    const previousKey = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.lawyerDocument.findUnique({
        where: { userId_type: { userId: row.user.id, type: "bank_proof" } },
        select: { storageKey: true },
      });

      await tx.lawyerBankAccount.upsert({
        where: { userId: row.user.id },
        create: { userId: row.user.id, ...account },
        update: account,
      });
      await tx.lawyerDocument.upsert({
        where: { userId_type: { userId: row.user.id, type: "bank_proof" } },
        create: { userId: row.user.id, type: "bank_proof", ...document },
        update: document,
      });
      await tx.lawyerEditRequest.update({
        where: { id },
        data: {
          status: "approved",
          decidedAt: new Date(),
          decidedById: adminId,
        },
      });

      return existing?.storageKey ?? null;
    });

    // The old cheque is only dropped once the swap has committed.
    if (previousKey && previousKey !== row.proofKey)
      await this.storage.delete(previousKey);
    void previousProof;

    await this.notifications.bankChangeApproved(
      this.recipient(row),
      payload.accountLast4,
    );
    return this.detail(id);
  }

  /** Leaves the account alone and tells the lawyer why. */
  async reject(id: string, adminId: string, feedback: string) {
    const row = await this.pending(id);

    await this.prisma.lawyerEditRequest.update({
      where: { id },
      data: {
        status: "rejected",
        decidedAt: new Date(),
        decidedById: adminId,
        feedback,
      },
    });

    if (row.proofKey) await this.storage.delete(row.proofKey);

    await this.notifications.bankChangeRejected(this.recipient(row), feedback);
    return this.detail(id);
  }

  /** The cancelled cheque submitted with the request. */
  async proof(id: string) {
    const row = await this.prisma.lawyerEditRequest.findUnique({
      where: { id },
      select: { proofKey: true, proofName: true, proofMime: true },
    });
    if (!row?.proofKey) {
      throw new AppException(
        HttpStatus.NOT_FOUND,
        "DOCUMENT_NOT_FOUND",
        "No cheque was attached to this request.",
      );
    }

    return {
      body: await this.storage.get(row.proofKey),
      name: row.proofName ?? "cancelled-cheque",
      mimeType: row.proofMime ?? "application/octet-stream",
    };
  }

  // ---- Helpers ----

  private async pending(id: string) {
    const row = await this.prisma.lawyerEditRequest.findUnique({
      where: { id },
      select: {
        ...requestSelect,
        proofKey: true,
        proofMime: true,
        proofSize: true,
      },
    });
    if (!row) throw notFound();

    if (row.status !== "pending") {
      throw new AppException(
        HttpStatus.CONFLICT,
        "REQUEST_ALREADY_DECIDED",
        `This request was already ${row.status}.`,
      );
    }
    return row;
  }

  private recipient(row: RequestRow) {
    return { name: row.user.fullName || "there", email: row.user.email };
  }

  /** Laid out as the admin screens expect: current beside requested. */
  private toRequest(row: RequestRow) {
    const payload = row.payload as unknown as BankPayload;
    const current = row.user.bankAccount;
    const currentProof = row.user.documents.find(
      (doc) => doc.type === "bank_proof",
    );

    return {
      id: row.id,
      requestId: shortCode("REQ", row.id),
      lawyerId: shortCode("LAW", row.user.id),
      lawyerUserId: row.user.id,
      lawyerName: row.user.fullName ?? "",
      lawyerEmail: row.user.email ?? "",
      lawyerMobile: row.user.phone ?? "",
      section: row.section,
      status: row.status,
      requestedAt: isoDate(row.requestedAt),
      decidedAt: row.decidedAt ? isoDate(row.decidedAt) : null,
      feedback: row.feedback,
      changes: [
        {
          field: "Account Holder Name",
          currentValue: current?.holderName ?? "-",
          requestedValue: payload.holderName,
        },
        {
          field: "Account Number",
          // Encrypted at rest; the cheque is what proves the full number.
          currentValue: current ? `**** ${current.accountLast4}` : "-",
          requestedValue: `**** ${payload.accountLast4}`,
        },
        {
          field: "IFSC Code",
          currentValue: current?.ifscCode ?? "-",
          requestedValue: payload.ifscCode,
        },
        {
          field: "Bank Name",
          currentValue: current?.bankName ?? "-",
          requestedValue: payload.bankName,
        },
        {
          field: "SWIFT Code",
          currentValue: current?.swiftCode ?? "-",
          requestedValue: payload.swiftCode ?? "-",
        },
        {
          field: "Cancelled Cheque",
          currentValue: currentProof?.originalName ?? "-",
          requestedValue: row.proofName ?? "-",
          isDocument: true,
        },
      ],
    };
  }
}

const notFound = () =>
  new AppException(
    HttpStatus.NOT_FOUND,
    "REQUEST_NOT_FOUND",
    "This request was not found.",
  );

/** A history row before any request has been counted into it. */
function emptyHistoryRow(
  user: {
    id: string;
    fullName: string | null;
    email: string | null;
    phone: string | null;
  },
  latest: Date,
) {
  return {
    id: user.id,
    lawyerId: shortCode("LAW", user.id),
    name: user.fullName ?? "",
    email: user.email ?? "",
    mobile: user.phone ?? "",
    totalRequests: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    // The list is newest first, so the first row seen is the latest activity.
    latestActivityDate: isoDate(latest),
    latestActivityTime: istTime(latest),
  };
}
