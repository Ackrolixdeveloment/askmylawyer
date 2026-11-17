#!/usr/bin/env node
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..');
const settings=JSON.parse(fs.readFileSync(path.join(root,'.local/staging/environment.json'),'utf8'));
const base='http://127.0.0.1:4302';
let cookie='';
async function request(route,body){
  const response=await fetch(base+'/api/v1'+route,{method:body?'POST':'GET',headers:{...(cookie?{cookie}:{}),...(body?{'content-type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});
  assert.equal(response.status,200,route+' status');
  return {response,data:await response.json()};
}
(async()=>{
  assert.equal(settings.API_URL,'http://127.0.0.1:4500');
  const direct=await fetch(settings.API_URL+'/api/v1/health');assert.equal(direct.status,200);
  const login=await request('/admin/auth/login',{email:settings.SEED_ADMIN_EMAIL,password:settings.SEED_ADMIN_PASSWORD});
  assert.equal(login.data.admin.email,settings.SEED_ADMIN_EMAIL);
  cookie=login.response.headers.getSetCookie().map(s=>s.split(';')[0]).join('; ');assert.ok(cookie);
  for(const route of ['/health','/admin/auth/me','/admin/dashboard','/admin/billing','/admin/customers','/admin/lawyers/verified','/admin/lawyers/onboarding?status=new','/admin/support/bucket/new','/admin/consultations/bucket/all','/admin/roles']){await request(route);console.log('PASS staging API '+route);}
  for(const route of ['/login','/lawyers/all','/dashboard','/customers','/billing','/support/new']){
    const response=await fetch(base+route,{headers:{cookie}});assert.equal(response.status,200,route);const html=await response.text();if(route==='/lawyers/all')assert.ok(html.includes('All Registered Lawyers'));console.log('PASS staging page '+route);
  }
})().catch(e=>{console.error(e.message);process.exitCode=1;}).finally(async()=>{if(cookie)await request('/admin/auth/logout',{}).catch(()=>{});});
