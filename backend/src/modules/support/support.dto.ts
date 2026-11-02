import { Transform,Type } from 'class-transformer';
import { IsIn,IsInt,IsISO8601,IsOptional,IsString,IsUUID,Length,Matches,Max,Min,ValidateIf } from 'class-validator';
const trim=({value}:{value:unknown})=>typeof value==='string'?value.trim():value;
export class CreateTicketDto {
 @IsOptional() @Matches(/^[a-f0-9]{32}$/) clientKey?:string;
 @IsString() @Transform(trim) @Length(1,150) subject:string;
 @IsString() @Transform(trim) @Length(1,5000) description:string;
 @IsOptional() @IsUUID() categoryId?:string;
 @IsOptional() @IsUUID() requestId?:string;
}
export class SupportListDto {
 @IsOptional() @Type(()=>Number) @IsInt() @Min(1) page=1;
 @IsOptional() @Type(()=>Number) @IsInt() @Min(1) @Max(500) perPage=20;
 @IsOptional() @IsIn(['new','in_progress','escalated','resolved','closed']) status?:string;
 @IsOptional() @IsIn(['low','medium','high']) priority?:string;
 @IsOptional() @IsIn(['customer','lawyer']) reporterRole?:string;
 @IsOptional() @IsUUID() categoryId?:string;
 @IsOptional() @IsUUID() departmentId?:string;
 @IsOptional() @IsIn(['all','mine','unassigned']) assignment?:string;
 @IsOptional() @Transform(trim) @IsString() @Length(1,100) search?:string;
 @IsOptional() @IsIn(['createdAt','updatedAt','resolvedAt']) dateField?:string;
 @IsOptional() @Matches(/^\d{4}-\d{2}-\d{2}$/) from?:string;
 @IsOptional() @Matches(/^\d{4}-\d{2}-\d{2}$/) to?:string;
 @IsOptional() @IsIn(['createdAt','updatedAt','number','subject','status','priority']) sortBy?:string;
 @IsOptional() @IsIn(['asc','desc']) direction?:'asc'|'desc';
}
export class ReplyTicketDto { @IsString() @Transform(trim) @Length(1,5000) body:string; }
export class UpdateTicketDto {
 @IsISO8601() expectedUpdatedAt:string;
 @IsOptional() @IsIn(['new','in_progress','escalated','resolved','closed']) status?:string;
 @IsOptional() @IsIn(['low','medium','high']) priority?:string;
 @ValidateIf((_o,v)=>v!==undefined&&v!==null) @IsUUID() assignedToId?:string|null;
 @IsOptional() @IsString() @Transform(trim) @Length(1,5000) resolution?:string;
}
export class SupportCursorDto { @IsOptional() @IsUUID() before?:string; }
export class SupportLookupDto { @IsOptional() @IsIn(['new','in-progress','resolved']) bucket?:string; @IsOptional() @Transform(trim) @IsString() @Length(2,100) q?:string; @IsOptional() @IsUUID() departmentId?:string; }
