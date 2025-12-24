import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    // Permitir SUPERADMIN ou usuários com permissão
    if (session.user.role !== "SUPERADMIN") {
      const permissao = await prisma.permissao.findUnique({
        where: {
          usuarioId_recurso: {
            usuarioId: session.user.id,
            recurso: "backup",
          },
        },
      });

      if (!permissao?.criar) {
        return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
      }
    }

    // Criar pasta de backups se não existir
    const backupDir = path.join(process.cwd(), "backups");
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // Receber parâmetros do corpo da requisição
    const body = await req.json().catch(() => ({}));
    const { tipo = "completo", tabelas, clienteId } = body;

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    let filename = `backup-${timestamp}.json`;
    let data: any = {};

    if (tipo === "seletivo") {
      // ✅ BACKUP SELETIVO
      const tabelasParaBackup =
        tabelas && tabelas.length > 0
          ? tabelas
          : [
              "clientes",
              "usuarios",
              "permissoes",
              "alunos",
              "medidas",
              "avaliacoes",
              "exercicios",
              "treinos",
              "treinoExercicios",
              "cronogramas",
              "execucoesTreino",
              "execucoesExercicio",
            ];

      for (const tabela of tabelasParaBackup) {
        const model = (prisma as any)[tabela];
        if (!model) continue;

        // Aplicar filtro por cliente nas tabelas relacionadas
        const tabelasComCliente = [
          "alunos",
          "medidas",
          "avaliacoes",
          "treinos",
          "cronogramas",
        ];
        const where =
          clienteId && tabelasComCliente.includes(tabela) ? { clienteId } : {};

        data[tabela] = await model.findMany({ where });
      }

      // Nome do arquivo baseado no tipo de backup
      if (clienteId) {
        const cliente = await prisma.cliente.findUnique({
          where: { id: clienteId },
        });
        filename = `backup-${
          cliente?.nome.replace(/\s/g, "-") || "cliente"
        }-${timestamp}.json`;
      } else {
        filename = `backup-seletivo-${timestamp}.json`;
      }
    } else {
      // ✅ BACKUP COMPLETO (mantém seu formato original)
      data = {
        clientes: await prisma.cliente.findMany(),
        usuarios: await prisma.usuario.findMany(),
        permissoes: await prisma.permissao.findMany(),
        alunos: await prisma.aluno.findMany(),
        medidas: await prisma.medida.findMany(),
        avaliacoes: await prisma.avaliacao.findMany(),
        exercicios: await prisma.exercicio.findMany(),
        treinos: await prisma.treino.findMany(),
        treinoExercicios: await prisma.treinoExercicio.findMany(),
        cronogramas: await prisma.cronograma.findMany(),
        execucoesTreino: await prisma.execucaoTreino.findMany(),
        execucoesExercicio: await prisma.execucaoExercicio.findMany(),
      };
    }

    // Estrutura final do backup
    const backup = {
      timestamp: new Date().toISOString(),
      tipo,
      clienteId: clienteId || null,
      tabelas: Object.keys(data),
      data,
    };

    // Salvar arquivo JSON
    const filepath = path.join(backupDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(backup, null, 2), "utf-8");

    return NextResponse.json({
      success: true,
      message: "Backup criado com sucesso",
      filename,
      tipo,
    });
  } catch (error: any) {
    console.error("Erro ao criar backup:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao criar backup" },
      { status: 500 }
    );
  }
}
