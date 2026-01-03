"use client";

import { useState, useEffect } from "react";
import { Button } from "../../ui/Button/Button";
import { Input } from "../../ui/Input/Input";
import { Toast } from "../../ui/Toast/Toast";
import styles from "./styles.module.scss";

interface PlanoFormProps {
  initialData?: {
    id?: string;
    nome: string;
    limiteUsuarios: number;
    limiteAlunos: number;
    ativo: boolean;
  };
  onSuccess?: (plano: any) => void;
  onError?: (error: any) => void;
  onCancel?: () => void;
}

export function PlanoForm({
  initialData,
  onSuccess,
  onError,
  onCancel,
}: PlanoFormProps) {
  const [nome, setNome] = useState(initialData?.nome || "");
  const [limiteUsuarios, setLimiteUsuarios] = useState(
    initialData?.limiteUsuarios || 0
  );
  const [limiteAlunos, setLimiteAlunos] = useState(
    initialData?.limiteAlunos || 0
  );
  const [ativo, setAtivo] = useState(initialData?.ativo ?? true);

  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [loading, setLoading] = useState(false);

  // Atualiza os campos quando inicialData mudar (edição)
  useEffect(() => {
    setNome(initialData?.nome || "");
    setLimiteUsuarios(initialData?.limiteUsuarios || 0);
    setLimiteAlunos(initialData?.limiteAlunos || 0);
    setAtivo(initialData?.ativo ?? true);
  }, [initialData]);

  const resetFields = () => {
    setNome("");
    setLimiteUsuarios(0);
    setLimiteAlunos(0);
    setAtivo(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = initialData?.id
        ? `/api/planos/${initialData.id}`
        : "/api/planos";
      const method = initialData?.id ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, limiteUsuarios, limiteAlunos, ativo }),
      });

      const data = await res.json();

      if (!res.ok) {
        setToast({
          message: data.error || "Erro ao salvar plano",
          type: "error",
        });
        if (onError) onError(data.error || "Erro ao salvar plano");
        setLoading(false);
        return;
      }

      setToast({
        message: initialData?.id
          ? `Plano "${data.nome}" atualizado com sucesso!`
          : `Plano "${data.nome}" criado com sucesso!`,
        type: "success",
      });

      if (!initialData?.id) resetFields(); // limpa só se for criação

      if (onSuccess) onSuccess(data);
    } catch (err: any) {
      setToast({ message: "Erro ao salvar plano", type: "error" });
      if (onError) onError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    resetFields();
    if (onCancel) onCancel();
  };

  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.inputWrapper}>
          <Input
            label="Nome do Plano"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
          />
        </div>

        <div className={styles.inputWrapper}>
          <Input
            label="Limite de Usuários"
            type="number"
            value={limiteUsuarios}
            onChange={(e) => setLimiteUsuarios(Number(e.target.value))}
            required
          />
        </div>

        <div className={styles.inputWrapper}>
          <Input
            label="Limite de Alunos"
            type="number"
            value={limiteAlunos}
            onChange={(e) => setLimiteAlunos(Number(e.target.value))}
            required
          />
        </div>

        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={ativo}
            onChange={(e) => setAtivo(e.target.checked)}
            className={styles.checkboxInput}
          />
          Ativo
        </label>

        <div className={styles.buttonGroup}>
          <Button
            type="submit"
            className={styles.submitButton}
            disabled={loading}
          >
            {loading ? "Salvando..." : initialData?.id ? "Atualizar" : "Criar"}
          </Button>

          {initialData?.id && (
            <Button
              type="button"
              className={styles.cancelButton}
              onClick={handleCancel}
            >
              Cancelar
            </Button>
          )}
        </div>
      </form>
    </>
  );
}
