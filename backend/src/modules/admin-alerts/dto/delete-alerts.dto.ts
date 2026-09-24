import { ArrayMaxSize, IsArray, IsOptional, IsUUID } from 'class-validator';

export class DeleteAlertsDto {
  /** Leave it out to clear the whole list. */
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(200)
  @IsUUID('4', { each: true })
  ids?: string[];
}
