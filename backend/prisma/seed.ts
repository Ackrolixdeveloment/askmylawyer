import { hash } from '@node-rs/argon2';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD;
  const name = process.env.SEED_ADMIN_NAME ?? 'Super Admin';

  if (!email || !password) {
    throw new Error('Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD before seeding.');
  }

  const superAdmin = await prisma.role.upsert({
    where: { name: 'Super Admin' },
    update: {},
    create: { name: 'Super Admin', isSystem: true },
  });

  const existing = await prisma.adminUser.findUnique({ where: { email } });
  if (existing) {
    console.log(`Super Admin ${email} already exists — skipped.`);
    return;
  }

  await prisma.adminUser.create({
    data: {
      employeeCode: 'EMP-0001',
      name,
      email,
      passwordHash: await hash(password),
      roleId: superAdmin.id,
    },
  });
  console.log(`Created Super Admin ${email}.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
