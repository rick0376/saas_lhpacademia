"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { ArrowLeft, Edit, Delete } from "lucide-react";
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

  // Helper para números com fallback
  const safeNum = (num: number | null | undefined) =>
    num !== null && num !== undefined ? num : "-";

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
            Avaliação de {avaliacao.tipo ?? "-"} para o aluno {alunoId}
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
          <strong>VO2 Max:</strong> {safeNum(avaliacao.vo2Max)}
        </p>
        <p>
          <strong>Teste de Cooper:</strong> {safeNum(avaliacao.testeCooper)}
        </p>

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

        <h3>Flexibilidade</h3>
        <p>
          <strong>Teste Sentar e Esticar:</strong>{" "}
          {safeNum(avaliacao.testeSentarEsticar)} cm
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

        <div className={styles.formActions}>
          <Link
            href={`/dashboard/alunos/${alunoId}/avaliacoes/editar/${avaliacaoId}`}
            className={styles.submitButton}
          >
            <Edit size={20} /> Editar Avaliação
          </Link>
          <button
            type="button"
            className={styles.deleteButton}
            onClick={openConfirm}
          >
            <Delete size={20} /> Excluir Avaliação
          </button>
        </div>
      </div>
    </div>
  );
}
