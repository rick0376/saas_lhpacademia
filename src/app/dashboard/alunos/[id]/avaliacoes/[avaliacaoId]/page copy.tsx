"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { ArrowLeft, Edit, Delete, Share2 } from "lucide-react";
import { jsPDF } from "jspdf";
import styles from "./styles.module.scss";
import { Toast } from "@/components/ui/Toast/Toast";
import { ConfirmModal } from "@/components/ui/ConfirmModal/ConfirmModal";

interface DobrasCutaneas {
  subescapular: number;
  triceps: number;
  peitoral: number;
  axilar: number;
  suprailiaca: number;
  abdominal: number;
  femural: number;
}

interface Avaliacao {
  id: string;
  tipo: string | null;
  data: Date;
  resultado: string | null;
  observacoes: string | null;
  historicoMedico: string | null;
  objetivos: string | null;
  praticaAnterior: string | null;
  fumante: boolean;
  diabetes: boolean;
  doencasArticulares: boolean;
  cirurgias: string | null;
  peso: number;
  altura: number;
  imc: number;
  percentualGordura: number;
  circunferenciaCintura: number;
  circunferenciaQuadril: number;
  dobrasCutaneas: DobrasCutaneas | null;
  vo2Max: number;
  testeCooper: number;
  forcaSupino: number;
  repeticoesFlexoes: number;
  pranchaTempo: number;
  testeSentarEsticar: number;
  arquivo: string | null;
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

  useEffect(() => {
    if (!session?.user || !alunoId || !avaliacaoId) {
      setError("Acesso negado ou aluno/avaliação não encontrados.");
      setLoading(false);
      return;
    }
    async function fetchAvaliacao() {
      try {
        const res = await fetch(
          `/api/alunos/${alunoId}/avaliacoes/${avaliacaoId}`
        );
        if (!res.ok) throw new Error("Avaliação não encontrada.");
        const data = await res.json();
        setAvaliacao(data);
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

  const safeNum = (num: number | null | undefined) => (num != null ? num : "-");

  // Linha divisor
  const divisor = "-------------------------------------------------";

  // Gera texto formatado para enviar pelo WhatsApp
  const gerarTextoWhatsApp = (a: Avaliacao) => {
    return encodeURIComponent(`
*Avaliação Física:*
*Tipo:* ${a.tipo ?? "-"}
*Data:* ${a.data ? new Date(a.data).toLocaleDateString() : "-"}

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

*Peso:* ${safeNum(a.peso)} kg
*Altura:* ${safeNum(a.altura)} cm
*IMC:* ${safeNum(a.imc)}
*% Gordura Corporal:* ${safeNum(a.percentualGordura)}%
*Circunferência Cintura:* ${safeNum(a.circunferenciaCintura)} cm
*Circunferência Quadril:* ${safeNum(a.circunferenciaQuadril)} cm

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

*VO2 Max:* ${safeNum(a.vo2Max)}
*Teste de Cooper:* ${safeNum(a.testeCooper)}

${divisor}

*Força Supino:* ${safeNum(a.forcaSupino)} kg
*Repetições Flexões:* ${safeNum(a.repeticoesFlexoes)}
*Tempo Prancha:* ${safeNum(a.pranchaTempo)} s

${divisor}

*Teste Sentar e Esticar:* ${safeNum(a.testeSentarEsticar)} cm

${divisor}

*Resultado:* ${a.resultado ?? "-"}
*Observações:* ${a.observacoes ?? "-"}
`);
  };

  // Abre WhatsApp com texto da avaliação
  const enviarWhatsApp = () => {
    if (!avaliacao) return;
    const text = gerarTextoWhatsApp(avaliacao);
    const url = `https://wa.me/?text=${text}`;
    window.open(url, "_blank");
  };

  const gerarPdf = () => {
    if (!avaliacao) return;
    const doc = new jsPDF();

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 10;
    let y = 20;

    // Cabeçalho simples
    const printHeader = () => {
      doc.setFontSize(16);
      doc.setTextColor("#000000");
      doc.text("Avaliação Física", margin, 15);
    };

    // Rodapé simples com número da página
    const printFooter = () => {
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.setTextColor("#000000");
        doc.text(
          `Página ${i} / ${totalPages}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: "center" }
        );
      }
    };

    printHeader();

    doc.setFontSize(12);
    doc.setTextColor("#000000");

    const linha = (
      label: string,
      value: string | number | null | undefined
    ) => {
      const text = `${label}: ${value ?? "-"}`;
      const maxTextWidth = pageWidth - margin * 2;
      const splitText = doc.splitTextToSize(text, maxTextWidth);

      // Se ultrapassar altura da página, adiciona nova página e imprime header
      if (y + splitText.length * 7 > pageHeight - 20) {
        doc.addPage();
        printHeader();
        doc.setFontSize(12);
        doc.setTextColor("#000000");
        y = 25;
      }

      doc.text(splitText, margin, y);
      y += splitText.length * 7 + 3;
    };

    linha("Tipo", avaliacao.tipo ?? "-");
    linha(
      "Data",
      avaliacao.data ? new Date(avaliacao.data).toLocaleDateString() : "-"
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
    linha("Tempo Prancha (s)", safeNum(avaliacao.pranchaTempo));

    linha("Teste Sentar e Esticar (cm)", safeNum(avaliacao.testeSentarEsticar));

    linha("Resultado", avaliacao.resultado);
    linha("Observações", avaliacao.observacoes);

    printFooter();

    doc.save(`avaliacao-${avaliacao.id}.pdf`);
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
            Avaliação {avaliacao.tipo ?? "-"} para o aluno{" "}
            {nomeAluno ?? alunoId}
          </p>
        </div>
      </div>

      <div className={styles.card}>
        {/* Informações Básicas */}
        <h3>Informações Básicas</h3>
        <p>
          <strong>Tipo:</strong> {avaliacao.tipo ?? "-"}
        </p>
        <p>
          <strong>Data:</strong>{" "}
          {avaliacao.data ? new Date(avaliacao.data).toLocaleDateString() : "-"}
        </p>

        {/* Anamnese */}
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

        {/* Antropometria */}
        <h3>Antropometria</h3>
        <p>
          <strong>Peso:</strong> {safeNum(avaliacao.peso)} kg
        </p>
        <p>
          <strong>Altura:</strong> {safeNum(avaliacao.altura)} cm
        </p>
        <p>
          <strong>IMC:</strong> {safeNum(avaliacao.imc)}
        </p>
        <p>
          <strong>% Gordura Corporal:</strong>{" "}
          {safeNum(avaliacao.percentualGordura)}%
        </p>
        <p>
          <strong>Circunferência Cintura:</strong>{" "}
          {safeNum(avaliacao.circunferenciaCintura)} cm
        </p>
        <p>
          <strong>Circunferência Quadril:</strong>{" "}
          {safeNum(avaliacao.circunferenciaQuadril)} cm
        </p>

        {/* Dobras Cutâneas */}
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

        {/* Cardiorespiratória */}
        <h3>Cardiorespiratória</h3>
        <p>
          <strong>VO2 Max:</strong> {safeNum(avaliacao.vo2Max)}
        </p>
        <p>
          <strong>Teste de Cooper:</strong> {safeNum(avaliacao.testeCooper)}
        </p>

        {/* Força Muscular */}
        <h3>Força Muscular</h3>
        <p>
          <strong>Força Supino:</strong> {safeNum(avaliacao.forcaSupino)} kg
        </p>
        <p>
          <strong>Repetições Flexões:</strong>{" "}
          {safeNum(avaliacao.repeticoesFlexoes)}
        </p>
        <p>
          <strong>Tempo Prancha:</strong> {safeNum(avaliacao.pranchaTempo)} s
        </p>

        {/* Flexibilidade */}
        <h3>Flexibilidade</h3>
        <p>
          <strong>Teste Sentar e Esticar:</strong>{" "}
          {safeNum(avaliacao.testeSentarEsticar)} cm
        </p>

        {/* Observações */}
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

      {/* Ações */}
      <div className={styles.formActions}>
        <Link
          href={`/dashboard/alunos/${alunoId}/avaliacoes/editar/${avaliacaoId}`}
          className={`${styles.buttonBase} ${styles.submitButton}`}
        >
          <Edit size={20} /> Editar
        </Link>

        <button
          type="button"
          className={`${styles.buttonBase} ${styles.whatsappButton}`}
          onClick={() => enviarWhatsApp()}
        >
          <Share2 size={20} /> WhatsApp
        </button>

        <button
          type="button"
          className={`${styles.buttonBase} ${styles.pdfButton}`}
          onClick={() => gerarPdf()}
        >
          Gerar PDF
        </button>

        <button
          type="button"
          className={`${styles.buttonBase} ${styles.deleteButton}`}
          onClick={openConfirm}
        >
          <Delete size={20} /> Excluir
        </button>
      </div>
    </div>
  );
}
