import { Transform } from 'class-transformer';
import { IsString, Length } from 'class-validator';

/** A line typed during a consultation. */
export class SendMessageDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @Length(1, 2000, { message: 'Type something to send.' })
  body: string;
}
