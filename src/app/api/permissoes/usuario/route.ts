//api/permissoes/usuario/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // SUPERADMIN tem todas as permissões
    if (session.user.role === "SUPERADMIN") {
      return NextResponse.json([
        {
          recurso: "clientes",
          criar: true,
          ler: true,
          editar: true,
          deletar: true,
        },
        {
          recurso: "alunos",
          criar: true,
          ler: true,
          editar: true,
          deletar: true,
        },
        {
          recurso: "exercicios",
          criar: true,
          ler: true,
          editar: true,
          deletar: true,
        },
        {
          recurso: "treinos",
          criar: true,
          ler: true,
          editar: true,
          deletar: true,
        },
        {
          recurso: "medidas",
          criar: true,
          ler: true,
          editar: true,
          deletar: true,
        },
        {
          recurso: "execucoes",
          criar: true,
          ler: true,
          editar: true,
          deletar: true,
        },

        // 👇 adiciona todos os recursos de compartilhamento
        {
          recurso: "alunos_compartilhar",
          criar: false,
          ler: true,
          editar: true,
          deletar: false,
        },
        {
          recurso: "avaliacoes_compartilhar",
          criar: false,
          ler: true,
          editar: true,
          deletar: false,
        },
        {
          recurso: "exercicios_compartilhar",
          criar: false,
          ler: true,
          editar: true,
          deletar: false,
        },
        {
          recurso: "treinos_compartilhar",
          criar: false,
          ler: true,
          editar: true,
          deletar: false,
        },
        {
          recurso: "medidas_compartilhar",
          criar: false,
          ler: true,
          editar: true,
          deletar: false,
        },
      ]);
    }

    // Busca permissões do usuário logado
    const permissoes = await prisma.permissao.findMany({
      where: {
        usuarioId: session.user.id,
      },
      orderBy: {
        recurso: "asc",
      },
    });

    // garante que TODOS os recursos do backup existam no retorno
    const recursosBackup = [
      "backup",
      "backup_criar",
      "backup_download",
      "backup_restaurar",
      "backup_excluir",
      "backup_salvar", // novo recurso
    ];

    for (const recurso of recursosBackup) {
      const existe = permissoes.some((p) => p.recurso === recurso);
      if (!existe) {
        permissoes.push({
          id: `virtual-${recurso}`,
          usuarioId: session.user.id,
          recurso,
          criar: false,
          ler: false,
          editar: false,
          deletar: false,
        });
      }
    }

    return NextResponse.json(permissoes);
  } catch (error) {
    console.error("Erro ao buscar permissões do usuário:", error);
    return NextResponse.json(
      { error: "Erro ao buscar permissões" },
      { status: 500 }
    );
  }
}
