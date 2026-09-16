import { HttpStatus } from '@nestjs/common';
import { AppException } from '../../common/app-exception';

const MB = 1024 * 1024;

type DetectedType = 'image/png' | 'image/jpeg' | 'application/pdf';

export interface FileRule {
  types: DetectedType[];
  maxBytes: number;
  /** Shown in error messages, e.g. "PNG or JPEG, max 2 MB". */
  description: string;
}

/** Same limits the app enforces on each upload field. */
export const FILE_RULES = {
  idImage: { types: ['image/png', 'image/jpeg'], maxBytes: 2 * MB, description: 'PNG or JPEG, max 2 MB' },
  certificate: { types: ['application/pdf'], maxBytes: 5 * MB, description: 'PDF, max 5 MB' },
  profileImage: { types: ['image/png', 'image/jpeg'], maxBytes: 5 * MB, description: 'PNG or JPEG, max 5 MB' },
} satisfies Record<string, FileRule>;

export const EXTENSIONS: Record<DetectedType, string> = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'application/pdf': '.pdf',
};

/** Reads the file's real type from its first bytes — the client's MIME type is not trusted. */
function detectType(buffer: Buffer): DetectedType | null {
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return 'image/png';
  }
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg';
  if (buffer.subarray(0, 5).toString('latin1') === '%PDF-') return 'application/pdf';
  return null;
}

/** Returns the detected type, or throws a 400 naming the field. */
export function checkFile(file: Express.Multer.File, rule: FileRule, label: string): DetectedType {
  const type = detectType(file.buffer);
  if (!type || !rule.types.includes(type)) {
    throw new AppException(
      HttpStatus.BAD_REQUEST,
      'INVALID_FILE_TYPE',
      `${label} must be ${rule.description}.`,
    );
  }
  if (file.size > rule.maxBytes) {
    throw new AppException(
      HttpStatus.BAD_REQUEST,
      'FILE_TOO_LARGE',
      `${label} must be ${rule.description}.`,
    );
  }
  return type;
}
