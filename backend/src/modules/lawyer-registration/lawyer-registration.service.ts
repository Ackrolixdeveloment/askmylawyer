import { HttpStatus, Injectable } from '@nestjs/common';
import { LawyerDocumentType, OnboardingStatus, Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { AppException } from '../../common/app-exception';
import { encryptField } from '../../common/field-encryption';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { StorageService } from '../../infrastructure/storage/storage.service';
import type { BankDto, KycDto, PersonalDto, ProfessionalDto, ProfileDto } from './dto/registration.dto';
import { checkFile, EXTENSIONS, FILE_RULES, type FileRule } from './file-rules';

type UploadedFiles = Partial<Record<string, Express.Multer.File[]>>;

interface PendingUpload {
  type: LawyerDocumentType;
  file: Express.Multer.File;
  mimeType: string;
  extension: string;
}

/** The application can only be changed before it is submitted, or when sent back for correction. */
const EDITABLE: OnboardingStatus[] = ['draft', 'correction_requested'];

/**
 * During a correction only the flagged sections may be changed; everything
 * the admin approved is read-only. These are the blocks each step covers.
 */
const STEP_BLOCKS = {
  kyc: ['Aadhar Card', 'PAN Card'],
  professional: ['Certificate'],
  bank: ['Bank Details'],
  profile: ['Professional Profile'],
} as const;

const locked = (what: string) =>
  new AppException(
    HttpStatus.CONFLICT,
    'SECTION_LOCKED',
    `${what} cannot be changed: this section was approved by our team. Contact support if something is wrong.`,
  );

const STEPS = [
  { key: 'personal', field: 'personalCompletedAt', label: 'Personal Information' },
  { key: 'kyc', field: 'kycCompletedAt', label: 'KYC Verification' },
  { key: 'professional', field: 'professionalCompletedAt', label: 'Professional Verification' },
  { key: 'bank', field: 'bankCompletedAt', label: 'Bank Details' },
  { key: 'profile', field: 'profileCompletedAt', label: 'Professional Profile' },
] as const;

@Injectable()
export class LawyerRegistrationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  /** Everything saved so far, for resuming the flow on any device. */
  async get(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        phone: true,
        email: true,
        emailVerifiedAt: true,
        fullName: true,
        lawyerProfile: true,
        bankAccount: true,
        documents: true,
        identities: { select: { provider: true } },
      },
    });
    const profile = user.lawyerProfile!;
    const bank = user.bankAccount;
    const doc = (type: LawyerDocumentType) => {
      const found = user.documents.find((item) => item.type === type);
      return found
        ? {
            name: found.originalName,
            mimeType: found.mimeType,
            sizeBytes: found.sizeBytes,
            uploadedAt: found.updatedAt,
            url: `/api/v1/lawyer/registration/documents/${type}`,
          }
        : null;
    };

    const completedSteps = STEPS.filter((step) => profile[step.field]).map((step) => step.key);

    return {
      onboardingStatus: profile.onboardingStatus,
      canEdit: EDITABLE.includes(profile.onboardingStatus),
      submittedAt: profile.submittedAt,
      // Set when an admin sends the application back or turns it down.
      rejectionReason: profile.rejectionReason,
      correctionNotes: (profile.correctionNotes ?? null) as Record<string, string> | null,
      completedSteps,
      canSubmit:
        EDITABLE.includes(profile.onboardingStatus) && completedSteps.length === STEPS.length,
      personal: {
        fullName: user.fullName,
        email: user.email,
        emailVerified: Boolean(user.emailVerifiedAt),
        // A Google / Apple address cannot be swapped for another one.
        emailLocked: user.identities.length > 0,
        mobile: user.phone,
      },
      kyc: {
        method: profile.kycMethod,
        aadhaarNumberMasked: profile.aadhaarLast4 ? `XXXX XXXX ${profile.aadhaarLast4}` : null,
        panNumber: profile.panNumber,
        residentialAddress: profile.residentialAddress,
        aadhaarFile: doc('aadhaar'),
        panFile: doc('pan'),
      },
      professional: {
        qualification: profile.qualification,
        barCouncilState: profile.barCouncilState,
        enrollmentNumber: profile.enrollmentNumber,
        certificate: doc('bar_certificate'),
      },
      bank: bank
        ? {
            accountHolderName: bank.holderName,
            accountNumberMasked: `XXXXXX${bank.accountLast4}`,
            ifscCode: bank.ifscCode,
            bankName: bank.bankName,
            swiftCode: bank.swiftCode,
            proof: doc('bank_proof'),
          }
        : null,
      profile: {
        about: profile.about,
        experience: profile.experienceBand,
        languages: profile.languages,
        caseCategories: profile.caseCategories,
        specialisations: profile.specialisations,
        photo: doc('profile_photo'),
        signature: doc('signature'),
      },
    };
  }

  /** Step 1 */
  async savePersonal(userId: string, dto: PersonalDto) {
    const profile = await this.assertEditable(userId);
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { phone: true, email: true, fullName: true },
    });

    // Personal details are the base the review is built on: during a
    // correction they are read-only, apart from anything left blank.
    if (this.flagged(profile)) {
      const changed =
        (user.fullName && user.fullName !== dto.fullName) ||
        (user.email && user.email !== dto.email);
      if (changed) {
        throw new AppException(
          HttpStatus.CONFLICT,
          'SECTION_LOCKED',
          'Your name and email cannot be changed during a correction. Contact support if something is wrong.',
        );
      }
    }

    const data: Prisma.UserUpdateInput = { fullName: dto.fullName };

    if (dto.email !== user.email) {
      const taken = await this.prisma.user.findFirst({
        where: { email: dto.email, role: 'lawyer', id: { not: userId } },
        select: { id: true },
      });
      if (taken) throw emailInUse();
      data.email = dto.email;
      data.emailVerifiedAt = null;
    }

    if (!user.phone) {
      if (!dto.mobile) {
        throw new AppException(
          HttpStatus.BAD_REQUEST,
          'MOBILE_REQUIRED',
          'Enter your mobile number.',
        );
      }
      const phone = `+91${dto.mobile}`;
      const taken = await this.prisma.user.findFirst({
        where: { phone, role: 'lawyer', id: { not: userId } },
        select: { id: true },
      });
      if (taken) throw mobileInUse();
      data.phone = phone;
    }

    try {
      await this.prisma.$transaction([
        this.prisma.user.update({ where: { id: userId }, data }),
        this.prisma.lawyerProfile.update({
          where: { userId },
          data: { personalCompletedAt: new Date() },
        }),
      ]);
    } catch (error) {
      // Lost a race for the same email / phone.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw String(error.meta?.target).includes('email') ? emailInUse() : mobileInUse();
      }
      throw error;
    }

    return this.get(userId);
  }

  /** Step 2 */
  async saveKyc(userId: string, dto: KycDto, files: UploadedFiles) {
    const profile = await this.assertEditable(userId);
    const flagged = this.assertStepOpen(profile, 'kyc', 'Your identity documents');

    // Half-flagged step: leave the approved document exactly as it is.
    if (flagged && !flagged.has('Aadhar Card')) {
      if (dto.aadhaarNumber || files.aadhaarFile?.length) {
        throw locked('Your Aadhaar card');
      }
    }
    if (flagged && !flagged.has('PAN Card')) {
      if (files.panFile?.length || dto.panNumber !== profile.panNumber) {
        throw locked('Your PAN card');
      }
    }

    const uploads = await this.prepareUploads(userId, files, [
      { field: 'aadhaarFile', type: 'aadhaar', rule: FILE_RULES.idImage, label: 'Aadhaar card', required: true },
      { field: 'panFile', type: 'pan', rule: FILE_RULES.idImage, label: 'PAN card', required: true },
    ]);

    // Blank means "keep what is stored" — the number never leaves the server.
    if (!dto.aadhaarNumber) {
      const stored = await this.prisma.lawyerProfile.findUnique({
        where: { userId },
        select: { aadhaarNumberEnc: true },
      });
      if (!stored?.aadhaarNumberEnc) {
        throw new AppException(
          HttpStatus.BAD_REQUEST,
          'AADHAAR_REQUIRED',
          'Enter your Aadhaar number.',
        );
      }
    }

    await this.storeUploads(userId, uploads);
    await this.prisma.lawyerProfile.update({
      where: { userId },
      data: {
        kycMethod: 'manual',
        ...(dto.aadhaarNumber
          ? {
              aadhaarNumberEnc: encryptField(dto.aadhaarNumber),
              aadhaarLast4: dto.aadhaarNumber.slice(-4),
            }
          : {}),
        panNumber: dto.panNumber,
        residentialAddress: dto.residentialAddress || null,
        kycCompletedAt: new Date(),
      },
    });

    return this.get(userId);
  }

  /** Step 3 */
  async saveProfessional(userId: string, dto: ProfessionalDto, files: UploadedFiles) {
    const profile = await this.assertEditable(userId);
    this.assertStepOpen(profile, 'professional', 'Your bar council details');
    const uploads = await this.prepareUploads(userId, files, [
      {
        field: 'certificate',
        type: 'bar_certificate',
        rule: FILE_RULES.certificate,
        label: 'Bar Council certificate',
        required: true,
      },
    ]);

    await this.storeUploads(userId, uploads);
    await this.prisma.lawyerProfile.update({
      where: { userId },
      data: {
        qualification: dto.qualification,
        barCouncilState: dto.barCouncilState,
        enrollmentNumber: dto.enrollmentNumber,
        professionalCompletedAt: new Date(),
      },
    });

    return this.get(userId);
  }

  /** Step 4 */
  async saveBank(userId: string, dto: BankDto, files: UploadedFiles) {
    const profile = await this.assertEditable(userId);
    this.assertStepOpen(profile, 'bank', 'Your bank details');
    const stored = await this.prisma.lawyerBankAccount.findUnique({
      where: { userId },
      select: { accountNumberEnc: true, accountLast4: true },
    });

    // Blank means "keep the account already on file".
    if (!dto.accountNumber && !stored) {
      throw new AppException(
        HttpStatus.BAD_REQUEST,
        'ACCOUNT_NUMBER_REQUIRED',
        'Enter your bank account number.',
      );
    }
    if (dto.accountNumber && dto.accountNumber !== dto.confirmAccountNumber) {
      throw new AppException(
        HttpStatus.BAD_REQUEST,
        'ACCOUNT_NUMBER_MISMATCH',
        'Account numbers do not match.',
      );
    }

    const uploads = await this.prepareUploads(userId, files, [
      { field: 'proof', type: 'bank_proof', rule: FILE_RULES.idImage, label: 'Cancelled cheque', required: true },
    ]);

    const account = {
      holderName: dto.accountHolderName,
      accountNumberEnc: dto.accountNumber
        ? encryptField(dto.accountNumber)
        : stored!.accountNumberEnc,
      accountLast4: dto.accountNumber
        ? dto.accountNumber.slice(-4)
        : stored!.accountLast4,
      ifscCode: dto.ifscCode,
      bankName: dto.bankName,
      swiftCode: dto.swiftCode ?? null,
    };

    await this.storeUploads(userId, uploads);
    await this.prisma.$transaction([
      this.prisma.lawyerBankAccount.upsert({
        where: { userId },
        create: { userId, ...account },
        update: account,
      }),
      this.prisma.lawyerProfile.update({
        where: { userId },
        data: { bankCompletedAt: new Date() },
      }),
    ]);

    return this.get(userId);
  }

  /** Professional profile (last screen before submitting). */
  async saveProfile(userId: string, dto: ProfileDto, files: UploadedFiles) {
    const profile = await this.assertEditable(userId);
    this.assertStepOpen(profile, 'profile', 'Your professional profile');
    const uploads = await this.prepareUploads(userId, files, [
      { field: 'photo', type: 'profile_photo', rule: FILE_RULES.profileImage, label: 'Profile photo', required: false },
      { field: 'signature', type: 'signature', rule: FILE_RULES.profileImage, label: 'Signature', required: false },
    ]);

    await this.storeUploads(userId, uploads);
    await this.prisma.lawyerProfile.update({
      where: { userId },
      data: {
        about: dto.about,
        experienceBand: dto.experience,
        languages: dto.languages,
        caseCategories: dto.caseCategories,
        specialisations: dto.specialisations,
        profileCompletedAt: new Date(),
      },
    });

    return this.get(userId);
  }

  /** Sends the application for admin review. */
  async submit(userId: string) {
    const profile = await this.assertEditable(userId);

    const missing = STEPS.filter((step) => !profile[step.field]).map((step) => step.label);
    if (missing.length > 0) {
      throw new AppException(
        HttpStatus.BAD_REQUEST,
        'APPLICATION_INCOMPLETE',
        `Please complete: ${missing.join(', ')}.`,
      );
    }

    // Guarded on the status we read, so a double tap can't submit twice.
    const { count } = await this.prisma.lawyerProfile.updateMany({
      where: { userId, onboardingStatus: profile.onboardingStatus },
      data: {
        onboardingStatus:
          profile.onboardingStatus === 'correction_requested' ? 'resubmitted' : 'submitted',
        submittedAt: new Date(),
      },
    });
    if (count === 0) throw applicationLocked();

    return this.get(userId);
  }

  /** The lawyer's own uploaded file, for previewing it in the app. */
  async getDocument(userId: string, type: LawyerDocumentType) {
    const document = await this.prisma.lawyerDocument.findUnique({
      where: { userId_type: { userId, type } },
    });
    if (!document) {
      throw new AppException(HttpStatus.NOT_FOUND, 'DOCUMENT_NOT_FOUND', 'This file has not been uploaded.');
    }
    return { document, body: await this.storage.get(document.storageKey) };
  }

  // ---- Helpers ----

  private async assertEditable(userId: string) {
    const profile = await this.prisma.lawyerProfile.findUnique({ where: { userId } });
    if (!profile) {
      throw new AppException(HttpStatus.NOT_FOUND, 'PROFILE_NOT_FOUND', 'Lawyer profile not found.');
    }
    if (!EDITABLE.includes(profile.onboardingStatus)) throw applicationLocked();
    return profile;
  }

  /**
   * The sections an admin flagged, or null while the application is still a
   * draft — then everything is open.
   */
  private flagged(profile: { onboardingStatus: OnboardingStatus; correctionNotes: unknown }) {
    if (profile.onboardingStatus !== 'correction_requested') return null;
    return new Set(Object.keys((profile.correctionNotes ?? {}) as Record<string, string>));
  }

  /** Throws when a step is closed for editing. */
  private assertStepOpen(
    profile: { onboardingStatus: OnboardingStatus; correctionNotes: unknown },
    step: keyof typeof STEP_BLOCKS,
    label: string,
  ) {
    const flagged = this.flagged(profile);
    if (!flagged) return null;

    if (!STEP_BLOCKS[step].some((block) => flagged.has(block))) throw locked(label);
    return flagged;
  }

  /** Validates every file before anything is stored, so a bad second file doesn't leave the first behind. */
  private async prepareUploads(
    userId: string,
    files: UploadedFiles,
    fields: {
      field: string;
      type: LawyerDocumentType;
      rule: FileRule;
      label: string;
      required: boolean;
    }[],
  ): Promise<PendingUpload[]> {
    const existing = await this.prisma.lawyerDocument.findMany({
      where: { userId, type: { in: fields.map((field) => field.type) } },
      select: { type: true },
    });

    const uploads: PendingUpload[] = [];
    for (const field of fields) {
      const file = files[field.field]?.[0];
      if (!file) {
        // Re-saving a step keeps the file already on record.
        if (field.required && !existing.some((doc) => doc.type === field.type)) {
          throw new AppException(HttpStatus.BAD_REQUEST, 'FILE_REQUIRED', `Upload your ${field.label}.`);
        }
        continue;
      }
      const mimeType = checkFile(file, field.rule, field.label);
      uploads.push({ type: field.type, file, mimeType, extension: EXTENSIONS[mimeType as keyof typeof EXTENSIONS] });
    }
    return uploads;
  }

  private async storeUploads(userId: string, uploads: PendingUpload[]) {
    for (const upload of uploads) {
      const key = `lawyers/${userId}/${upload.type}/${randomUUID()}${upload.extension}`;
      await this.storage.put(key, upload.file.buffer, upload.mimeType);

      const previous = await this.prisma.lawyerDocument.findUnique({
        where: { userId_type: { userId, type: upload.type } },
        select: { storageKey: true },
      });

      const data = {
        storageKey: key,
        originalName: upload.file.originalname.slice(0, 255),
        mimeType: upload.mimeType,
        sizeBytes: upload.file.size,
      };
      await this.prisma.lawyerDocument.upsert({
        where: { userId_type: { userId, type: upload.type } },
        create: { userId, type: upload.type, ...data },
        update: data,
      });

      if (previous) await this.storage.delete(previous.storageKey);
    }
  }
}

const applicationLocked = () =>
  new AppException(
    HttpStatus.CONFLICT,
    'APPLICATION_LOCKED',
    'Your application has been submitted and can no longer be edited.',
  );

const emailInUse = () =>
  new AppException(
    HttpStatus.CONFLICT,
    'EMAIL_IN_USE',
    'This email is already used by another lawyer account.',
  );

const mobileInUse = () =>
  new AppException(
    HttpStatus.CONFLICT,
    'MOBILE_IN_USE',
    'This mobile number is already used by another lawyer account.',
  );
