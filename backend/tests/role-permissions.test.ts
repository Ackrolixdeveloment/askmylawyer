import 'reflect-metadata';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { AdminAuthService } from '../src/modules/admin-auth/admin-auth.service';
import { AdminUsersService } from '../src/modules/admin-users/admin-users.service';
import { requirementFor, satisfies } from '../src/modules/admin-auth/route-permissions';
function fixture() {
 const role={id:'role',name:'Support',isSystem:false,status:'active',permissions:{customers:'read'}};
 const admin={id:'member',status:'active',permissions:{customers:'full',billing:'full'},role};
 const prisma={adminSession:{findUnique:async()=>({adminUserId:'member',expiresAt:new Date(Date.now()+60000),revokedAt:null})},adminUser:{findFirst:async()=>admin}};
 return {role,service:new AdminAuthService(prisma as any,{} as any)};
}
test('live access inherits role permissions and ignores legacy overrides',async()=>{
 const f=fixture();const p=await f.service.validateAccess({sub:'member',sid:'s',typ:'admin'});
 assert.equal(satisfies(p?.permissions,{key:'customers',level:'read'}),true);
 assert.equal(satisfies(p?.permissions,{key:'customers',level:'full'}),false);
 assert.equal(satisfies(p?.permissions,{key:'billing',level:'read'}),false);
 f.role.permissions.customers='none';
 assert.equal(satisfies((await f.service.validateAccess({sub:'member',sid:'s',typ:'admin'}))?.permissions,{key:'customers',level:'read'}),false);
});
test('inactive role blocks an existing non-system session',async()=>{const f=fixture();f.role.status='inactive';assert.equal(await f.service.validateAccess({sub:'member',sid:'s',typ:'admin'}),null);});
test('role edits notify every assigned user and protect Super Admin',async()=>{
 const published:any[]=[];let stored:any;
 const role={id:'role',name:'Support',isSystem:false,department:null,permissions:{},_count:{admins:2}};
 const prisma={role:{findUnique:async()=>role,update:async(args:any)=>{stored=args.data.permissions;}},adminUser:{findMany:async()=>[{id:'a'},{id:'b'}]}};
 const service=new AdminUsersService(prisma as any,{publishMany:(...args:any[])=>published.push(args)} as any,{} as any);
 await service.setRolePermissions('role',{customers:'read'});assert.equal(stored.customers,'read');assert.deepEqual(published,[[['a','b'],'permissions']]);
 role.isSystem=true;await assert.rejects(()=>service.setRolePermissions('role',{customers:'none'}));
});
test('per-user permission writes are rejected',async()=>{const service=new AdminUsersService({} as any,{} as any,{} as any);await assert.rejects(()=>service.setPermissions('member',{customers:'full'}));});
test('role access and ticket categories use correct endpoint permissions',()=>{assert.deepEqual(requirementFor('PUT','/api/v1/admin/roles/id/permissions'),{key:'users.roles',level:'full'});assert.deepEqual(requirementFor('GET','/api/v1/admin/categories'),{key:'support.categories',level:'read'});});
