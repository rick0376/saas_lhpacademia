import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.plano.upsert({
    where: { nome: "BASICO" },
    update: {},
    create: {
      nome: "BASICO",
      limiteUsuarios: 2,
      limiteAlunos: 50,
    },
  });

  await prisma.plano.upsert({
    where: { nome: "PREMIUM" },
    update: {},
    create: {
      nome: "PREMIUM",
      limiteUsuarios: 6,
      limiteAlunos: 200,
    },
  });

  await prisma.plano.upsert({
    where: { nome: "PLUS" },
    update: {},
    create: {
      nome: "PLUS",
      limiteUsuarios: 15,
      limiteAlunos: 500,
    },
  });

  console.log("✅ Planos BASICO, PREMIUM e PLUS criados");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
