import { Controller,Get,Injectable,Module,Query,UseGuards,HttpStatus } from '@nestjs/common';
import { AppException } from '../../common/app-exception';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { AdminAuthModule } from '../admin-auth/admin-auth.module';
import { AdminAuthGuard } from '../admin-auth/admin-auth.guard';
import { BillingQuery } from '../admin-billing/billing.dto';
import { billingFilters,ledger } from '../admin-billing/billing.service';
@Injectable()
export class DashboardService {
 constructor(private readonly prisma:PrismaService){}
 async overview(q:BillingQuery){
  // Validate dates using the same IST calendar semantics as billing.
  billingFilters(q);
  const today=new Date(Date.now()+19800000).toISOString().slice(0,10);const to=q.to??today;const from=q.from??new Date(Date.parse(to+'T00:00:00Z')-29*86400000).toISOString().slice(0,10);
  billingFilters({...q,from,to});
  const start=new Date(from+'T00:00:00+05:30');const end=new Date(Date.parse(to+'T00:00:00+05:30')+86400000);
  if(end.getTime()-start.getTime()>3660*86400000)throw new AppException(HttpStatus.BAD_REQUEST,'DATE_RANGE_TOO_LARGE','Choose a date range of up to 10 years.');
  // Keep chart result size bounded without changing the requested totals.
  const monthly=(end.getTime()-start.getTime())/86400000>93;const unit=monthly?'month':'day';
  const [users,sessions,money,series,recent]=await this.prisma.$transaction([
   this.prisma.$queryRaw<any[]>(Prisma.sql`SELECT COUNT(*) FILTER(WHERE role::text='customer' AND deleted_at IS NULL)::int AS customers,COUNT(*) FILTER(WHERE role::text='lawyer' AND deleted_at IS NULL)::int AS lawyers,COUNT(*) FILTER(WHERE role::text='customer' AND created_at>=${start} AND created_at<${end})::int AS new_customers,COUNT(*) FILTER(WHERE role::text='lawyer' AND created_at>=${start} AND created_at<${end})::int AS new_lawyers FROM users`),
   this.prisma.$queryRaw<any[]>(Prisma.sql`SELECT status::text,COUNT(*)::int AS count FROM consultation_requests WHERE created_at>=${start} AND created_at<${end} GROUP BY status`),
   this.prisma.$queryRaw<any[]>(Prisma.sql`${ledger} SELECT COALESCE(SUM(collected) FILTER(WHERE environment='live' AND paid_at>=${start} AND paid_at<${end}),0)::float8 AS collected,COALESCE(SUM(refunded) FILTER(WHERE environment='live' AND refunded_at>=${start} AND refunded_at<${end}),0)::float8 AS refunded,COUNT(*) FILTER(WHERE environment IN ('sandbox','bypass') AND date>=${start} AND date<${end})::int AS test_records FROM ledger`),
   this.prisma.$queryRaw<any[]>(Prisma.sql`${ledger}, days AS (SELECT generate_series(date_trunc(${unit},${start}::timestamptz AT TIME ZONE 'Asia/Kolkata'),date_trunc(${unit},(${end}::timestamptz-interval '1 second') AT TIME ZONE 'Asia/Kolkata'),${monthly?'1 month':'1 day'}::interval) AS day), bookings AS (SELECT date_trunc(${unit},created_at AT TIME ZONE 'Asia/Kolkata') AS day,COUNT(*)::int AS count FROM consultation_requests WHERE created_at>=${start} AND created_at<${end} GROUP BY 1), payments AS (SELECT date_trunc(${unit},paid_at AT TIME ZONE 'Asia/Kolkata') AS day,SUM(collected)::float8 AS amount FROM ledger WHERE environment='live' AND paid_at>=${start} AND paid_at<${end} GROUP BY 1) SELECT to_char(d.day,'YYYY-MM-DD') AS day,COALESCE(b.count,0) AS consultations,COALESCE(p.amount,0)::float8 AS collected FROM days d LEFT JOIN bookings b USING(day) LEFT JOIN payments p USING(day) ORDER BY day`),
   this.prisma.consultationRequest.findMany({where:{createdAt:{gte:start,lt:end}},orderBy:{createdAt:'desc'},take:8,select:{id:true,number:true,status:true,createdAt:true,customer:{select:{fullName:true}},lawyer:{select:{fullName:true}}}})
  ]);
  return {from,to,monthly,users:users[0],statuses:sessions,money:money[0],series,recent:recent.map(r=>({id:r.id,code:r.number?`AML-${String(r.number).padStart(6,'0')}`:'Unnumbered',customer:r.customer.fullName??'Name not provided',lawyer:r.lawyer?.fullName??'Unassigned',status:r.status,date:r.createdAt}))};
 }
}
@Controller('admin/dashboard') @UseGuards(AdminAuthGuard)
class DashboardController {constructor(private readonly dashboard:DashboardService){} @Get() get(@Query() q:BillingQuery){return this.dashboard.overview(q);}}
@Module({imports:[AdminAuthModule],controllers:[DashboardController],providers:[DashboardService]})
export class DashboardModule {}
