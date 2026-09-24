import { hash } from '@node-rs/argon2';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * The job titles an admin user can hold. Module access is granted per person
 * on the permissions screen, so a role here is a label and a department.
 */
const ROLES = [
  {
    name: 'Super Admin',
    department: null,
    description: 'Full run of the panel. Built in and cannot be deleted.',
    isSystem: true,
  },
  {
    name: 'Admin / Operations Manager',
    department: 'User & System Administration',
    description: 'Runs the panel day to day and looks after the admin team.',
  },
  {
    name: 'Lawyer Operations Executive',
    department: 'Lawyer Operations',
    description: 'Verifies lawyers and keeps their profiles in order.',
  },
  {
    name: 'Customer & Consultation Executive',
    department: 'Customer Operations',
    description: 'Looks after customer accounts and their consultations.',
  },
  {
    name: 'Finance Executive',
    department: 'Finance & Billing',
    description: 'Payments, invoices, refunds and lawyer payouts.',
  },
  {
    name: 'Referral Executive',
    department: 'Referral & Business Development',
    description: 'Referral programme, rewards and partners.',
  },
  {
    name: 'Support Executive',
    department: 'Customer Support',
    description: 'Answers tickets from customers and lawyers.',
  },
  {
    name: 'Support Manager',
    department: 'Customer Support',
    description: 'Owns escalations and the support queue.',
  },
];

/** The work each department handles — what a ticket can be filed under. */
const CATEGORIES: Record<string, string[]> = {
  'Lawyer Operations': [
    'Onboarding & Verification',
    'Lawyer Profile',
    'Lawyer Account',
    'Availability',
  ],
  'Customer Operations': ['Customer Profile & Account', 'Consultation'],
  'Finance & Billing': ['Payments', 'Billing & Invoice', 'Refunds', 'Lawyer Payouts'],
  'User & System Administration': [
    'User Management',
    'Access & Permissions',
    'System Issues',
    'Notifications',
  ],
  'Referral & Business Development': [
    'Referral Management',
    'Referral Rewards',
    'Referral Partners',
  ],
  'Customer Support': [
    'General Enquiry',
    'Customer Complaint',
    'Lawyer Complaint',
    'Service Issue',
    'Escalation',
  ],
};

/** The teams the company is organised into. Codes are what the table shows. */
const DEPARTMENTS = [
  { name: 'Lawyer Operations', code: 'LAWOPS' },
  { name: 'Customer Operations', code: 'CUSTOPS' },
  { name: 'Finance & Billing', code: 'FINBIL' },
  { name: 'User & System Administration', code: 'SYSADM' },
  { name: 'Referral & Business Development', code: 'REFBD' },
  { name: 'Customer Support', code: 'SUPPORT' },
];

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD;
  const name = process.env.SEED_ADMIN_NAME ?? 'Super Admin';

  if (!email || !password) {
    throw new Error('Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD before seeding.');
  }

  // Safe to re-run: an existing department keeps whatever it was renamed to.
  for (const department of DEPARTMENTS) {
    await prisma.department.upsert({
      where: { name: department.name },
      update: {},
      create: department,
    });
  }
  console.log(`Seeded ${DEPARTMENTS.length} departments.`);

  let categories = 0;
  for (const [departmentName, names] of Object.entries(CATEGORIES)) {
    const department = await prisma.department.findUnique({
      where: { name: departmentName },
      select: { id: true },
    });
    if (!department) continue;

    for (const name of names) {
      await prisma.ticketCategory.upsert({
        where: { name_departmentId: { name, departmentId: department.id } },
        update: {},
        create: { name, departmentId: department.id },
      });
      categories += 1;
    }
  }
  console.log(`Seeded ${categories} categories.`);

  for (const role of ROLES) {
    const department = role.department
      ? await prisma.department.findUnique({
          where: { name: role.department },
          select: { id: true },
        })
      : null;

    await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: {
        name: role.name,
        description: role.description,
        departmentId: department?.id ?? null,
        isSystem: role.isSystem ?? false,
      },
    });
  }
  console.log(`Seeded ${ROLES.length} roles.`);

  const superAdmin = await prisma.role.findUniqueOrThrow({
    where: { name: 'Super Admin' },
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
