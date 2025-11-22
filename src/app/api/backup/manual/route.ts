import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    // Criar pasta de backups se não existir
    const backupDir = path.join(process.cwd(), "backups");
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // Nome do arquivo
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `backup-${timestamp}.json`;
    const filepath = path.join(backupDir, filename);

    // ✅ BACKUP DE TODAS AS TABELAS (formato JSON)
    const backup = {
      timestamp: new Date().toISOString(),
      data: {
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
      },
    };

    // Salvar arquivo JSON
    fs.writeFileSync(filepath, JSON.stringify(backup, null, 2), "utf-8");

    return NextResponse.json({
      success: true,
      message: "Backup criado com sucesso",
      filename,
    });
  } catch (error: any) {
    console.error("Erro ao criar backup:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao criar backup" },
      { status: 500 }
    );
  }
}
