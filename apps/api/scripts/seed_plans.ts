import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const plans = [
    {
      name: 'Free',
      stripePriceId: 'price_free_mock',
      price: 0,
      interval: 'month',
      scansPerMonth: 10,
      projectLimit: 3,
      features: ['10 scans per month', '3 projects', 'Basic vulnerability detection', 'PDF reports'],
      isActive: true,
    },
    {
      name: 'Pro',
      stripePriceId: 'price_pro_monthly_mock',
      price: 4900, // $49.00
      interval: 'month',
      scansPerMonth: 100,
      projectLimit: 20,
      features: ['100 scans per month', '20 projects', 'Advanced detection', 'CI/CD integration', 'Priority support'],
      isActive: true,
    },
    {
      name: 'Enterprise',
      stripePriceId: 'price_enterprise_monthly_mock',
      price: 19900, // $199.00
      interval: 'month',
      scansPerMonth: -1, // Unlimited
      projectLimit: -1, // Unlimited
      features: ['Unlimited scans', 'Unlimited projects', 'API access', 'Team management', 'Dedicated support'],
      isActive: true,
    }
  ];

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { stripePriceId: plan.stripePriceId },
      update: plan,
      create: plan,
    });
    console.log(`Seeded plan: ${plan.name}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
