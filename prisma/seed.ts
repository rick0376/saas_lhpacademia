// prisma/seed.ts
// Seed COMPLETO e CORRIGIDO baseado no schema.prisma fornecido.
// Cria: Cliente (padrão se não existir), Usuario (para login como ALUNO), Aluno (com ID fixo, ligado a Cliente/Usuario),
//       3 Avaliacoes completas (com progressão, todos os campos opcionais preenchidos onde faz sentido).
// Atenção: Aluno requer clienteId (obrigatório). Usuario tem senha (hash bcrypt). Avaliacao usa Json para dobrasCutaneas.
// Sem erros TS: Usa só campos existentes (ex.: sem pesoInicial/altura em Aluno; eles vão em Avaliacao/Medida).
// Rode: npx prisma generate && npx prisma db seed

import { PrismaClient, Role } from "@prisma/client";
import { hash } from "bcryptjs"; // Para senha do Usuario

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed completo baseado no schema...");

  // ========================================
  // PASSO 1: CRIAR/VERIFICAR CLIENTE (obrigatório para Aluno)
  // ========================================
  const clienteId = "cliente-default-seed"; // ID fixo para simplicidade; ajuste se quiser gerar
  let cliente = await prisma.cliente.findUnique({ where: { id: clienteId } });

  if (!cliente) {
    console.log("🏢 Criando Cliente padrão...");
    cliente = await prisma.cliente.create({
      data: {
        id: clienteId,
        nome: "Academia Seed Test",
        logo: "/logos/academia-logo.png", // Placeholder
        ativo: true,
      },
    });
    console.log("✅ Cliente criado:", cliente.nome, "(ID:", cliente.id, ")");
  } else {
    console.log("✅ Cliente encontrado:", cliente.nome);
  }

  // ========================================
  // PASSO 2: CRIAR/VERIFICAR USUARIO (para login como ALUNO, ligado ao Aluno depois)
  // ========================================
  const emailUser = "joao.silva@email.com";
  const senhaPlana = "senha123"; // Senha de teste
  let usuario = await prisma.usuario.findUnique({
    where: { email: emailUser },
  });

  if (!usuario) {
    console.log("👤 Criando Usuario para Aluno...");
    const hashedSenha = await hash(senhaPlana, 12);
    usuario = await prisma.usuario.create({
      data: {
        nome: "João Silva",
        email: emailUser,
        senha: hashedSenha,
        role: Role.ALUNO,
        ativo: true,
        clienteId: cliente.id,
      },
    });
    console.log("✅ Usuario criado:", usuario.email, "(Role: ALUNO)");
  } else {
    console.log("✅ Usuario encontrado:", usuario.email);
  }

  // ========================================
  // PASSO 3: CRIAR/VERIFICAR ALUNO (ID fixo, ligado a Cliente/Usuario)
  // ========================================
  const alunoId = "cmhc93tkv00060geg4u6r8jzs";
  let aluno = await prisma.aluno.findUnique({ where: { id: alunoId } });

  if (!aluno) {
    console.log("👨‍🎓 Criando Aluno com ID fixo...");
    aluno = await prisma.aluno.create({
      data: {
        id: alunoId,
        nome: "João Silva",
        email: emailUser,
        telefone: "(11) 99999-1234",
        dataNascimento: new Date("1990-05-15"), // 35 anos
        foto: "/fotos/joao-silva.jpg", // Placeholder
        objetivo: "Perda de peso e ganho muscular",
        observacoes: "Aluno motivado, atenção ao joelho.",
        ativo: true,
        clienteId: cliente.id,
        usuarioId: usuario.id, // Liga ao Usuario criado
      },
    });
    console.log("✅ Aluno criado:", aluno.nome, "(ID:", aluno.id, ")");
  } else {
    console.log("✅ Aluno encontrado:", aluno.nome);
  }

  // ========================================
  // PASSO 4: INSERIR 3 AVALIACOES COMPLETAS (se não existirem)
  // ========================================
  const avaliacoesExistentes = await prisma.avaliacao.count({
    where: { alunoId: aluno.id },
  });

  if (avaliacoesExistentes > 0) {
    console.log(
      "⚠️ Avaliações já existem (",
      avaliacoesExistentes,
      "). Pulando."
    );
    return;
  }

  const dobrasBase = {
    subescapular: 12.5,
    triceps: 15.2,
    peitoral: 8.7,
    axilar: 10.1,
    suprailiaca: 18.3,
    abdominal: 20.4,
    femural: 14.6,
  };

  // Avaliação 1: Inicial
  await prisma.avaliacao.create({
    data: {
      alunoId: aluno.id,
      tipo: "Avaliação Inicial Física",
      data: new Date("2025-10-15T10:00:00.000Z"),
      historicoMedico:
        "Sem doenças crônicas graves. Artrite leve no joelho esquerdo.",
      objetivos:
        "Perda de peso (5kg em 3 meses), ganho de massa muscular e melhoria cardiovascular.",
      praticaAnterior:
        "Musculação 2x/semana há 6 meses (irregular). Caminhadas ocasionais.",
      fumante: false,
      diabetes: false,
      doencasArticulares: true, // Ativa alertas no frontend
      cirurgias: "Apendicite em 2018. Sem lesões recentes.",
      peso: 75.5,
      altura: 175.0,
      imc: 24.6,
      percentualGordura: 22.3,
      circunferenciaCintura: 85.2,
      circunferenciaQuadril: 98.5,
      dobrasCutaneas: dobrasBase,
      vo2Max: 42.5,
      testeCooper: 2400.0,
      forcaSupino: 60.0,
      repeticoesFlexoes: 25,
      pranchaTempo: 85,
      testeSentarEsticar: 25.5,
      resultado:
        "Avaliação normal. Condicionamento moderado. Recomendar treino 4x/semana.",
      observacoes:
        "Motivado. Aquecimento obrigatório para joelho. Dieta hipocalórica (2000kcal/dia). Monitorar.",
      arquivo: null, // Adicione PDF em public/uploads depois
    },
  });
  console.log("✅ Avaliação 1 inserida (Inicial, Peso: 75.5kg)");

  // Avaliação 2: Follow-up 1 mês
  await prisma.avaliacao.create({
    data: {
      alunoId: aluno.id,
      tipo: "Follow-up Mensal 1",
      data: new Date("2025-11-15T09:30:00.000Z"),
      historicoMedico: "Estável. Sem novas queixas.",
      objetivos: "Manter perda de peso e aumentar intensidade.",
      praticaAnterior: "Agora treina 4x/semana com boa adesão.",
      fumante: false,
      diabetes: false,
      doencasArticulares: true,
      cirurgias: "Nenhuma nova.",
      peso: 74.0,
      altura: 175.0,
      imc: 24.2,
      percentualGordura: 21.1,
      circunferenciaCintura: 83.8,
      circunferenciaQuadril: 97.9,
      dobrasCutaneas: { ...dobrasBase, abdominal: 19.2, suprailiaca: 17.1 },
      vo2Max: 45.2,
      testeCooper: 2600.0,
      forcaSupino: 65.0,
      repeticoesFlexoes: 28,
      pranchaTempo: 95,
      testeSentarEsticar: 27.0,
      resultado:
        "Bom progresso: redução de gordura e ganho de força. Continuar plano.",
      observacoes:
        "Adesão excelente. Ajustar dieta para 1900kcal. Incluir cardio 2x/semana.",
      arquivo: "/uploads/followup1-joao-silva.pdf", // Crie este arquivo para testar download
    },
  });
  console.log("✅ Avaliação 2 inserida (Follow-up 1, Peso: 74.0kg)");

  // Avaliação 3: Follow-up 2 meses
  await prisma.avaliacao.create({
    data: {
      alunoId: aluno.id,
      tipo: "Follow-up Mensal 2",
      data: new Date("2025-12-15T10:15:00.000Z"),
      historicoMedico: "Tudo estável. Joelho melhor com fortalecimento.",
      objetivos: "Meta de peso atingida; foco em hipertrofia.",
      praticaAnterior: "Treinos consistentes 4-5x/semana. Incluiu corrida.",
      fumante: false,
      diabetes: false,
      doencasArticulares: true,
      cirurgias: "Nenhuma.",
      peso: 73.0,
      altura: 175.0,
      imc: 23.8,
      percentualGordura: 19.8,
      circunferenciaCintura: 82.5,
      circunferenciaQuadril: 97.2,
      dobrasCutaneas: {
        ...dobrasBase,
        abdominal: 18.0,
        suprailiaca: 16.0,
        triceps: 14.0,
      },
      vo2Max: 48.0,
      testeCooper: 2800.0,
      forcaSupino: 70.0,
      repeticoesFlexoes: 32,
      pranchaTempo: 110,
      testeSentarEsticar: 28.5,
      resultado: "Excelente evolução! Transição para manutenção e hipertrofia.",
      observacoes:
        "Parabéns pela meta. Aumentar calorias para 2200kcal. Próxima avaliação em março.",
      arquivo: null,
    },
  });
  console.log("✅ Avaliação 3 inserida (Follow-up 2, Peso: 73.0kg)");

  console.log(
    "\n🎉 Seed finalizado! Dados inseridos: Cliente, Usuario, Aluno + 3 Avaliações."
  );
  console.log(
    'Login de teste: Email "joao.silva@email.com" / Senha "senha123" (role ALUNO).'
  );
  console.log(
    "Acesse /alunos/avaliacoes para ver tabela, resumo e alertas (ex.: doencasArticulares)."
  );
}

// Executa
main()
  .catch((e) => {
    console.error("❌ Erro no seed:", e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log("🔌 Prisma desconectado.");
  });
