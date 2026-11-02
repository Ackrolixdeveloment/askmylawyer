import { Controller, Get, Module, Param, Query, UseGuards } from '@nestjs/common';
import { AdminAuthModule } from '../admin-auth/admin-auth.module';
import { AdminAuthGuard } from '../admin-auth/admin-auth.guard';
import { BillingService } from './billing.service';
import { BillingQuery } from './billing.dto';
@Controller('admin/billing') @UseGuards(AdminAuthGuard)
class BillingController {
 constructor(private readonly billing:BillingService){}
 @Get() list(@Query() query:BillingQuery){return this.billing.list(query);}
 @Get(':id') detail(@Param('id') id:string){return this.billing.detail(id);}
}
@Module({imports:[AdminAuthModule],controllers:[BillingController],providers:[BillingService]})
export class BillingModule {}
