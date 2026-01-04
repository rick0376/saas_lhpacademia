import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { uploadToCloudinary } from "@/lib/cloudinary";

// ✅ GET - Listar alunos
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Verificar permissão de ler alunos (se não for SUPERADMIN)
    if (session.user.role !== "SUPERADMIN") {
      const permissoes = await prisma.permissao.findUnique({
        where: {
          usuarioId_recurso: {
            usuarioId: session.user.id,
            recurso: "alunos",
          },
        },
      });

      if (!permissoes || !permissoes.ler) {
        return NextResponse.json(
          { error: "Sem permissão para listar alunos" },
          { status: 403 }
        );
      }
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const clienteIdParam = searchParams.get("clienteId"); // ✅ Filtro opcional

    // ✅ Montar WHERE baseado no role
    let whereClause: any = {};

    if (session.user.role === "SUPERADMIN") {
      // SUPERADMIN: se passou clienteId filtra, senão retorna TODOS
      if (clienteIdParam) {
        whereClause.clienteId = clienteIdParam;
      }
    } else {
      // Usuários normais: sempre filtram pelo próprio cliente
      const clienteId = (session.user as any).clienteId;

      if (!clienteId) {
        return NextResponse.json(
          { error: "Cliente não identificado" },
          { status: 400 }
        );
      }

      whereClause.clienteId = clienteId;
    }

    // Adicionar busca por nome/email
    if (search) {
      whereClause.OR = [
        { nome: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const alunos = await prisma.aluno.findMany({
      where: whereClause,
      include: {
        cliente: { select: { nome: true } },
        _count: {
          select: {
            treinos: true,
            medidas: true,
          },
        },
      },
      orderBy: {
        nome: "asc",
      },
    });

    return NextResponse.json(alunos);
  } catch (error) {
    console.error("Erro ao buscar alunos:", error);
    return NextResponse.json(
      { error: "Erro ao buscar alunos" },
      { status: 500 }
    );
  }
}

// ✅ POST - Criar aluno
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Verificar permissão de criar alunos (se não for SUPERADMIN)
    if (session.user.role !== "SUPERADMIN") {
      const permissoes = await prisma.permissao.findUnique({
        where: {
          usuarioId_recurso: {
            usuarioId: session.user.id,
            recurso: "alunos",
          },
        },
      });

      if (!permissoes || !permissoes.criar) {
        return NextResponse.json(
          { error: "Sem permissão para criar alunos" },
          { status: 403 }
        );
      }
    }

    // ✅ TEM QUE VIR ANTES DE USAR formData
    const formData = await req.formData();

    // ⭐ CORREÇÃO DEFINITIVA — prioridade ao formulário
    const clienteId =
      (formData.get("clienteId") as string) ||
      ((session.user as any).clienteId as string);

    if (!clienteId) {
      return NextResponse.json(
        { error: "Cliente não identificado" },
        { status: 400 }
      );
    }

    // agora SIM leia os outros campos...
    const nome = formData.get("nome") as string;
    const email = formData.get("email") as string;
    const telefone = formData.get("telefone") as string;
    const dataNascimento = formData.get("dataNascimento") as string;
    const objetivo = formData.get("objetivo") as string;
    const observacoes = formData.get("observacoes") as string;
    const ativo = formData.get("ativo") === "true";
    const darAcessoApp = formData.get("darAcessoApp") === "true";
    const senhaInicial = formData.get("senhaInicial") as string;
    const fotoFile = formData.get("foto") as File | null;
    const usuarioIdSelecionado = formData.get("usuarioId") as string | null;

    if (!nome) {
      return NextResponse.json(
        { error: "Nome é obrigatório" },
        { status: 400 }
      );
    }

    if (email) {
      const alunoExistente = await prisma.aluno.findFirst({
        where: {
          email,
          clienteId,
        },
      });

      if (alunoExistente) {
        return NextResponse.json(
          { error: "Já existe um aluno com este email" },
          { status: 400 }
        );
      }
    }

    let usuarioId: string | null = null;

    // Se veio usuarioId no form, usa ele:
    if (usuarioIdSelecionado) {
      // garante que o usuário existe e é do mesmo cliente
      const usuario = await prisma.usuario.findFirst({
        where: {
          id: usuarioIdSelecionado,
          clienteId,
        },
      });

      if (!usuario) {
        return NextResponse.json(
          { error: "Usuário selecionado não encontrado para este cliente" },
          { status: 400 }
        );
      }

      usuarioId = usuario.id;
    }

    // Opcional: se marcar "Dar acesso ao app" sem usuário ligado, bloquear
    /*  if (darAcessoApp && !usuarioId) {
      return NextResponse.json(
        {
          error:
            "Para dar acesso ao app, selecione um usuário existente primeiro",
        },
        { status: 400 }
      );
    }
*/
    let fotoUrl = null;
    if (fotoFile && fotoFile.size > 0) {
      fotoUrl = await uploadToCloudinary(fotoFile, "alunos");
    }

    // Buscar cliente e plano associado
    const cliente = await prisma.cliente.findUnique({
      where: { id: clienteId },
      include: {
        plano: true, // inclui os dados do plano
        _count: {
          select: { alunos: true }, // conta alunos atuais
        },
      },
    });

    if (!cliente) {
      return NextResponse.json(
        { error: "Cliente não encontrado" },
        { status: 400 }
      );
    }

    // Checar limite de alunos
    const limiteAlunos =
      (cliente.plano?.limiteAlunos || 0) + (cliente.extraAlunos || 0); // plano + extras

    if (cliente._count.alunos >= limiteAlunos) {
      return NextResponse.json(
        {
          error: `Limite de ${limiteAlunos} alunos atingido para este cliente`,
        },
        { status: 400 }
      );
    }

    const aluno = await prisma.aluno.create({
      data: {
        nome,
        email: email || null,
        telefone: telefone || null,
        dataNascimento: dataNascimento ? new Date(dataNascimento) : null,
        foto: fotoUrl,
        objetivo: objetivo || null,
        observacoes: observacoes || null,
        ativo,
        clienteId,
        usuarioId,
      },
      include: {
        usuario: true,
      },
    });

    return NextResponse.json(aluno, { status: 201 });
  } catch (error) {
    console.error("❌ Erro ao criar aluno:", error);
    return NextResponse.json({ error: "Erro ao criar aluno" }, { status: 500 });
  }
}
