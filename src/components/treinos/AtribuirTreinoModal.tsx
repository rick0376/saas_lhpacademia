"use client";

import { useState, useEffect } from "react";
import { Modal } from "../ui/Modal/Modal";
import { Button } from "../ui/Button/Button";
import { ConfirmModal } from "../ui/ConfirmModal/ConfirmModal";
import styles from "./AtribuirTreinoModal.module.scss";

interface Aluno {
  id: string;
  nome: string;
  email?: string;
  foto?: string;
}

interface AlunoAtribuido {
  id: string;
  alunoId: string;
  ativo: boolean;
  dataInicio: string;
  aluno: {
    id: string;
    nome: string;
    email?: string;
    foto?: string;
  };
}

interface AtribuirTreinoModalProps {
  isOpen: boolean;
  onClose: () => void;
  treinoId: string;
  treinoNome: string;
  onSuccess?: () => void;
}

export const AtribuirTreinoModal: React.FC<AtribuirTreinoModalProps> = ({
  isOpen,
  onClose,
  treinoId,
  treinoNome,
  onSuccess,
}) => {
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [alunosAtribuidos, setAlunosAtribuidos] = useState<AlunoAtribuido[]>(
    []
  );
  const [loading, setLoading] = useState(false);
  const [loadingAtribuicoes, setLoadingAtribuicoes] = useState(false);
  const [selectedAlunoId, setSelectedAlunoId] = useState("");
  const [error, setError] = useState("");

  // Estado da modal de confirmação
  const [confirmRemove, setConfirmRemove] = useState<{
    isOpen: boolean;
    alunoId: string;
    alunoNome: string;
    loading: boolean;
  }>({
    isOpen: false,
    alunoId: "",
    alunoNome: "",
    loading: false,
  });

  useEffect(() => {
    if (isOpen) {
      fetchAlunos();
      fetchAlunosAtribuidos();
    }
  }, [isOpen, treinoId]);

  const fetchAlunos = async () => {
    try {
      const response = await fetch("/api/alunos");
      if (!response.ok) throw new Error("Erro ao buscar alunos");
      const data = await response.json();
      setAlunos(data.filter((a: Aluno) => a));
    } catch (error) {
      console.error("Erro ao carregar alunos:", error);
      setError("Erro ao carregar lista de alunos");
    }
  };

  const fetchAlunosAtribuidos = async () => {
    setLoadingAtribuicoes(true);
    try {
      const response = await fetch(`/api/treinos/${treinoId}/atribuir`);
      if (!response.ok) throw new Error("Erro ao buscar atribuições");
      const data = await response.json();
      setAlunosAtribuidos(data);
    } catch (error) {
      console.error("Erro ao carregar atribuições:", error);
    } finally {
      setLoadingAtribuicoes(false);
    }
  };

  const handleAtribuir = async () => {
    if (!selectedAlunoId) {
      setError("Selecione um aluno");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/treinos/${treinoId}/atribuir`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          alunoId: selectedAlunoId,
          ativo: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao atribuir treino");
      }

      await fetchAlunosAtribuidos();
      setSelectedAlunoId("");
      setError("");
      onSuccess?.();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Executa a remoção após confirmação
  const handleConfirmRemover = async () => {
    setConfirmRemove((prev) => ({ ...prev, loading: true }));

    try {
      const response = await fetch(
        `/api/treinos/${treinoId}/atribuir?alunoId=${confirmRemove.alunoId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao remover atribuição");
      }

      // Fecha modal e atualiza lista
      setConfirmRemove({
        isOpen: false,
        alunoId: "",
        alunoNome: "",
        loading: false,
      });

      await fetchAlunosAtribuidos();
      setError("");
      onSuccess?.();
    } catch (err: any) {
      setError(err.message);
      setConfirmRemove((prev) => ({ ...prev, loading: false }));
    }
  };

  const alunosDisponiveis = alunos.filter(
    (aluno) => !alunosAtribuidos.some((atrib) => atrib.alunoId === aluno.id)
  );

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={`Gerenciar Atribuições - ${treinoNome}`}
        size="large"
      >
        <div className={styles.container}>
          {/* ➕ Atribuir novo aluno */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>➕ Atribuir a um aluno</h3>

            {error && <div className={styles.error}>{error}</div>}

            <div className={styles.formGroup}>
              <label className={styles.label}>Selecione o aluno:</label>
              <select
                value={selectedAlunoId}
                onChange={(e) => {
                  setSelectedAlunoId(e.target.value);
                  if (error) setError("");
                }}
                className={styles.select}
                disabled={loading}
              >
                <option value="">Escolha um aluno...</option>
                {alunosDisponiveis.map((aluno) => (
                  <option key={aluno.id} value={aluno.id}>
                    {aluno.nome}
                    {aluno.email ? ` (${aluno.email})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <Button
              onClick={handleAtribuir}
              disabled={loading || !selectedAlunoId}
              className={styles.btnAtribuir}
            >
              {loading ? "Atribuindo..." : "Atribuir Treino"}
            </Button>

            {alunosDisponiveis.length === 0 && !loading && (
              <p className={styles.infoText}>
                ℹ️ Todos os alunos já têm este treino atribuído
              </p>
            )}
          </div>

          {/* 👥 Alunos com este treino */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>
              👥 Alunos com este treino ({alunosAtribuidos.length})
            </h3>

            {loadingAtribuicoes ? (
              <div className={styles.loading}>
                <div className={styles.spinner}></div>
                <p>Carregando...</p>
              </div>
            ) : alunosAtribuidos.length === 0 ? (
              <div className={styles.empty}>
                <p>Nenhum aluno com este treino atribuído</p>
              </div>
            ) : (
              <div className={styles.alunosList}>
                {alunosAtribuidos.map((atrib) => (
                  <div key={atrib.id} className={styles.alunoItem}>
                    <div className={styles.alunoInfo}>
                      {atrib.aluno.foto && (
                        <img
                          src={atrib.aluno.foto}
                          alt={atrib.aluno.nome}
                          className={styles.alunoFoto}
                        />
                      )}
                      <div className={styles.alunoDetalhes}>
                        <span className={styles.alunoNome}>
                          {atrib.aluno.nome}
                        </span>
                        {atrib.aluno.email && (
                          <span className={styles.alunoEmail}>
                            {atrib.aluno.email}
                          </span>
                        )}
                        <span className={styles.alunoData}>
                          Desde:{" "}
                          {new Date(atrib.dataInicio).toLocaleDateString(
                            "pt-BR"
                          )}
                        </span>
                      </div>
                    </div>

                    <div className={styles.alunoActions}>
                      <span
                        className={`${styles.badge} ${
                          atrib.ativo ? styles.ativo : styles.inativo
                        }`}
                      >
                        {atrib.ativo ? "✓ Ativo" : "✕ Inativo"}
                      </span>
                      <button
                        onClick={() =>
                          setConfirmRemove({
                            isOpen: true,
                            alunoId: atrib.alunoId,
                            alunoNome: atrib.aluno.nome,
                            loading: false,
                          })
                        }
                        className={styles.btnRemover}
                        title="Remover treino deste aluno"
                        disabled={confirmRemove.loading || loadingAtribuicoes}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={styles.footer}>
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Fechar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal de Confirmação */}
      <ConfirmModal
        isOpen={confirmRemove.isOpen}
        onClose={() =>
          setConfirmRemove({
            isOpen: false,
            alunoId: "",
            alunoNome: "",
            loading: false,
          })
        }
        onConfirm={handleConfirmRemover}
        title="Remover Treino do Aluno"
        message={`Tem certeza que deseja remover o treino "${treinoNome}" do aluno "${confirmRemove.alunoNome}"? Esta ação não pode ser desfeita.`}
        confirmText="Sim, remover"
        cancelText="Cancelar"
        type="danger"
        loading={confirmRemove.loading}
      />
    </>
  );
};
