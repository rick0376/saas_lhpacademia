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

    const clienteId = (session.user as any).clienteId;

    if (!clienteId) {
      return NextResponse.json(
        { error: "Cliente não identificado" },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";

    const alunos = await prisma.aluno.findMany({
      where: {
        clienteId,
        ...(search && {
          OR: [
            { nome: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        }),
      },
      include: {
        _count: {
          select: {
            treinos: true,
            medidas: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
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
// POST - Criar aluno
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

    let usuarioId = null;

    if (darAcessoApp) {
      if (!email) {
        return NextResponse.json(
          { error: "Email é obrigatório para dar acesso ao app" },
          { status: 400 }
        );
      }

      if (!senhaInicial) {
        return NextResponse.json(
          { error: "Senha inicial é obrigatória para dar acesso ao app" },
          { status: 400 }
        );
      }

      const usuarioExistente = await prisma.usuario.findUnique({
        where: { email },
      });

      if (usuarioExistente) {
        return NextResponse.json(
          { error: "Já existe um usuário com este email" },
          { status: 400 }
        );
      }

      const senhaHash = await bcrypt.hash(senhaInicial, 10);
      const usuario = await prisma.usuario.create({
        data: {
          nome,
          email,
          senha: senhaHash,
          role: "ALUNO",
          ativo: true,
          clienteId,
        },
      });

      usuarioId = usuario.id;
    }

    let fotoUrl = null;
    if (fotoFile && fotoFile.size > 0) {
      fotoUrl = await uploadToCloudinary(fotoFile, "alunos");
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
