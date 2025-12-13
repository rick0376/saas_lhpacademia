import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed do SuperAdmin...");

  const senhaHash = await hash("admin123", 10);

  const superAdmin = await prisma.usuario.upsert({
    where: { email: "admin@saas.com" },
    update: {},
    create: {
      nome: "Super Administrador",
      email: "admin@saas.com",
      senha: senhaHash,
      role: "SUPERADMIN",
      ativo: true,
      clienteId: null, // agora permitido
    },
  });

  console.log("✅ SuperAdmin criado com sucesso!");
  console.log("Email:", superAdmin.email);
  console.log("Senha: admin123");
}

main()
  .catch((e) => {
    console.error("❌ Erro no seed:", e);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());
