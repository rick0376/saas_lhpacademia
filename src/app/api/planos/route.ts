import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

/*export async function GET() {
  const planos = await prisma.plano.findMany();
  return NextResponse.json(planos);
}
*/
export async function GET() {
  const planos = await prisma.plano.findMany({
    include: {
      clientes: {
        select: {
          id: true,
          nome: true,
          ativo: true,
        },
      },
      _count: {
        select: {
          clientes: true,
        },
      },
    },
  });

  return NextResponse.json(
    planos.map((plano) => ({
      ...plano,
      totalClientes: plano._count.clientes,
    }))
  );
}

export async function POST(req: Request) {
  const body = await req.json();
  const { nome, valor, limiteUsuarios, limiteAlunos, ativo } = body;

  if (
    !nome ||
    valor == null ||
    limiteUsuarios == null ||
    limiteAlunos == null
  ) {
    return NextResponse.json(
      { error: "Campos obrigatórios não informados" },
      { status: 400 }
    );
  }

  try {
    const planoExistente = await prisma.plano.findUnique({
      where: { nome },
    });

    if (planoExistente) {
      return NextResponse.json(
        { error: `Plano "${nome}" já existe.` },
        { status: 400 }
      );
    }

    const plano = await prisma.plano.create({
      data: {
        nome,
        valor: Number(valor),
        limiteUsuarios: Number(limiteUsuarios),
        limiteAlunos: Number(limiteAlunos),
        ativo: ativo ?? true,
      },
    });

    return NextResponse.json(plano, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: "Erro ao criar plano" }, { status: 500 });
  }
}
