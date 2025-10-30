import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed do banco de dados...");

  // 1. Criar Cliente
  const cliente = await prisma.cliente.upsert({
    where: { id: "cliente-inicial-001" },
    update: {},
    create: {
      id: "cliente-inicial-001",
      nome: "Academia Modelo",
      ativo: true,
    },
  });

  console.log("✅ Cliente criado:", cliente.nome);

  // 2. Hash da senha do SuperAdmin
  const senhaHash = await hash("admin123", 10);

  // 3. Criar SuperAdmin
  const superAdmin = await prisma.usuario.upsert({
    where: { email: "admin@academia.com" },
    update: {},
    create: {
      nome: "Super Administrador",
      email: "admin@academia.com",
      senha: senhaHash,
      role: "SUPERADMIN",
      ativo: true,
      clienteId: cliente.id,
    },
  });

  console.log("✅ SuperAdmin criado:", superAdmin.email);

  // 4. Criar Exercícios de Exemplo
  const exercicios = [
    {
      nome: "Supino Reto",
      grupoMuscular: "PEITO",
      descricao: "Exercício básico para peitoral",
      equipamento: "Barra",
    },
    {
      nome: "Agachamento Livre",
      grupoMuscular: "PERNAS",
      descricao: "Exercício completo para pernas",
      equipamento: "Barra",
    },
    {
      nome: "Remada Curvada",
      grupoMuscular: "COSTAS",
      descricao: "Exercício para costas",
      equipamento: "Barra",
    },
    {
      nome: "Desenvolvimento",
      grupoMuscular: "OMBROS",
      descricao: "Exercício para ombros",
      equipamento: "Barra",
    },
    {
      nome: "Rosca Direta",
      grupoMuscular: "BICEPS",
      descricao: "Exercício para bíceps",
      equipamento: "Barra",
    },
    {
      nome: "Tríceps Testa",
      grupoMuscular: "TRICEPS",
      descricao: "Exercício para tríceps",
      equipamento: "Barra",
    },
    {
      nome: "Abdominal Supra",
      grupoMuscular: "ABDOMEN",
      descricao: "Exercício para abdômen",
      equipamento: "Livre",
    },
    {
      nome: "Esteira",
      grupoMuscular: "CARDIO",
      descricao: "Exercício cardiovascular",
      equipamento: "Esteira",
    },
  ];

  for (const ex of exercicios) {
    await prisma.exercicio.upsert({
      where: {
        id: `exercicio-${ex.nome.toLowerCase().replace(/\s/g, "-")}`,
      },
      update: {},
      create: {
        id: `exercicio-${ex.nome.toLowerCase().replace(/\s/g, "-")}`,
        nome: ex.nome,
        grupoMuscular: ex.grupoMuscular as any,
        descricao: ex.descricao,
        equipamento: ex.equipamento,
        clienteId: cliente.id,
      },
    });
  }

  console.log("✅ Exercícios criados:", exercicios.length);

  // 5. Criar Aluno de Exemplo
  const aluno = await prisma.aluno.upsert({
    where: { id: "aluno-exemplo-001" },
    update: {},
    create: {
      id: "aluno-exemplo-001",
      nome: "João Silva",
      email: "joao@exemplo.com",
      telefone: "(11) 98765-4321",
      dataNascimento: new Date("1990-05-15"),
      objetivo: "Hipertrofia",
      ativo: true,
      clienteId: cliente.id,
    },
  });

  console.log("✅ Aluno criado:", aluno.nome);

  // 6. Criar Medida Inicial
  await prisma.medida.create({
    data: {
      alunoId: aluno.id,
      peso: 75.5,
      altura: 1.75,
      peito: 95,
      cintura: 85,
      quadril: 98,
      bracoDireito: 35,
      bracoEsquerdo: 35,
    },
  });

  console.log("✅ Medida inicial criada");

  console.log("\n📌 CREDENCIAIS DE ACESSO:");
  console.log("═══════════════════════════════════");
  console.log("Email: admin@academia.com");
  console.log("Senha: admin123");
  console.log("═══════════════════════════════════");
  console.log("\n⚠️  IMPORTANTE: Altere a senha após o primeiro login!\n");
}

main()
  .catch((e) => {
    console.error("❌ Erro no seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
