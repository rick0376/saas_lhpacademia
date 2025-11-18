import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import path from "path";
import { writeFile, unlink } from "fs/promises";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string; avaliacaoId: string }> }
) {
  const { id, avaliacaoId } = await context.params;

  if (!id || !avaliacaoId) {
    return NextResponse.json(
      { error: "Parâmetros inválidos" },
      { status: 400 }
    );
  }

  try {
    const avaliacao = await prisma.avaliacao.findUnique({
      where: { id: avaliacaoId },
      include: { 
        aluno: {
          include: {
            cliente: true  // ✅ ADICIONE ISSO
          }
        }
      },
    });

    if (!avaliacao) {
      return NextResponse.json(
        { error: "Avaliação não encontrada" },
        { status: 404 }
      );
    }

    if (avaliacao.aluno.id !== id) {
      return NextResponse.json(
        { error: "A avaliação não pertence a este aluno" },
        { status: 403 }
      );
    }

    return NextResponse.json(avaliacao);
  } catch {
    return NextResponse.json(
      { error: "Erro ao buscar a avaliação" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string; avaliacaoId: string }> }
) {
  const { id, avaliacaoId } = await context.params;

  if (!id || !avaliacaoId) {
    return NextResponse.json(
      { error: "Parâmetros inválidos" },
      { status: 400 }
    );
  }

  try {
    const avaliacao = await prisma.avaliacao.findUnique({
      where: { id: avaliacaoId },
      include: { aluno: true },
    });

    if (!avaliacao) {
      return NextResponse.json(
        { error: "Avaliação não encontrada" },
        { status: 404 }
      );
    }

    if (avaliacao.aluno.id !== id) {
      return NextResponse.json(
        { error: "A avaliação não pertence a este aluno" },
        { status: 403 }
      );
    }

    await prisma.avaliacao.delete({
      where: { id: avaliacaoId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao excluir avaliação" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string; avaliacaoId: string }> }
) {
  const { id, avaliacaoId } = await context.params;

  if (!id || !avaliacaoId) {
    return NextResponse.json(
      { error: "Parâmetros inválidos" },
      { status: 400 }
    );
  }

  try {
    const avaliacao = await prisma.avaliacao.findUnique({
      where: { id: avaliacaoId },
      include: { aluno: true },
    });

    if (!avaliacao) {
      return NextResponse.json(
        { error: "Avaliação não encontrada" },
        { status: 404 }
      );
    }

    if (avaliacao.aluno.id !== id) {
      return NextResponse.json(
        { error: "A avaliação não pertence a este aluno" },
        { status: 403 }
      );
    }

    const formData = await request.formData();

    const tipo = formData.get("tipo")?.toString() ?? undefined;
    const dataString = formData.get("data")?.toString();
    const dataValue = dataString ? new Date(dataString) : undefined;
    const historicoMedico =
      formData.get("historicoMedico")?.toString() ?? undefined;
    const objetivos = formData.get("objetivos")?.toString() ?? undefined;
    const praticaAnterior =
      formData.get("praticaAnterior")?.toString() ?? undefined;
    const fumante = formData.get("fumante") === "true";
    const diabetes = formData.get("diabetes") === "true";
    const doencasArticulares = formData.get("doencasArticulares") === "true";
    const cirurgias = formData.get("cirurgias")?.toString() ?? undefined;
    const peso = parseFloat(formData.get("peso")?.toString() ?? "0");
    const altura = parseFloat(formData.get("altura")?.toString() ?? "0");
    const imc = parseFloat(formData.get("imc")?.toString() ?? "0");
    const percentualGordura = parseFloat(
      formData.get("percentualGordura")?.toString() ?? "0"
    );
    const circunferenciaCintura = parseFloat(
      formData.get("circunferenciaCintura")?.toString() ?? "0"
    );
    const circunferenciaQuadril = parseFloat(
      formData.get("circunferenciaQuadril")?.toString() ?? "0"
    );

    const dobrasCutaneas = {
      subescapular: parseFloat(
        formData.get("dobrasCutaneas.subescapular")?.toString() ?? "0"
      ),
      triceps: parseFloat(
        formData.get("dobrasCutaneas.triceps")?.toString() ?? "0"
      ),
      peitoral: parseFloat(
        formData.get("dobrasCutaneas.peitoral")?.toString() ?? "0"
      ),
      axilar: parseFloat(
        formData.get("dobrasCutaneas.axilar")?.toString() ?? "0"
      ),
      suprailiaca: parseFloat(
        formData.get("dobrasCutaneas.suprailiaca")?.toString() ?? "0"
      ),
      abdominal: parseFloat(
        formData.get("dobrasCutaneas.abdominal")?.toString() ?? "0"
      ),
      femural: parseFloat(
        formData.get("dobrasCutaneas.femural")?.toString() ?? "0"
      ),
    };

    const vo2Max = parseFloat(formData.get("vo2Max")?.toString() ?? "0");
    const testeCooper = parseFloat(
      formData.get("testeCooper")?.toString() ?? "0"
    );
    const forcaSupino = parseFloat(
      formData.get("forcaSupino")?.toString() ?? "0"
    );
    const repeticoesFlexoes = parseInt(
      formData.get("repeticoesFlexoes")?.toString() ?? "0",
      10
    );
    const pranchaTempo = parseInt(
      formData.get("pranchaTempo")?.toString() ?? "0",
      10
    );
    const testeSentarEsticar = parseFloat(
      formData.get("testeSentarEsticar")?.toString() ?? "0"
    );
    const resultado = formData.get("resultado")?.toString() ?? undefined;
    const observacoes = formData.get("observacoes")?.toString() ?? undefined;

    let arquivoUrl = avaliacao.arquivo ?? null;

    const uploadedFile = formData.get("arquivo");
    if (
      uploadedFile &&
      typeof uploadedFile === "object" &&
      "arrayBuffer" in uploadedFile &&
      uploadedFile.size > 0
    ) {
      const buffer = Buffer.from(await uploadedFile.arrayBuffer());
      const uploadDir = path.resolve(
        process.cwd(),
        "public/uploads/avaliacoes"
      );
      const ext = path.extname(uploadedFile.name ?? ".pdf");
      const filename = `${avaliacaoId}-${Date.now()}${ext}`;
      const filePath = path.join(uploadDir, filename);
      await writeFile(filePath, buffer);
      if (arquivoUrl && arquivoUrl.startsWith("/uploads/avaliacoes/")) {
        try {
          await unlink(path.resolve("public", arquivoUrl));
        } catch {}
      }
      arquivoUrl = `/uploads/avaliacoes/${filename}`;
    }

    await prisma.avaliacao.update({
      where: { id: avaliacaoId },
      data: {
        tipo,
        data: dataValue,
        historicoMedico,
        objetivos,
        praticaAnterior,
        fumante,
        diabetes,
        doencasArticulares,
        cirurgias,
        peso,
        altura,
        imc,
        percentualGordura,
        circunferenciaCintura,
        circunferenciaQuadril,
        dobrasCutaneas,
        vo2Max,
        testeCooper,
        forcaSupino,
        repeticoesFlexoes,
        pranchaTempo,
        testeSentarEsticar,
        resultado,
        observacoes,
        arquivo: arquivoUrl,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Erro ao atualizar avaliação", detail: err.message },
      { status: 500 }
    );
  }
}
