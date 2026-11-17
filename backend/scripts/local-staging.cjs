#!/usr/bin/env node
/** Isolated local staging only; never accepts a production database URL. */
const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '../..');
const directory = path.join(root, '.local/staging');
const configFile = path.join(directory, 'environment.json');
const backend = path.join(root, 'backend');
const command = process.argv[2];

function config() {
  if (!fs.existsSync(configFile)) throw Error('Run init first.');
  const value = JSON.parse(fs.readFileSync(configFile, 'utf8'));
  const url = new URL(value.DATABASE_URL);
  if (url.hostname !== '127.0.0.1' || url.port !== '55434' || url.pathname !== '/askmylawyer_staging') throw Error('Unexpected staging database target.');
  if (url.username !== 'aml_stage' || value.API_URL !== 'http://127.0.0.1:4500' || value.PORT !== '4500' || value.STORAGE_LOCAL_DIR !== path.join(directory,'uploads')) throw Error('Unexpected local staging API/storage target.');
  return value;
}
function run(bin, args, options = {}) {
  const result = cp.spawnSync(bin, args, { cwd: backend, stdio: 'inherit', ...options });
  if (result.error) throw result.error;
  if (result.status !== 0) throw Error(`${path.basename(bin)} failed (${result.status}).`);
}
function docker(args, options = {}) {
  const executable = process.env.AML_DOCKER || (fs.existsSync('/Users/simranackrolix/.local/bin/docker') ? '/Users/simranackrolix/.local/bin/docker' : 'docker');
  run(executable, ['compose','-f',path.join(root,'infra/local-staging/compose.yml'),...args], { env: { ...process.env, ...config() }, ...options });
}

if (command === 'init') {
  fs.mkdirSync(directory, { recursive: true, mode: 0o700 });
  if (fs.existsSync(configFile)) { config(); console.log('Existing staging configuration retained.'); }
  else {
    const dbPassword = crypto.randomBytes(24).toString('hex');
    const value = {
      AML_STAGING_DB_PASSWORD: dbPassword,
      DATABASE_URL: `postgresql://aml_stage:${dbPassword}@127.0.0.1:55434/askmylawyer_staging?schema=public`,
      NODE_ENV:'development',PORT:'4500',CORS_ORIGINS:'http://127.0.0.1:4302,http://localhost:4302',
      JWT_ACCESS_SECRET:crypto.randomBytes(48).toString('hex'),DATA_ENCRYPTION_KEY:crypto.randomBytes(32).toString('base64'),
      COOKIE_SECURE:'false',ALLOW_MULTI_ROLE_PHONE:'false',OTP_BYPASS_ENABLED:'false',PAYMENTS_BYPASS_ENABLED:'false',
      STORAGE_DRIVER:'local',STORAGE_LOCAL_DIR:path.join(directory,'uploads'),LOG_LEVEL:'warn',LOG_FORMAT:'json',
      SEED_ADMIN_EMAIL:'admin@staging.askmylawyer.local',SEED_ADMIN_PASSWORD:crypto.randomBytes(24).toString('base64url'),
      AGORA_APP_ID:'',AGORA_APP_CERTIFICATE:'',AGORA_CUSTOMER_ID:'',AGORA_CUSTOMER_SECRET:'',
      FIREBASE_PROJECT_ID:'',FIREBASE_CLIENT_EMAIL:'',FIREBASE_PRIVATE_KEY:'',MSG91_AUTH_KEY:'',RESEND_API_KEY:'',
      OPENAI_API_KEY:'',GOOGLE_CLIENT_IDS:'',APPLE_CLIENT_IDS:'',AGORA_RECORDING_ENABLED:'false',
      API_URL:'http://127.0.0.1:4500',AML_LOCAL_STAGING:'true',NEXT_TELEMETRY_DISABLED:'1',
    };
    fs.writeFileSync(configFile, JSON.stringify(value,null,2)+'\n', { mode: 0o600, flag:'wx' });
    fs.mkdirSync(value.STORAGE_LOCAL_DIR, { recursive:true, mode:0o700 });
    console.log('Private staging environment initialized; no credentials printed.');
  }
} else {
  const env = { ...process.env, ...config(), BIND_HOST:'127.0.0.1' };
  const prisma = path.join(backend,'node_modules/prisma/build/index.js');
  if (command === 'up') docker(['up','-d','--wait']);
  else if (command === 'prepare') {
    run(process.execPath,[prisma,'migrate','deploy'],{env});
    run(process.execPath,['--import','tsx','prisma/seed.ts'],{env});
  } else if (command === 'readiness') run(process.execPath,['scripts/check-local-readiness.cjs'],{env});
  else if (command === 'test') {
    const tests=fs.readdirSync(path.join(backend,'tests')).filter(f=>f.endsWith('.test.ts')).map(f=>'tests/'+f);
    run(process.execPath,['--import','tsx','--test','--test-concurrency=1',...tests],{env:{...env,NODE_ENV:'test',AML_FLOW_DB_TESTS:'true'}});
  } else if (command === 'backend') run(process.execPath,['dist/main.js'],{env});
  else if (command === 'admin') run(process.execPath,[path.join(root,'admin/node_modules/next/dist/bin/next'),'dev','--webpack','--hostname','127.0.0.1','--port','4302'],{cwd:path.join(root,'admin'),env});
  else if (command === 'admin-build') run(process.execPath,[path.join(root,'admin/node_modules/next/dist/bin/next'),'build','--webpack'],{cwd:path.join(root,'admin'),env:{...env,NODE_ENV:'production'}});
  else if (command === 'status') docker(['ps']);
  else throw Error('Usage: local-staging.cjs init|up|prepare|readiness|test|backend|admin|admin-build|status');
}
