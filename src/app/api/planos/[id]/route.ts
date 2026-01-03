import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// DELETE /api/planos/:id
export async function DELETE(
  req: Request,
  context: { params: { id: string } }
) {
  const { id } = await context.params; // ✅ precisa do await

  try {
    const clientesVinculados = await prisma.cliente.findFirst({
      where: { planoId: id },
    });

    if (clientesVinculados) {
      return NextResponse.json(
        {
          error:
            "Este plano está vinculado a algum cliente. Exclua o vínculo primeiro.",
        },
        { status: 400 }
      );
    }

    await prisma.plano.delete({ where: { id } });

    return NextResponse.json({ message: "Plano deletado com sucesso!" });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Erro ao deletar plano" },
      { status: 500 }
    );
  }
}

// PUT /api/planos/:id
export async function PUT(req: Request, context: { params: { id: string } }) {
  const { id } = await context.params;

  let nome = "";

  try {
    const body = await req.json();
    nome = body.nome;
    const { limiteUsuarios, limiteAlunos, ativo } = body;

    if (!nome || limiteUsuarios == null || limiteAlunos == null) {
      return NextResponse.json(
        { error: "Campos obrigatórios não informados" },
        { status: 400 }
      );
    }

    const plano = await prisma.plano.update({
      where: { id },
      data: {
        nome,
        limiteUsuarios: Number(limiteUsuarios),
        limiteAlunos: Number(limiteAlunos),
        ativo: ativo ?? true,
      },
    });

    return NextResponse.json(plano);
  } catch (err: any) {
    if (err?.code === "P2002") {
      return NextResponse.json(
        { error: `Plano "${nome}" já existe.` },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Erro ao atualizar plano" },
      { status: 500 }
    );
  }
}
