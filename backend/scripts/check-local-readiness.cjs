#!/usr/bin/env node
/** Read-only localhost integration report. Never prints credentials or user rows. */
const { PrismaClient } = require('@prisma/client');
try { process.loadEnvFile(); } catch { /* environment may be injected */ }
const env = process.env;
if (!env.DATABASE_URL || !['localhost','127.0.0.1'].includes(new URL(env.DATABASE_URL).hostname)) {
  throw Error('This readiness command requires an explicitly configured localhost DATABASE_URL.');
}
const has = (...keys) => keys.every(k => Boolean(env[k]?.trim()));
const db = new PrismaClient();
(async () => {
  const [gateways, engine] = await Promise.all([
    db.paymentGateway.findMany({select:{provider:true,environment:true,appId:true,secretKeyEnc:true,webhookSecretEnc:true}}),
    db.consultationSettings.findUnique({where:{id:1},select:{skipPayment:true,demoMode:true}}),
  ]);
  const result = {
    scope:'localhost only; configuration presence, not provider acceptance',
    databaseReachable:true,
    paymentBypassEnvironment:env.PAYMENTS_BYPASS_ENABLED === 'true',
    paymentBypassEngine:engine?.skipPayment ?? null,
    demoMode:engine?.demoMode ?? null,
    otpBypass:env.OTP_BYPASS_ENABLED === 'true',
    configured:{
      razorpaySandbox:gateways.some(g=>g.provider==='razorpay'&&g.environment==='sandbox'&&g.appId&&g.secretKeyEnc&&g.webhookSecretEnc),
      razorpayProduction:gateways.some(g=>g.provider==='razorpay'&&g.environment==='production'&&g.appId&&g.secretKeyEnc&&g.webhookSecretEnc),
      agoraRtc:has('AGORA_APP_ID','AGORA_APP_CERTIFICATE'),
      agoraRest:has('AGORA_CUSTOMER_ID','AGORA_CUSTOMER_SECRET'),
      transcriptionStorage:has('TRANSCRIPT_BUCKET','TRANSCRIPT_AWS_ACCESS_KEY_ID','TRANSCRIPT_AWS_SECRET_ACCESS_KEY'),
      firebasePush:has('FIREBASE_PROJECT_ID','FIREBASE_CLIENT_EMAIL','FIREBASE_PRIVATE_KEY'),
      sms:has('MSG91_AUTH_KEY'),email:has('RESEND_API_KEY'),aiDrafting:has('OPENAI_API_KEY'),
      googleSignIn:has('GOOGLE_CLIENT_IDS'),appleSignIn:has('APPLE_CLIENT_IDS'),
    },
    storageDriver:env.STORAGE_DRIVER || 'local',
    recordingEnabled:env.AGORA_RECORDING_ENABLED === 'true',
  };
  console.log(JSON.stringify(result,null,2));
})().catch(e=>{console.error('Local readiness failed: '+e.name);process.exitCode=1;}).finally(()=>db.$disconnect());
