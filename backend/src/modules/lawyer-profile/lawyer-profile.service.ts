import { HttpStatus, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { AppException } from '../../common/app-exception';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { StorageService } from '../../infrastructure/storage/storage.service';
import { encryptField } from '../../common/field-encryption';
import { checkFile, EXTENSIONS, FILE_RULES } from '../lawyer-registration/file-rules';
import type { UpdateBankDto, UpdateProfileDto } from './dto/update-profile.dto';

/** The only section that needs an admin's sign-off today. */
export const BANK_SECTION = 'Bank Details';

/** Everything the lawyer's own account screens show about them. */
@Injectable()
export class LawyerProfileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  /** Saves whichever sections the app sent. */
  async update(userId: string, dto: UpdateProfileDto) {
    const data = {
      ...(dto.about !== undefined ? { about: dto.about } : {}),
      ...(dto.experience !== undefined ? { experienceBand: dto.experience } : {}),
      ...(dto.languages ? { languages: dto.languages } : {}),
      ...(dto.specialisations ? { specialisations: dto.specialisations } : {}),
      ...(dto.caseCategories ? { caseCategories: dto.caseCategories } : {}),
      ...(dto.consultationTypes ? { consultationTypes: dto.consultationTypes } : {}),
    };

    if (Object.keys(data).length === 0) {
      throw new AppException(
        HttpStatus.BAD_REQUEST,
        'NOTHING_TO_UPDATE',
        'No profile changes were sent.',
      );
    }

    await this.prisma.lawyerProfile.update({ where: { userId }, data });
    return this.get(userId);
  }

  /**
   * Asks for the payout account to be changed. Money keeps going to the
   * account already on file until an admin approves this one.
   */
  async requestBankChange(
    userId: string,
    dto: UpdateBankDto,
    proof: Express.Multer.File | undefined,
  ) {
    if (dto.accountNumber !== dto.confirmAccountNumber) {
      throw new AppException(
        HttpStatus.BAD_REQUEST,
        'ACCOUNT_NUMBER_MISMATCH',
        'Account numbers do not match.',
      );
    }
    if (!proof) {
      throw new AppException(
        HttpStatus.BAD_REQUEST,
        'FILE_REQUIRED',
        'Upload a cancelled cheque for the new account.',
      );
    }

    const pending = await this.prisma.lawyerEditRequest.findFirst({
      where: { userId, section: BANK_SECTION, status: 'pending' },
      select: { id: true },
    });
    if (pending) {
      throw new AppException(
        HttpStatus.CONFLICT,
        'CHANGE_ALREADY_PENDING',
        'Your last bank change is still being reviewed by our team.',
      );
    }

    // The cheque is kept aside; it only replaces the live one on approval.
    const mimeType = checkFile(proof, FILE_RULES.idImage, 'Cancelled cheque');
    const key = `lawyers/${userId}/bank_proof_pending/${randomUUID()}${EXTENSIONS[mimeType]}`;
    await this.storage.put(key, proof.buffer, mimeType);

    await this.prisma.lawyerEditRequest.create({
      data: {
        userId,
        section: BANK_SECTION,
        payload: {
          holderName: dto.accountHolderName,
          accountNumberEnc: encryptField(dto.accountNumber),
          accountLast4: dto.accountNumber.slice(-4),
          ifscCode: dto.ifscCode,
          bankName: dto.bankName,
          swiftCode: dto.swiftCode ?? null,
        },
        proofKey: key,
        proofName: proof.originalname.slice(0, 255),
        proofMime: mimeType,
        proofSize: proof.size,
      },
    });

    return this.get(userId);
  }

  /** Replaces the photo customers see. */
  async savePhoto(userId: string, file: Express.Multer.File | undefined) {
    if (!file) {
      throw new AppException(HttpStatus.BAD_REQUEST, 'FILE_REQUIRED', 'Choose a photo.');
    }

    await this.storeDocument(userId, 'profile_photo', file, FILE_RULES.profileImage, 'Profile photo');
    return this.get(userId);
  }

  /** Stores a file and drops the one it replaces. */
  private async storeDocument(
    userId: string,
    type: 'profile_photo' | 'bank_proof',
    file: Express.Multer.File,
    rule: (typeof FILE_RULES)[keyof typeof FILE_RULES],
    label: string,
  ) {
    const mimeType = checkFile(file, rule, label);
    const key = `lawyers/${userId}/${type}/${randomUUID()}${EXTENSIONS[mimeType]}`;
    await this.storage.put(key, file.buffer, mimeType);

    const previous = await this.prisma.lawyerDocument.findUnique({
      where: { userId_type: { userId, type } },
      select: { storageKey: true },
    });

    const document = {
      storageKey: key,
      originalName: file.originalname.slice(0, 255),
      mimeType,
      sizeBytes: file.size,
    };
    await this.prisma.lawyerDocument.upsert({
      where: { userId_type: { userId, type } },
      create: { userId, type, ...document },
      update: document,
    });

    if (previous) await this.storage.delete(previous.storageKey);
  }

  async get(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        phone: true,
        email: true,
        emailVerifiedAt: true,
        status: true,
        createdAt: true,
        lawyerProfile: true,
        bankAccount: true,
        documents: { select: { type: true, updatedAt: true } },
        editRequests: {
          where: { section: BANK_SECTION },
          orderBy: { requestedAt: 'desc' },
          take: 1,
        },
      },
    });

    const profile = user.lawyerProfile!;
    const bank = user.bankAccount;
    const photo = user.documents.find((doc) => doc.type === 'profile_photo');
    const latestEdit = user.editRequests[0];
    const pendingBank = (latestEdit?.payload ?? {}) as {
      holderName: string;
      accountLast4: string;
      ifscCode: string;
      bankName: string;
      swiftCode: string | null;
    };

    return {
      id: user.id,
      fullName: user.fullName,
      mobile: user.phone,
      email: user.email,
      emailVerified: Boolean(user.emailVerifiedAt),
      status: user.status,
      onboardingStatus: profile.onboardingStatus,
      /** Live to customers only once the application is approved. */
      isVerified: profile.onboardingStatus === 'approved',
      memberSince: user.createdAt,

      // The line under the name, e.g. "Criminal, Family".
      headline: profile.specialisations.join(', '),
      specialisations: profile.specialisations,
      caseCategories: profile.caseCategories,
      consultationTypes: profile.consultationTypes,
      languages: profile.languages,
      experience: profile.experienceBand,
      about: profile.about,
      photoUrl: photo
        ? `/api/v1/lawyer/registration/documents/profile_photo?v=${photo.updatedAt.getTime()}`
        : null,

      barCouncil: {
        number: profile.enrollmentNumber,
        state: profile.barCouncilState,
        qualification: profile.qualification,
      },

      // Waiting on an admin; the account above still receives payouts.
      pendingBank:
        latestEdit?.status === 'pending'
          ? {
              holderName: pendingBank.holderName,
              bankName: pendingBank.bankName,
              accountNumberMasked: `**** ${pendingBank.accountLast4}`,
              ifscCode: pendingBank.ifscCode,
              swiftCode: pendingBank.swiftCode,
              requestedAt: latestEdit.requestedAt,
            }
          : null,
      /// Set when the last request was turned down, so the lawyer learns why.
      bankChangeFeedback:
        latestEdit?.status === 'rejected' ? latestEdit.feedback : null,
      bank: bank
        ? {
            proofFileName:
              user.documents.find((doc) => doc.type === 'bank_proof')?.updatedAt != null
                ? 'Cancelled cheque on file'
                : null,
            holderName: bank.holderName,
            bankName: bank.bankName,
            accountNumberMasked: `**** ${bank.accountLast4}`,
            ifscCode: bank.ifscCode,
            swiftCode: bank.swiftCode,
          }
        : null,
    };
  }
}
