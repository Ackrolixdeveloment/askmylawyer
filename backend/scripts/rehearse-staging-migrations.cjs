#!/usr/bin/env node
/** Rehearses the audited 33 -> current migration path on synthetic PostgreSQL 18 data. */
const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname,'../..');
const backend = path.join(root,'backend');
const settings = JSON.parse(fs.readFileSync(path.join(root,'.local/staging/environment.json'),'utf8'));
const target = new URL(settings.DATABASE_URL);
assert.equal(target.hostname,'127.0.0.1'); assert.equal(target.port,'55434');
assert.equal(target.pathname,'/askmylawyer_staging');
const baseline = 'e0882d07b1362d35df865ec370f9547c0504c670';
const runId = new Date().toISOString().replace(/\D/g,'');
const directory = path.join(root,'.local/staging/rehearsals',runId);
const baselineDir = path.join(directory,'baseline');
fs.mkdirSync(baselineDir,{recursive:true,mode:0o700});
const docker = process.env.AML_DOCKER || (fs.existsSync('/Users/simranackrolix/.local/bin/docker') ? '/Users/simranackrolix/.local/bin/docker' : 'docker');
const compose = ['compose','-f',path.join(root,'infra/local-staging/compose.yml')];
const commonEnv = {...process.env,...settings};
function run(bin,args,{env=commonEnv,...options}={}) {
  const result=cp.spawnSync(bin,args,{cwd:bin==='git'?root:backend,env,encoding:'utf8',stdio:[options.input===undefined?'ignore':'pipe','pipe','pipe'],...options});
  if(result.error||result.status!==0){fs.writeFileSync(path.join(directory,'command-error.log'),String(result.stdout||'')+String(result.stderr||'')+String(result.error||''),{mode:0o600});throw Error(`${path.basename(bin)} ${args[0]} failed; inspect private rehearsal logs.`);}
  return result;
}
function dbUrl(name){const u=new URL(settings.DATABASE_URL);u.pathname='/'+name;return u.toString();}
function command(args,options){return run(docker,[...compose,'exec','-T','postgres',...args],options);}
const name='aml_rehearsal_'+runId,restoreName='aml_restore_'+runId;
const url=dbUrl(name),restoreUrl=dbUrl(restoreName);
const prisma=path.join(backend,'node_modules/prisma/build/index.js');
let oldClient,currentClient,restoredClient;
(async()=>{
  const paths=run('git',['ls-tree','-r','--name-only',baseline,'--','backend/prisma']).stdout.trim().split('\n').filter(p=>p.endsWith('schema.prisma')||p.startsWith('backend/prisma/migrations/'));
  for(const file of paths){const destination=path.join(baselineDir,path.relative('backend/prisma',file));fs.mkdirSync(path.dirname(destination),{recursive:true});let content=run('git',['show',baseline+':'+file]).stdout;if(file.endsWith('schema.prisma'))content=content.replace('provider = "prisma-client-js"','provider = "prisma-client-js"\n  output = "./client"');fs.writeFileSync(destination,content);}
  command(['createdb','-U','aml_stage',name]);
  const oldSchema=path.join(baselineDir,'schema.prisma');
  fs.writeFileSync(path.join(baselineDir,'package.json'),JSON.stringify({private:true,name:'aml-local-migration-rehearsal'})+'\n');
  fs.symlinkSync(path.join(backend,'node_modules'),path.join(baselineDir,'node_modules'),'dir');
  const log=run(process.execPath,[prisma,'migrate','deploy','--schema',oldSchema],{env:{...commonEnv,DATABASE_URL:url}});fs.writeFileSync(path.join(directory,'baseline-migrations.log'),log.stdout+log.stderr);
  run(process.execPath,[prisma,'generate','--schema',oldSchema],{env:{...commonEnv,DATABASE_URL:url,PRISMA_GENERATE_SKIP_AUTOINSTALL:'true'}});
  const Old=require(path.join(baselineDir,'client')).PrismaClient;
  oldClient=new Old({datasources:{db:{url}}});
  const before=await oldClient.$queryRawUnsafe('SELECT migration_name FROM _prisma_migrations WHERE finished_at IS NOT NULL ORDER BY migration_name');assert.equal(before.length,33);
  const customer=await oldClient.user.create({data:{role:'customer',fullName:'Synthetic migration fixture'}});
  const request=await oldClient.consultationRequest.create({data:{customerId:customer.id,planCode:'rehearsal',planName:'Synthetic legacy consultation',amount:500,durationMinutes:15,status:'completed'}});
  const payment=await oldClient.consultationPayment.create({data:{requestId:request.id,orderId:'rehearsal_'+runId,amount:500,environment:'production',status:'refunded',refundAmount:100,paidAt:new Date('2026-10-29T00:00:00Z')}});
  const role=await oldClient.role.create({data:{name:'Synthetic migration cohort '+runId}});
  const matrices=[{'lawyers':'read','users.categories':'read'},{'lawyers':'full','users.categories':'none'}];
  const admins=[];for(let i=0;i<2;i++)admins.push(await oldClient.adminUser.create({data:{employeeCode:'FIXTURE-'+runId.slice(-10)+i,name:'Synthetic migration admin',email:`fixture-${runId}-${i}@example.invalid`,passwordHash:'non-login-fixture',roleId:role.id,permissions:matrices[i]}}));
  const dump=command(['pg_dump','-U','aml_stage','-d',name,'-Fc'],{encoding:null,maxBuffer:32*1024*1024}).stdout;
  const dumpPath=path.join(directory,'baseline.dump');fs.writeFileSync(dumpPath,dump,{mode:0o600});
  await oldClient.$disconnect();oldClient=null;
  const upgrade=run(process.execPath,[prisma,'migrate','deploy'],{env:{...commonEnv,DATABASE_URL:url}});fs.writeFileSync(path.join(directory,'upgrade.log'),upgrade.stdout+upgrade.stderr);
  const Current=require('../node_modules/@prisma/client').PrismaClient;
  currentClient=new Current({datasources:{db:{url}}});
  const after=await currentClient.$queryRawUnsafe('SELECT migration_name FROM _prisma_migrations WHERE finished_at IS NOT NULL ORDER BY migration_name');assert.equal(after.length,fs.readdirSync(path.join(backend,'prisma/migrations')).filter(n=>fs.existsSync(path.join(backend,'prisma/migrations',n,'migration.sql'))).length);
  const preserved=await currentClient.consultationPayment.findUniqueOrThrow({where:{id:payment.id}});
  assert.equal(preserved.amount,500);assert.equal(preserved.refundAmount,100);assert.equal(preserved.status,'refunded');assert.equal(preserved.refundStatus,'needs_review');assert.equal(preserved.provider,'cashfree');assert.equal(preserved.paidAt.toISOString(),payment.paidAt.toISOString());
  for(let i=0;i<admins.length;i++){
    const user=await currentClient.adminUser.findUniqueOrThrow({where:{id:admins[i].id},include:{role:true}});
    assert.equal(user.role.permissions.lawyers,matrices[i].lawyers);
    assert.equal(user.role.permissions['support.categories'],matrices[i]['users.categories']);
    assert.equal(user.role.permissions['users.categories'],undefined);
  }
  const newRoles=await currentClient.adminUser.findMany({where:{id:{in:admins.map(a=>a.id)}},select:{roleId:true}});assert.equal(new Set(newRoles.map(a=>a.roleId)).size,2);
  assert.ok(await currentClient.user.findUnique({where:{id:customer.id}}));
  command(['createdb','-U','aml_stage',restoreName]);
  command(['pg_restore','-U','aml_stage','-d',restoreName,'--exit-on-error'],{input:dump,encoding:null,maxBuffer:8*1024*1024});
  restoredClient=new Old({datasources:{db:{url:restoreUrl}}});
  const restored=await restoredClient.consultationPayment.findUniqueOrThrow({where:{id:payment.id}});assert.equal(restored.amount,payment.amount);assert.equal(restored.status,payment.status);
  const restoredMigrations=await restoredClient.$queryRawUnsafe('SELECT migration_name FROM _prisma_migrations WHERE finished_at IS NOT NULL');assert.equal(restoredMigrations.length,33);
  const version=command(['psql','-U','aml_stage','-d',name,'-Atc','SHOW server_version']).stdout.trim();assert.ok(version.startsWith('18.'));
  const report={date:new Date().toISOString(),scope:'local PostgreSQL 18; synthetic records only; no AWS or production data',baseline,sourceHead:run('git',['rev-parse','HEAD']).stdout.trim(),postgresVersion:version,beforeMigrations:33,afterMigrations:after.length,addedMigrations:after.map(r=>r.migration_name).filter(n=>!before.some(r=>r.migration_name===n)),checks:{legacyPaymentPreserved:true,legacyRefundNeedsReview:true,cashfreeNotConvertedToRazorpay:true,conflictingRoleGrantsNotUnioned:true,categoryPermissionRelocated:true,customerRetained:true,backupRestoredToSeparateDatabase:true,restoredBaselineMigrations:33},databases:{upgraded:name,restore:restoreName},backup:path.relative(root,dumpPath)};
  fs.writeFileSync(path.join(directory,'report.json'),JSON.stringify(report,null,2)+'\n');
  fs.writeFileSync(path.join(root,'.local/staging/latest-rehearsal.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(report,null,2));
})().catch(e=>{fs.writeFileSync(path.join(directory,'failure.log'),e.stack||String(e),{mode:0o600});console.error('Rehearsal failed; inspect '+path.relative(root,path.join(directory,'failure.log')));process.exitCode=1;}).finally(async()=>{await oldClient?.$disconnect();await currentClient?.$disconnect();await restoredClient?.$disconnect();});
