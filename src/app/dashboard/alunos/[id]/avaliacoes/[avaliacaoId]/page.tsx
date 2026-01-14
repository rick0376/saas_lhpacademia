//app/dashboard/alunos/[id]/avaliacoes/[avaliacaoId}/page.tsx

"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { ArrowLeft, Edit, Delete, FileText, Trash2 } from "lucide-react";
import { FaEnvelope, FaPhone, FaBullseye, FaWhatsapp } from "react-icons/fa";
import { jsPDF } from "jspdf";
import styles from "./styles.module.scss";
import { Toast } from "@/components/ui/Toast/Toast";
import { ConfirmModal } from "@/components/ui/ConfirmModal/ConfirmModal";

interface Cliente {
  id: string;
  nome: string;
  logo?: string | null;
  ativo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface Aluno {
  id: string;
  nome: string;
  cliente: Cliente;
}

interface DobrasCutaneas {
  subescapular: number | null;
  triceps: number | null;
  peitoral: number | null;
  axilar: number | null;
  suprailiaca: number | null;
  abdominal: number | null;
  femural: number | null;
}

interface Avaliacao {
  id: string;
  aluno: Aluno;
  tipo: string | null;
  data: string | null;
  resultado: string | null;
  observacoes: string | null;
  historicoMedico: string | null;
  objetivos: string | null;
  praticaAnterior: string | null;
  fumante: boolean | null;
  diabetes: boolean | null;
  doencasArticulares: boolean | null;
  cirurgias: string | null;
  peso: number | null;
  altura: number | null;
  imc: number | null;
  percentualGordura: number | null;
  circunferenciaCintura: number | null;
  circunferenciaQuadril: number | null;
  dobrasCutaneas: DobrasCutaneas | null;
  vo2Max: number | null;
  testeCooper: number | null;
  forcaSupino: number | null;
  repeticoesFlexoes: number | null;
  pranchaTempo: number | null;
  testeSentarEsticar: number | null;
  arquivo: string | null;
}

interface Permissao {
  recurso: string;
  criar: boolean;
  ler: boolean;
  editar: boolean;
  deletar: boolean;
}

export default function AvaliacaoPage() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();

  const alunoId = params.id as string;
  const avaliacaoId = params.avaliacaoId as string;

  const [nomeAluno, setNomeAluno] = useState<string | null>(null);
  const [avaliacao, setAvaliacao] = useState<Avaliacao | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<
    "success" | "error" | "info" | "warning"
  >("info");
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [permissoes, setPermissoes] = useState<Permissao>({
    recurso: "avaliacoes",
    criar: false,
    ler: false,
    editar: false,
    deletar: false,
  });

  const [permCompartilhar, setPermCompartilhar] = useState<Permissao>({
    recurso: "avaliacoes_compartilhar",
    criar: false,
    ler: false,
    editar: false,
    deletar: false,
  });

  useEffect(() => {
    if (!session?.user || !alunoId || !avaliacaoId) {
      setError("Acesso negado ou aluno/avaliação não encontrados.");
      setLoading(false);
      return;
    }
    async function fetchAvaliacao() {
      try {
        const [avaliacaoRes, permissoesRes] = await Promise.all([
          fetch(`/api/alunos/${alunoId}/avaliacoes/${avaliacaoId}`),
          fetch("/api/permissoes/usuario"),
        ]);

        if (!avaliacaoRes.ok) throw new Error("Avaliação não encontrada.");
        const avaliacaoData = await avaliacaoRes.json();
        setAvaliacao(avaliacaoData);

        const permissoesData = await permissoesRes.json();

        const permissaoAvaliacoes = permissoesData.find(
          (p: Permissao) => p.recurso === "avaliacoes"
        );
        const permissaoCompartilhar = permissoesData.find(
          (p: Permissao) => p.recurso === "avaliacoes_compartilhar"
        );

        if (session.user.role === "SUPERADMIN") {
          setPermissoes({
            recurso: "avaliacoes",
            criar: true,
            ler: true,
            editar: true,
            deletar: true,
          });
          setPermCompartilhar({
            recurso: "avaliacoes_compartilhar",
            criar: false,
            ler: true,
            editar: true,
            deletar: false,
          });
        } else {
          setPermissoes(
            permissaoAvaliacoes || {
              recurso: "avaliacoes",
              criar: false,
              ler: false,
              editar: false,
              deletar: false,
            }
          );
          setPermCompartilhar(
            permissaoCompartilhar || {
              recurso: "avaliacoes_compartilhar",
              criar: false,
              ler: false,
              editar: false,
              deletar: false,
            }
          );
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchAvaliacao();
  }, [session, alunoId, avaliacaoId]);

  useEffect(() => {
    if (!session?.user || !alunoId) {
      setError("Acesso negado ou aluno não encontrado.");
      setLoading(false);
      return;
    }
    async function fetchAluno() {
      try {
        const res = await fetch(`/api/alunos/${alunoId}`);
        if (!res.ok) throw new Error("Aluno não encontrado.");
        const data = await res.json();
        setNomeAluno(data.nome);
      } catch (err: any) {
        setError(err.message);
      }
    }
    fetchAluno();
  }, [session, alunoId]);

  function showToast(
    message: string,
    type: "success" | "error" | "info" | "warning"
  ) {
    setToastMessage(message);
    setToastType(type);
  }

  function closeToast() {
    setToastMessage(null);
  }

  const openConfirm = () => setIsConfirmOpen(true);
  const cancelDelete = () => setIsConfirmOpen(false);

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(
        `/api/alunos/${alunoId}/avaliacoes/${avaliacaoId}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("Erro ao excluir a avaliação.");
      showToast("Avaliação excluída com sucesso.", "success");
      setIsConfirmOpen(false);
      router.push(`/dashboard/alunos/${alunoId}/avaliacoes`);
    } catch {
      showToast("Erro ao excluir a avaliação.", "error");
    } finally {
      setDeleting(false);
    }
  };

  const toStr = (
    value: string | number | boolean | null | undefined
  ): string => {
    if (value === null || value === undefined) return "-";
    if (typeof value === "boolean") return value ? "Sim" : "Não";
    return String(value);
  };

  const gerarPdf = async () => {
    if (!avaliacao) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 10;
    const bottomMargin = 20;
    let y = 50;

    const nomeAluno = avaliacao.aluno?.nome ?? "Aluno não informado";
    const nomeCliente = avaliacao?.aluno?.cliente?.nome || "SaaS Academia LHP";

    const getLogoBase64 = async () => {
      try {
        const origin =
          typeof window !== "undefined" ? window.location.origin : "";
        const url = `${origin}/imagens/logo.png`;
        const resp = await fetch(url, { cache: "no-store" });
        if (!resp.ok) return "";
        const blob = await resp.blob();
        return await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () =>
            resolve(typeof reader.result === "string" ? reader.result : "");
          reader.onerror = () => resolve("");
          reader.readAsDataURL(blob);
        });
      } catch {
        return "";
      }
    };

    const logoDataUri = await getLogoBase64();

    const printHeader = () => {
      doc.setFillColor(25, 35, 55);
      doc.rect(0, 0, pageWidth, 40, "F");
      doc.setFillColor(218, 165, 32);
      doc.rect(0, 35, pageWidth, 5, "F");

      if (logoDataUri) {
        try {
          doc.addImage(logoDataUri, "PNG", 10, 7, 18, 18);
        } catch {}
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(255, 255, 255);
      doc.text("AVALIAÇÃO FÍSICA", pageWidth / 2, 18, { align: "center" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(14);
      doc.setTextColor(218, 165, 32);
      doc.text("Relatório de Avaliação", margin, 30);
      doc.text(`Aluno: ${nomeAluno}`, pageWidth / 2, 30, { align: "center" });

      const agora = new Date();
      doc.setFontSize(7);
      doc.setTextColor(255, 255, 255);
      doc.text(
        `Gerado em ${agora.toLocaleDateString(
          "pt-BR"
        )} ${agora.toLocaleTimeString("pt-BR")}`,
        pageWidth - margin,
        30,
        { align: "right" }
      );
    };

    const printFooter = () => {
      const totalPages = doc.getNumberOfPages();
      const footerY = pageHeight - 15;

      doc.setDrawColor(220, 225, 235);
      doc.setLineWidth(0.5);

      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(25, 35, 55);
        doc.text(`Cliente: ${nomeCliente}`, margin, footerY);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.setTextColor(100, 116, 139);
        doc.text("Relatório de Avaliação Física", margin, footerY + 4);

        doc.text(
          `Página ${i} de ${totalPages}`,
          pageWidth - margin,
          footerY + 4,
          { align: "right" }
        );
      }
    };

    const newPage = () => {
      doc.addPage();
      y = 50;
      printHeader();
      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
    };

    const safeNum = (num: number | null | undefined) =>
      num === null || num === undefined ? "-" : num;

    const linha = (label: string, value: unknown, withLine = false) => {
      const maxTextWidth = pageWidth - margin * 2;
      const lineHeight = 7;
      const labelText = label + ":";

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      const gap = 4;
      const labelWidth = doc.getTextWidth(labelText);
      const labelX = margin;
      let valueX = labelX + labelWidth + gap;
      if (valueX > pageWidth - margin - 20) valueX = margin;
      const maxValueWidth = pageWidth - margin - valueX;
      const splitValue = doc.splitTextToSize(
        String(value ?? "-"),
        maxValueWidth > 0 ? maxValueWidth : maxTextWidth
      );
      const blocoHeight = Math.max(1, splitValue.length) * lineHeight;

      if (y + blocoHeight > pageHeight - bottomMargin) {
        newPage();
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
      }

      doc.text(labelText, labelX, y);
      doc.setFont("helvetica", "normal");
      doc.text(splitValue, valueX, y);
      y += blocoHeight + 3;

      if (withLine) {
        const lineY = y + 2;
        if (lineY > pageHeight - bottomMargin) newPage();
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.2);
        doc.line(margin, lineY, pageWidth - margin, lineY);
        y = lineY - 2;
      }
    };

    printHeader();
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);

    linha("Tipo", avaliacao.tipo ?? "-");
    linha(
      "Data",
      avaliacao.data
        ? new Date(avaliacao.data).toLocaleDateString("pt-BR")
        : "-"
    );
    linha("Histórico Médico", avaliacao.historicoMedico);
    linha("Objetivos", avaliacao.objetivos);
    linha("Prática Anterior", avaliacao.praticaAnterior);
    linha("Fumante", avaliacao.fumante ? "Sim" : "Não");
    linha("Diabetes", avaliacao.diabetes ? "Sim" : "Não");
    linha("Doenças Articulares", avaliacao.doencasArticulares ? "Sim" : "Não");
    linha("Cirurgias", avaliacao.cirurgias);
    linha("Peso (kg)", safeNum(avaliacao.peso));
    linha("Altura (cm)", safeNum(avaliacao.altura));
    linha("IMC", safeNum(avaliacao.imc));
    linha("% Gordura Corporal", safeNum(avaliacao.percentualGordura));
    linha(
      "Circunferência Cintura (cm)",
      safeNum(avaliacao.circunferenciaCintura)
    );
    linha(
      "Circunferência Quadril (cm)",
      safeNum(avaliacao.circunferenciaQuadril)
    );

    if (avaliacao.dobrasCutaneas) {
      linha("Subescapular (mm)", avaliacao.dobrasCutaneas.subescapular);
      linha("Tríceps (mm)", avaliacao.dobrasCutaneas.triceps);
      linha("Peitoral (mm)", avaliacao.dobrasCutaneas.peitoral);
      linha("Axilar (mm)", avaliacao.dobrasCutaneas.axilar);
      linha("Suprailiaca (mm)", avaliacao.dobrasCutaneas.suprailiaca);
      linha("Abdominal (mm)", avaliacao.dobrasCutaneas.abdominal);
      linha("Femural (mm)", avaliacao.dobrasCutaneas.femural);
    }

    linha("VO2 Max (ml/kg/min)", safeNum(avaliacao.vo2Max));
    linha("Teste de Cooper (m)", safeNum(avaliacao.testeCooper));
    linha("Força Supino (kg)", safeNum(avaliacao.forcaSupino));
    linha("Repetições Flexões", safeNum(avaliacao.repeticoesFlexoes));
    linha("Tempo Prancha (s)", safeNum(avaliacao.pranchaTempo), true);
    linha("Teste Sentar e Esticar (cm)", safeNum(avaliacao.testeSentarEsticar));
    linha("Resultado", avaliacao.resultado);
    linha("Observações", avaliacao.observacoes);

    printFooter();
    doc.save(`avaliacao-${avaliacao.id}.pdf`);
  };

  const gerarTextoWhatsApp = (a: Avaliacao): string => {
    const divisor = "-------------------------------------------------\n";
    return encodeURIComponent(`
*Avaliação Física:*
*Tipo:* ${a.tipo ?? "-"}
*Data:* ${a.data ?? "-"}

${divisor}

*Histórico Médico:* ${a.historicoMedico ?? "-"}
*Objetivos:* ${a.objetivos ?? "-"}
*Prática Anterior:* ${a.praticaAnterior ?? "-"}

${divisor}

*Fumante:* ${a.fumante ? "Sim" : "Não"}
*Diabetes:* ${a.diabetes ? "Sim" : "Não"}
*Doenças Articulares:* ${a.doencasArticulares ? "Sim" : "Não"}
*Cirurgias:* ${a.cirurgias ?? "-"}

${divisor}

*Peso:* ${toStr(a.peso)} kg
*Altura:* ${toStr(a.altura)} cm
*IMC:* ${toStr(a.imc)}
*% Gordura Corporal:* ${toStr(a.percentualGordura)}%
*Circunferência Cintura:* ${toStr(a.circunferenciaCintura)} cm
*Circunferência Quadril:* ${toStr(a.circunferenciaQuadril)} cm

${divisor}

*Dobras Cutâneas (mm):*
  *Subescapular:* ${a.dobrasCutaneas?.subescapular ?? "-"}
  *Tríceps:* ${a.dobrasCutaneas?.triceps ?? "-"}
  *Peitoral:* ${a.dobrasCutaneas?.peitoral ?? "-"}
  *Axilar:* ${a.dobrasCutaneas?.axilar ?? "-"}
  *Suprailiaca:* ${a.dobrasCutaneas?.suprailiaca ?? "-"}
  *Abdominal:* ${a.dobrasCutaneas?.abdominal ?? "-"}
  *Femural:* ${a.dobrasCutaneas?.femural ?? "-"}

${divisor}

*VO2 Max:* ${toStr(a.vo2Max)}
*Teste de Cooper:* ${toStr(a.testeCooper)}

${divisor}

*Força Supino:* ${toStr(a.forcaSupino)} kg
*Repetições Flexões:* ${toStr(a.repeticoesFlexoes)}
*Tempo Prancha:* ${toStr(a.pranchaTempo)} s

${divisor}

*Teste Sentar e Esticar:* ${toStr(a.testeSentarEsticar)} cm

${divisor}

*Resultado:* ${a.resultado ?? "-"}
*Observações:* ${a.observacoes ?? "-"}
    `);
  };

  const enviarWhatsApp = () => {
    if (!avaliacao) return;
    const text = gerarTextoWhatsApp(avaliacao);
    const url = `https://wa.me/?text=${text}`;
    window.open(url, "_blank");
  };

  if (loading) return <div>Carregando...</div>;
  if (error)
    return (
      <div className={styles.errorContainer}>
        <p>{error}</p>
      </div>
    );
  if (!avaliacao)
    return (
      <div className={styles.errorContainer}>
        <p>Avaliação não encontrada.</p>
      </div>
    );

  return (
    <div className={styles.container}>
      {toastMessage && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={closeToast}
          duration={3000}
        />
      )}

      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        title="Confirmação de exclusão"
        message="Você tem certeza que deseja excluir esta avaliação?"
        confirmText="Excluir"
        cancelText="Cancelar"
        type="danger"
        loading={deleting}
      />

      <div className={styles.header}>
        <div className={styles.headerContent}>
          <Link
            href={`/dashboard/alunos/${alunoId}/avaliacoes`}
            className={styles.backLink}
          >
            <ArrowLeft size={24} />
            Voltar às Avaliações
          </Link>
          <h1 className={styles.title}>Detalhes da Avaliação</h1>
          <p>
            Avaliação {avaliacao.tipo ?? "-"} para o aluno:{" "}
            <span className={styles.nomeDestaque}>{nomeAluno}</span>
          </p>
        </div>
      </div>

      <div className={styles.card}>
        <h3>Informações Básicas</h3>
        <p>
          <strong>Tipo:</strong> {avaliacao.tipo ?? "-"}
        </p>
        <p>
          <strong>Data:</strong>{" "}
          {avaliacao.data ? new Date(avaliacao.data).toLocaleDateString() : "-"}
        </p>

        <h3>Anamnese</h3>
        <p>
          <strong>Histórico Médico:</strong> {avaliacao.historicoMedico ?? "-"}
        </p>
        <p>
          <strong>Objetivos:</strong> {avaliacao.objetivos ?? "-"}
        </p>
        <p>
          <strong>Prática Anterior:</strong> {avaliacao.praticaAnterior ?? "-"}
        </p>
        <p>
          <strong>Fumante:</strong> {avaliacao.fumante ? "Sim" : "Não"}
        </p>
        <p>
          <strong>Diabetes:</strong> {avaliacao.diabetes ? "Sim" : "Não"}
        </p>
        <p>
          <strong>Doenças Articulares:</strong>{" "}
          {avaliacao.doencasArticulares ? "Sim" : "Não"}
        </p>
        <p>
          <strong>Cirurgias:</strong> {avaliacao.cirurgias ?? "-"}
        </p>

        <h3>Antropometria</h3>
        <p>
          <strong>Peso:</strong> {toStr(avaliacao.peso)} kg
        </p>
        <p>
          <strong>Altura:</strong> {toStr(avaliacao.altura)} cm
        </p>
        <p>
          <strong>IMC:</strong> {toStr(avaliacao.imc)}
        </p>
        <p>
          <strong>% Gordura Corporal:</strong>{" "}
          {toStr(avaliacao.percentualGordura)}%
        </p>
        <p>
          <strong>Circunferência Cintura:</strong>{" "}
          {toStr(avaliacao.circunferenciaCintura)} cm
        </p>
        <p>
          <strong>Circunferência Quadril:</strong>{" "}
          {toStr(avaliacao.circunferenciaQuadril)} cm
        </p>

        <h3>Dobras Cutâneas</h3>
        <p>
          <strong>Subescapular:</strong>{" "}
          {avaliacao.dobrasCutaneas?.subescapular ?? "-"} mm
        </p>
        <p>
          <strong>Tríceps:</strong> {avaliacao.dobrasCutaneas?.triceps ?? "-"}{" "}
          mm
        </p>
        <p>
          <strong>Peitoral:</strong> {avaliacao.dobrasCutaneas?.peitoral ?? "-"}{" "}
          mm
        </p>
        <p>
          <strong>Axilar:</strong> {avaliacao.dobrasCutaneas?.axilar ?? "-"} mm
        </p>
        <p>
          <strong>Suprailiaca:</strong>{" "}
          {avaliacao.dobrasCutaneas?.suprailiaca ?? "-"} mm
        </p>
        <p>
          <strong>Abdominal:</strong>{" "}
          {avaliacao.dobrasCutaneas?.abdominal ?? "-"} mm
        </p>
        <p>
          <strong>Femural:</strong> {avaliacao.dobrasCutaneas?.femural ?? "-"}{" "}
          mm
        </p>

        <h3>Cardiorespiratória</h3>
        <p>
          <strong>VO2 Max:</strong> {toStr(avaliacao.vo2Max)}
        </p>
        <p>
          <strong>Teste de Cooper:</strong> {toStr(avaliacao.testeCooper)}
        </p>

        <h3>Força Muscular</h3>
        <p>
          <strong>Força Supino:</strong> {toStr(avaliacao.forcaSupino)} kg
        </p>
        <p>
          <strong>Repetições Flexões:</strong>{" "}
          {toStr(avaliacao.repeticoesFlexoes)}
        </p>
        <p>
          <strong>Tempo Prancha:</strong> {toStr(avaliacao.pranchaTempo)} s
        </p>

        <h3>Flexibilidade</h3>
        <p>
          <strong>Teste Sentar e Esticar:</strong>{" "}
          {toStr(avaliacao.testeSentarEsticar)} cm
        </p>

        <h3>Observações</h3>
        <p>
          <strong>Resultado:</strong> {avaliacao.resultado ?? "-"}
        </p>
        <p>
          <strong>Observações:</strong> {avaliacao.observacoes ?? "-"}
        </p>

        {avaliacao.arquivo && (
          <div>
            <strong>Arquivo: </strong>
            <a
              href={avaliacao.arquivo}
              target="_blank"
              rel="noopener noreferrer"
            >
              Abrir PDF
            </a>
          </div>
        )}
      </div>

      <div className={styles.formActions}>
        {permissoes.editar && (
          <Link
            href={`/dashboard/alunos/${alunoId}/avaliacoes/editar/${avaliacaoId}`}
            className={`${styles.buttonBase} ${styles.submitButton}`}
            title="Editar Avaliação" // Adicionado title para acessibilidade no mobile
          >
            <Edit className={styles.iconBtn} />
            <span className={styles.btnText}>Editar</span>
          </Link>
        )}

        {(permCompartilhar.ler || permCompartilhar.editar) && (
          <>
            <button
              type="button"
              className={`${styles.buttonBase} ${styles.whatsappButton}`}
              onClick={enviarWhatsApp}
              title="Enviar WhatsApp"
            >
              <FaWhatsapp className={styles.iconBtn} />
              <span className={styles.btnText}>WhatsApp</span>
            </button>

            <button
              type="button"
              className={`${styles.buttonBase} ${styles.pdfButton}`}
              onClick={gerarPdf}
              title="Gerar PDF"
            >
              <FileText className={styles.iconBtn} />
              <span className={styles.btnText}>PDF</span>
            </button>
          </>
        )}

        {permissoes.deletar && (
          <button
            type="button"
            className={`${styles.buttonBase} ${styles.deleteButton}`}
            onClick={openConfirm}
            title="Excluir Avaliação"
          >
            <Trash2 className={styles.iconBtn} />
            <span className={styles.btnText}>Excluir</span>
          </button>
        )}
      </div>
    </div>
  );
}
