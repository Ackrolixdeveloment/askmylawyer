import 'reflect-metadata';
import assert from 'node:assert/strict';
import {test} from 'node:test';
import {AdminSettingsService} from '../src/modules/admin-settings/admin-settings.service';
test('enabled media-specific price plans are rejected before any write',async()=>{
 const service=new AdminSettingsService({} as any);
 for(const code of ['audio','video','chat'])await assert.rejects(service.savePlans({plans:[{code,type:'Fixture',enabled:true,amount:100,commissionMode:'flat',commissionValue:0}] as any}),/included in one consultation/);
});
