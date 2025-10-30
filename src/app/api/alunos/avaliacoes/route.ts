import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import path from "path";
import fs from "fs/promises";

/**
 * Funções utilitárias para leitura segura de valores do FormData ou JSON,
 * convertendo tipos e garantindo consistência.
 */
function obterStringDeFormData(
  formulario: FormData,
  chave: string
): string | null {
  const valor = formulario.get(chave);
  if (valor === null || valor === undefined) return null;
  if (typeof valor === "string") return valor.trim() === "" ? null : valor;
  return null;
}

function obterNumeroFlutuanteDeFormData(
  formulario: FormData,
  chave: string
): number | null {
  const valor = formulario.get(chave);
  if (valor === null || valor === undefined) return null;
  const convertido = parseFloat(String(valor));
  return Number.isFinite(convertido) ? convertido : null;
}

function obterNumeroInteiroDeFormData(
  formulario: FormData,
  chave: string
): number | null {
  const valor = formulario.get(chave);
  if (valor === null || valor === undefined) return null;
  const convertido = parseInt(String(valor), 10);
  return Number.isFinite(convertido) ? convertido : null;
}

function obterBooleanoDeFormData(formulario: FormData, chave: string): boolean {
  const valor = formulario.get(chave);
  if (valor === null || valor === undefined) return false;
  const texto = String(valor).toLowerCase().trim();
  return texto === "true" || texto === "1" || texto === "on" || texto === "sim";
}

function obterDataDeFormData(formulario: FormData, chave: string): Date | null {
  const valor = formulario.get(chave);
  if (valor === null || valor === undefined) return null;
  const data = new Date(String(valor));
  return isNaN(data.getTime()) ? null : data;
}

async function salvarArquivoPdfEmUploads(
  arquivoPdf: File
): Promise<string | null> {
  try {
    if (!arquivoPdf || arquivoPdf.size === 0) return null;
    const extensao = path.extname(arquivoPdf.name).toLowerCase();
    if (extensao !== ".pdf") {
      throw new Error("Apenas arquivos PDF são permitidos.");
    }
    const diretorioUploadsAbsoluto = path.join(
      process.cwd(),
      "public",
      "uploads"
    );
    await fs.mkdir(diretorioUploadsAbsoluto, { recursive: true });

    const nomeArquivoSeguro = `${Date.now()}-${arquivoPdf.name.replace(
      /\s+/g,
      "-"
    )}`;
    const caminhoArquivoAbsoluto = path.join(
      diretorioUploadsAbsoluto,
      nomeArquivoSeguro
    );

    const bytes = await arquivoPdf.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await fs.writeFile(caminhoArquivoAbsoluto, buffer);

    const urlPublica = `/uploads/${nomeArquivoSeguro}`;
    return urlPublica;
  } catch (erro: any) {
    console.error("Erro ao salvar PDF:", erro?.message || erro);
    return null;
  }
}

async function excluirArquivoFisicoRelativoAUrlPublica(
  urlPublica: string | null | undefined
): Promise<void> {
  if (!urlPublica) return;
  try {
    const nomeArquivo = urlPublica.replace("/uploads/", "");
    const caminhoArquivoAbsoluto = path.join(
      process.cwd(),
      "public",
      "uploads",
      nomeArquivo
    );
    await fs.unlink(caminhoArquivoAbsoluto);
  } catch (erro) {
    // Não interromper a requisição caso não consiga deletar o arquivo físico
    console.warn(
      "Aviso ao deletar arquivo físico:",
      (erro as any)?.message || erro
    );
  }
}

function montarObjetoDobrasCutaneasAPartirDoFormData(
  formulario: FormData
): Record<string, number> | null {
  const mapaValores: Record<string, number> = {
    subescapular:
      obterNumeroFlutuanteDeFormData(
        formulario,
        "dobrasCutaneas.subescapular"
      ) ?? 0,
    triceps:
      obterNumeroFlutuanteDeFormData(formulario, "dobrasCutaneas.triceps") ?? 0,
    peitoral:
      obterNumeroFlutuanteDeFormData(formulario, "dobrasCutaneas.peitoral") ??
      0,
    axilar:
      obterNumeroFlutuanteDeFormData(formulario, "dobrasCutaneas.axilar") ?? 0,
    suprailiaca:
      obterNumeroFlutuanteDeFormData(
        formulario,
        "dobrasCutaneas.suprailiaca"
      ) ?? 0,
    abdominal:
      obterNumeroFlutuanteDeFormData(formulario, "dobrasCutaneas.abdominal") ??
      0,
    femural:
      obterNumeroFlutuanteDeFormData(formulario, "dobrasCutaneas.femural") ?? 0,
  };

  const todosZero = Object.values(mapaValores).every(
    (valor) => !Number.isFinite(valor) || valor === 0
  );
  if (todosZero) return null;
  return mapaValores;
}

function removerCamposIndefinidos<T extends Record<string, any>>(
  objeto: T
): Partial<T> {
  const resultado: Partial<T> = {};
  Object.keys(objeto).forEach((chave) => {
    const valor = objeto[chave];
    if (valor !== undefined) {
      (resultado as any)[chave] = valor;
    }
  });
  return resultado;
}

/**
 * GET /api/alunos/avaliacoes?alunoId=...
 * Lista as avaliações do aluno informado, ordenadas por data (mais recentes primeiro).
 */
export async function GET(request: NextRequest) {
  const urlDaRequisicao = request.nextUrl;
  const parametrosDeBusca = urlDaRequisicao.searchParams;
  const alunoIdentificador = parametrosDeBusca.get("alunoId");

  if (!alunoIdentificador) {
    return NextResponse.json(
      { erro: "Parâmetro 'alunoId' é obrigatório." },
      { status: 400 }
    );
  }

  try {
    const listaDeAvaliacoes = await prisma.avaliacao.findMany({
      where: { alunoId: alunoIdentificador },
      orderBy: { data: "desc" },
      select: {
        id: true,
        alunoId: true,
        tipo: true,
        resultado: true,
        observacoes: true,
        arquivo: true,
        data: true,
        createdAt: true,
        updatedAt: true,
        historicoMedico: true,
        objetivos: true,
        praticaAnterior: true,
        fumante: true,
        diabetes: true,
        doencasArticulares: true,
        cirurgias: true,
        peso: true,
        altura: true,
        imc: true,
        percentualGordura: true,
        circunferenciaCintura: true,
        circunferenciaQuadril: true,
        dobrasCutaneas: true,
        vo2Max: true,
        testeCooper: true,
        forcaSupino: true,
        repeticoesFlexoes: true,
        pranchaTempo: true,
        testeSentarEsticar: true,
      },
    });

    return NextResponse.json(listaDeAvaliacoes, { status: 200 });
  } catch (erro: any) {
    console.error("Erro ao consultar avaliações:", erro?.message || erro);
    return NextResponse.json(
      { erro: "Erro interno ao consultar avaliações." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/alunos/avaliacoes
 * Cria uma nova avaliação física para um aluno a partir de FormData (multipart/form-data).
 * Espera-se que o frontend envie todos os campos do formulário e, opcionalmente, um arquivo PDF no campo "arquivo".
 */
export async function POST(request: NextRequest) {
  try {
    const formulario = await request.formData();

    const alunoIdentificador = obterStringDeFormData(formulario, "alunoId");
    if (!alunoIdentificador) {
      return NextResponse.json(
        { erro: "O identificador do aluno (alunoId) é obrigatório." },
        { status: 400 }
      );
    }

    // Verificação opcional: existência do aluno
    const alunoExistente = await prisma.aluno.findUnique({
      where: { id: alunoIdentificador },
    });
    if (!alunoExistente) {
      return NextResponse.json(
        { erro: "Aluno não encontrado." },
        { status: 404 }
      );
    }

    // Campos principais
    const tipoDeAvaliacao = obterStringDeFormData(formulario, "tipo");
    const dataDaAvaliacao =
      obterDataDeFormData(formulario, "data") ?? new Date();

    // Anamnese
    const historicoMedico = obterStringDeFormData(
      formulario,
      "historicoMedico"
    );
    const objetivosDoAluno = obterStringDeFormData(formulario, "objetivos");
    const praticaAnteriorDeExercicios = obterStringDeFormData(
      formulario,
      "praticaAnterior"
    );
    const indicadorFumante = obterBooleanoDeFormData(formulario, "fumante");
    const indicadorDiabetes = obterBooleanoDeFormData(formulario, "diabetes");
    const indicadorDoencasArticulares = obterBooleanoDeFormData(
      formulario,
      "doencasArticulares"
    );
    const cirurgiasOuLesoes = obterStringDeFormData(formulario, "cirurgias");

    // Antropometria
    const pesoEmQuilos = obterNumeroFlutuanteDeFormData(formulario, "peso");
    const alturaEmCentimetros = obterNumeroFlutuanteDeFormData(
      formulario,
      "altura"
    );
    const indiceDeMassaCorporal = obterNumeroFlutuanteDeFormData(
      formulario,
      "imc"
    );
    const percentualDeGorduraCorporal = obterNumeroFlutuanteDeFormData(
      formulario,
      "percentualGordura"
    );
    const circunferenciaDaCintura = obterNumeroFlutuanteDeFormData(
      formulario,
      "circunferenciaCintura"
    );
    const circunferenciaDoQuadril = obterNumeroFlutuanteDeFormData(
      formulario,
      "circunferenciaQuadril"
    );
    const dobrasCutaneasObjeto =
      montarObjetoDobrasCutaneasAPartirDoFormData(formulario);

    // Cardiorrespiratório
    const consumoMaximoDeOxigenio = obterNumeroFlutuanteDeFormData(
      formulario,
      "vo2Max"
    );
    const distanciaTesteCooperEmMetros = obterNumeroFlutuanteDeFormData(
      formulario,
      "testeCooper"
    );

    // Muscular
    const cargaNoExercicioSupinoEmQuilos = obterNumeroFlutuanteDeFormData(
      formulario,
      "forcaSupino"
    );
    const quantidadeDeRepeticoesFlexoes = obterNumeroInteiroDeFormData(
      formulario,
      "repeticoesFlexoes"
    );
    const tempoDePranchaEmSegundos = obterNumeroInteiroDeFormData(
      formulario,
      "pranchaTempo"
    );

    // Flexibilidade
    const testeSentarEEsticarEmCentimetros = obterNumeroFlutuanteDeFormData(
      formulario,
      "testeSentarEsticar"
    );

    // Observações e Resultado
    const resultadoDaAvaliacao = obterStringDeFormData(formulario, "resultado");
    const observacoesGerais = obterStringDeFormData(formulario, "observacoes");

    // Upload de arquivo PDF (opcional)
    const arquivoEnviado = formulario.get("arquivo") as File | null;
    const urlPublicaDoArquivoPdf = arquivoEnviado
      ? await salvarArquivoPdfEmUploads(arquivoEnviado)
      : null;

    // Criação no banco de dados
    const avaliacaoCriada = await prisma.avaliacao.create({
      data: {
        alunoId: alunoIdentificador,
        tipo: tipoDeAvaliacao,
        data: dataDaAvaliacao,
        historicoMedico: historicoMedico,
        objetivos: objetivosDoAluno,
        praticaAnterior: praticaAnteriorDeExercicios,
        fumante: indicadorFumante,
        diabetes: indicadorDiabetes,
        doencasArticulares: indicadorDoencasArticulares,
        cirurgias: cirurgiasOuLesoes,
        peso: pesoEmQuilos,
        altura: alturaEmCentimetros,
        imc: indiceDeMassaCorporal,
        percentualGordura: percentualDeGorduraCorporal,
        circunferenciaCintura: circunferenciaDaCintura,
        circunferenciaQuadril: circunferenciaDoQuadril,
        dobrasCutaneas: dobrasCutaneasObjeto,
        vo2Max: consumoMaximoDeOxigenio,
        testeCooper: distanciaTesteCooperEmMetros,
        forcaSupino: cargaNoExercicioSupinoEmQuilos,
        repeticoesFlexoes: quantidadeDeRepeticoesFlexoes,
        pranchaTempo: tempoDePranchaEmSegundos,
        testeSentarEsticar: testeSentarEEsticarEmCentimetros,
        resultado: resultadoDaAvaliacao,
        observacoes: observacoesGerais,
        arquivo: urlPublicaDoArquivoPdf,
      },
      select: {
        id: true,
        alunoId: true,
        tipo: true,
        data: true,
      },
    });

    return NextResponse.json(
      { mensagem: "Avaliação criada com sucesso.", avaliacao: avaliacaoCriada },
      { status: 201 }
    );
  } catch (erro: any) {
    console.error("Erro ao criar avaliação:", erro?.message || erro);
    return NextResponse.json(
      { erro: "Erro interno ao criar avaliação." },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/alunos/avaliacoes?id=...
 * Atualiza uma avaliação existente. Aceita tanto multipart/form-data (para permitir reenvio de PDF)
 * quanto application/json (quando não houver arquivo). Atualiza apenas os campos informados.
 */
export async function PUT(request: NextRequest) {
  const urlDaRequisicao = request.nextUrl;
  const parametrosDeBusca = urlDaRequisicao.searchParams;
  const avaliacaoIdentificador = parametrosDeBusca.get("id");

  if (!avaliacaoIdentificador) {
    return NextResponse.json(
      { erro: "Parâmetro 'id' (identificador da avaliação) é obrigatório." },
      { status: 400 }
    );
  }

  try {
    const tipoDeConteudo = request.headers.get("content-type") || "";

    // Montagem do objeto de atualização (apenas campos presentes serão enviados ao Prisma)
    const dadosParaAtualizacao: Record<string, any> = {};

    if (tipoDeConteudo.includes("multipart/form-data")) {
      const formulario = await request.formData();

      // Campos escalares
      const tipoDeAvaliacao = obterStringDeFormData(formulario, "tipo");
      const dataDaAvaliacao = obterDataDeFormData(formulario, "data");

      const historicoMedico = obterStringDeFormData(
        formulario,
        "historicoMedico"
      );
      const objetivosDoAluno = obterStringDeFormData(formulario, "objetivos");
      const praticaAnteriorDeExercicios = obterStringDeFormData(
        formulario,
        "praticaAnterior"
      );
      const indicadorFumante = formulario.has("fumante")
        ? obterBooleanoDeFormData(formulario, "fumante")
        : undefined;
      const indicadorDiabetes = formulario.has("diabetes")
        ? obterBooleanoDeFormData(formulario, "diabetes")
        : undefined;
      const indicadorDoencasArticulares = formulario.has("doencasArticulares")
        ? obterBooleanoDeFormData(formulario, "doencasArticulares")
        : undefined;
      const cirurgiasOuLesoes = obterStringDeFormData(formulario, "cirurgias");

      const pesoEmQuilos = obterNumeroFlutuanteDeFormData(formulario, "peso");
      const alturaEmCentimetros = obterNumeroFlutuanteDeFormData(
        formulario,
        "altura"
      );
      const indiceDeMassaCorporal = obterNumeroFlutuanteDeFormData(
        formulario,
        "imc"
      );
      const percentualDeGorduraCorporal = obterNumeroFlutuanteDeFormData(
        formulario,
        "percentualGordura"
      );
      const circunferenciaDaCintura = obterNumeroFlutuanteDeFormData(
        formulario,
        "circunferenciaCintura"
      );
      const circunferenciaDoQuadril = obterNumeroFlutuanteDeFormData(
        formulario,
        "circunferenciaQuadril"
      );
      const dobrasCutaneasObjeto =
        montarObjetoDobrasCutaneasAPartirDoFormData(formulario);

      const consumoMaximoDeOxigenio = obterNumeroFlutuanteDeFormData(
        formulario,
        "vo2Max"
      );
      const distanciaTesteCooperEmMetros = obterNumeroFlutuanteDeFormData(
        formulario,
        "testeCooper"
      );

      const cargaNoExercicioSupinoEmQuilos = obterNumeroFlutuanteDeFormData(
        formulario,
        "forcaSupino"
      );
      const quantidadeDeRepeticoesFlexoes = obterNumeroInteiroDeFormData(
        formulario,
        "repeticoesFlexoes"
      );
      const tempoDePranchaEmSegundos = obterNumeroInteiroDeFormData(
        formulario,
        "pranchaTempo"
      );

      const testeSentarEEsticarEmCentimetros = obterNumeroFlutuanteDeFormData(
        formulario,
        "testeSentarEsticar"
      );

      const resultadoDaAvaliacao = obterStringDeFormData(
        formulario,
        "resultado"
      );
      const observacoesGerais = obterStringDeFormData(
        formulario,
        "observacoes"
      );

      // Upload de arquivo PDF (opcional)
      let urlPublicaDoArquivoPdf: string | undefined = undefined;
      const arquivoEnviado = formulario.get("arquivo") as File | null;
      if (arquivoEnviado && arquivoEnviado.size > 0) {
        // Antes de salvar o novo arquivo, recuperar avaliação antiga para excluir o arquivo anterior, se houver
        const avaliacaoAnterior = await prisma.avaliacao.findUnique({
          where: { id: avaliacaoIdentificador },
        });
        if (avaliacaoAnterior?.arquivo) {
          await excluirArquivoFisicoRelativoAUrlPublica(
            avaliacaoAnterior.arquivo
          );
        }
        const novaUrl = await salvarArquivoPdfEmUploads(arquivoEnviado);
        urlPublicaDoArquivoPdf = novaUrl || undefined;
      }

      Object.assign(
        dadosParaAtualizacao,
        removerCamposIndefinidos({
          tipo: tipoDeAvaliacao ?? undefined,
          data: dataDaAvaliacao ?? undefined,
          historicoMedico: historicoMedico ?? undefined,
          objetivos: objetivosDoAluno ?? undefined,
          praticaAnterior: praticaAnteriorDeExercicios ?? undefined,
          fumante: indicadorFumante,
          diabetes: indicadorDiabetes,
          doencasArticulares: indicadorDoencasArticulares,
          cirurgias: cirurgiasOuLesoes ?? undefined,
          peso: pesoEmQuilos ?? undefined,
          altura: alturaEmCentimetros ?? undefined,
          imc: indiceDeMassaCorporal ?? undefined,
          percentualGordura: percentualDeGorduraCorporal ?? undefined,
          circunferenciaCintura: circunferenciaDaCintura ?? undefined,
          circunferenciaQuadril: circunferenciaDoQuadril ?? undefined,
          dobrasCutaneas: dobrasCutaneasObjeto ?? undefined,
          vo2Max: consumoMaximoDeOxigenio ?? undefined,
          testeCooper: distanciaTesteCooperEmMetros ?? undefined,
          forcaSupino: cargaNoExercicioSupinoEmQuilos ?? undefined,
          repeticoesFlexoes: quantidadeDeRepeticoesFlexoes ?? undefined,
          pranchaTempo: tempoDePranchaEmSegundos ?? undefined,
          testeSentarEsticar: testeSentarEEsticarEmCentimetros ?? undefined,
          resultado: resultadoDaAvaliacao ?? undefined,
          observacoes: observacoesGerais ?? undefined,
          arquivo: urlPublicaDoArquivoPdf,
        })
      );
    } else if (tipoDeConteudo.includes("application/json")) {
      const corpoJson = await request.json();

      // Apenas copia campos existentes e ignora os ausentes
      Object.assign(
        dadosParaAtualizacao,
        removerCamposIndefinidos({
          tipo: corpoJson.tipo,
          data: corpoJson.data ? new Date(corpoJson.data) : undefined,
          historicoMedico: corpoJson.historicoMedico,
          objetivos: corpoJson.objetivos,
          praticaAnterior: corpoJson.praticaAnterior,
          fumante:
            typeof corpoJson.fumante === "boolean"
              ? corpoJson.fumante
              : undefined,
          diabetes:
            typeof corpoJson.diabetes === "boolean"
              ? corpoJson.diabetes
              : undefined,
          doencasArticulares:
            typeof corpoJson.doencasArticulares === "boolean"
              ? corpoJson.doencasArticulares
              : undefined,
          cirurgias: corpoJson.cirurgias,
          peso: typeof corpoJson.peso === "number" ? corpoJson.peso : undefined,
          altura:
            typeof corpoJson.altura === "number" ? corpoJson.altura : undefined,
          imc: typeof corpoJson.imc === "number" ? corpoJson.imc : undefined,
          percentualGordura:
            typeof corpoJson.percentualGordura === "number"
              ? corpoJson.percentualGordura
              : undefined,
          circunferenciaCintura:
            typeof corpoJson.circunferenciaCintura === "number"
              ? corpoJson.circunferenciaCintura
              : undefined,
          circunferenciaQuadril:
            typeof corpoJson.circunferenciaQuadril === "number"
              ? corpoJson.circunferenciaQuadril
              : undefined,
          dobrasCutaneas:
            corpoJson.dobrasCutaneas &&
            typeof corpoJson.dobrasCutaneas === "object"
              ? corpoJson.dobrasCutaneas
              : undefined,
          vo2Max:
            typeof corpoJson.vo2Max === "number" ? corpoJson.vo2Max : undefined,
          testeCooper:
            typeof corpoJson.testeCooper === "number"
              ? corpoJson.testeCooper
              : undefined,
          forcaSupino:
            typeof corpoJson.forcaSupino === "number"
              ? corpoJson.forcaSupino
              : undefined,
          repeticoesFlexoes: Number.isInteger(corpoJson.repeticoesFlexoes)
            ? corpoJson.repeticoesFlexoes
            : undefined,
          pranchaTempo: Number.isInteger(corpoJson.pranchaTempo)
            ? corpoJson.pranchaTempo
            : undefined,
          testeSentarEsticar:
            typeof corpoJson.testeSentarEsticar === "number"
              ? corpoJson.testeSentarEsticar
              : undefined,
          resultado: corpoJson.resultado,
          observacoes: corpoJson.observacoes,
          // Atualização de arquivo não é suportada via JSON puro
        })
      );
    } else {
      return NextResponse.json(
        {
          erro: "Tipo de conteúdo não suportado. Use 'multipart/form-data' ou 'application/json'.",
        },
        { status: 415 }
      );
    }

    if (Object.keys(dadosParaAtualizacao).length === 0) {
      return NextResponse.json(
        { erro: "Nenhum campo válido foi informado para atualização." },
        { status: 400 }
      );
    }

    const avaliacaoAtualizada = await prisma.avaliacao.update({
      where: { id: avaliacaoIdentificador },
      data: dadosParaAtualizacao,
    });

    return NextResponse.json(
      {
        mensagem: "Avaliação atualizada com sucesso.",
        avaliacao: avaliacaoAtualizada,
      },
      { status: 200 }
    );
  } catch (erro: any) {
    console.error("Erro ao atualizar avaliação:", erro?.message || erro);
    return NextResponse.json(
      { erro: "Erro interno ao atualizar avaliação." },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/alunos/avaliacoes?id=...
 * Exclui uma avaliação e remove o arquivo PDF associado (se existir).
 */
export async function DELETE(request: NextRequest) {
  const urlDaRequisicao = request.nextUrl;
  const parametrosDeBusca = urlDaRequisicao.searchParams;
  const avaliacaoIdentificador = parametrosDeBusca.get("id");

  if (!avaliacaoIdentificador) {
    return NextResponse.json(
      { erro: "Parâmetro 'id' (identificador da avaliação) é obrigatório." },
      { status: 400 }
    );
  }

  try {
    const avaliacaoRemovida = await prisma.avaliacao.delete({
      where: { id: avaliacaoIdentificador },
    });

    await excluirArquivoFisicoRelativoAUrlPublica(avaliacaoRemovida.arquivo);

    return NextResponse.json(
      { mensagem: "Avaliação excluída com sucesso." },
      { status: 200 }
    );
  } catch (erro: any) {
    console.error("Erro ao excluir avaliação:", erro?.message || erro);
    return NextResponse.json(
      { erro: "Erro interno ao excluir avaliação." },
      { status: 500 }
    );
  }
}
