// prisma/seed.ts
// Seed: 1 Avaliação Completa com TODOS os campos
// EDITE APENAS OS CAMPOS DESTACADOS COM 🔴 ABAIXO

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // 🔴 EDITE AQUI - INFORMAÇÕES DO ALUNO E CLIENTE
  const alunoId = "cmhc93tkv00060geg4u6r8jzs"; // ✅ ID do aluno que já existe
  const clienteId = "cmhc8ypx100000gegcf4hgtr0"; // ✅ ID do cliente (pra validar relação)

  console.log("🌱 Criando avaliação completa...");

  // Verifica se o aluno existe
  const aluno = await prisma.aluno.findUnique({
    where: { id: alunoId },
    include: { cliente: true },
  });

  if (!aluno) {
    console.log(`❌ Aluno com ID "${alunoId}" não encontrado!`);
    return;
  }

  // Verifica se o aluno pertence ao cliente correto (opcional, só pra segurança)
  if (aluno.clienteId !== clienteId) {
    console.log(
      `⚠️ Aviso: Aluno pertence ao cliente "${aluno.clienteId}", não "${clienteId}"`
    );
    console.log(`   Continuando mesmo assim...`);
  }

  console.log(
    "✅ Aluno encontrado:",
    aluno.nome,
    `(Cliente: ${aluno.cliente.nome})`
  );

  // 🔴 EDITE AQUI - DADOS DA AVALIAÇÃO (ANAMNESE)
  const avaliacaoData = {
    // Tipo e Data
    tipo: "Avaliação Inicial Física",
    data: new Date("2025-10-15T10:00:00.000Z"),

    // === ANAMNESE ===
    historicoMedico:
      "Sem doenças crônicas graves. Artrite leve no joelho esquerdo.",
    objetivos:
      "Perda de peso (5kg em 3 meses), ganho de massa muscular e melhoria cardiovascular.",
    praticaAnterior:
      "Musculação 2x/semana há 6 meses (irregular). Caminhadas ocasionais.",
    fumante: false,
    diabetes: false,
    doencasArticulares: true,
    cirurgias: "Apendicite em 2018. Sem lesões recentes.",

    // === ANTROPOMETRIA ===
    peso: 75.5, // kg
    altura: 175.0, // cm
    imc: 24.6, // calculado automaticamente: peso / (altura/100)^2
    percentualGordura: 22.3, // %
    circunferenciaCintura: 85.2, // cm
    circunferenciaQuadril: 98.5, // cm
    dobrasCutaneas: {
      // Medidas em mm (método de 7 pontos)
      subescapular: 12.5,
      triceps: 15.2,
      peitoral: 8.7,
      axilar: 10.1,
      suprailiaca: 18.3,
      abdominal: 20.4,
      femural: 14.6,
    },

    // === CARDIORRESPIRATÓRIA ===
    vo2Max: 42.5, // ml/kg/min
    testeCooper: 2400.0, // metros (teste de 12 min)

    // === MUSCULAR ===
    forcaSupino: 60.0, // 1RM em kg (supino)
    repeticoesFlexoes: 25, // número de flexões até falha
    pranchaTempo: 85, // segundos (core)

    // === FLEXIBILIDADE ===
    testeSentarEsticar: 25.5, // cm (sentar e esticar)

    // === RESUMO E OBSERVAÇÕES ===
    resultado:
      "Avaliação normal. Condicionamento moderado. Recomendar treino 4x/semana.",
    observacoes:
      "Motivado. Aquecimento obrigatório para joelho. Dieta hipocalórica (2000kcal/dia). Monitorar progressão.",
    arquivo: null, // ou '/uploads/avaliacao-pdf.pdf' se tiver arquivo
  };

  // Cria a avaliação
  const avaliacao = await prisma.avaliacao.create({
    data: {
      alunoId: aluno.id,
      ...avaliacaoData,
    },
  });

  console.log("\n✅ Avaliação Criada com Sucesso!");
  console.log("   ID:", avaliacao.id);
  console.log("   Aluno:", aluno.nome);
  console.log("   Tipo:", avaliacao.tipo);
  console.log("   Data:", avaliacao.data);
  console.log("   Peso:", avaliacao.peso, "kg");
  console.log("   IMC:", avaliacao.imc);
  console.log("   VO2 Max:", avaliacao.vo2Max, "ml/kg/min");
  console.log("\n🎉 Seed finalizado!");
}

main()
  .catch((e) => {
    console.error("❌ Erro:", e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
