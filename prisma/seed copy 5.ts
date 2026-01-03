import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.plano.upsert({
    where: { nome: "Basico" },
    update: {},
    create: {
      nome: "Basico",
      limiteUsuarios: 10,
      limiteAlunos: 100,
    },
  });

  console.log("✅ Plano Básico criado");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
