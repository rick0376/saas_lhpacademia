"use client";

import { useState } from "react";
import { ConfirmModal } from "@/components/ui/ConfirmModal/ConfirmModal";
import { Toast } from "@/components/ui/Toast/Toast";
import styles from "./styles.module.scss";

export interface Plano {
  id: string;
  nome: string;
  limiteUsuarios: number;
  limiteAlunos: number;
  ativo: boolean;
}

interface PlanoCardProps {
  plano: Plano;
  onDelete: (id: string) => Promise<{ success?: boolean; error?: string }>;
  onEdit: (plano: Plano) => void; // envia para o formulário no topo
}

export function PlanoCard({ plano, onDelete, onEdit }: PlanoCardProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const handleConfirmDelete = async () => {
    try {
      const result = await onDelete(plano.id);

      if (result?.error) {
        // ❌ só dispara erro se houver
        setToast({ message: result.error, type: "error" });
        return;
      }

      // ✅ dispara sucesso apenas se não houver erro
      setToast({
        message: `Plano "${plano.nome}" deletado com sucesso!`,
        type: "success",
      });
    } catch (err: any) {
      setToast({
        message: err?.message || "Erro ao deletar plano",
        type: "error",
      });
    } finally {
      setModalOpen(false);
    }
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

      <ConfirmModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Excluir Plano"
        message={`Tem certeza que deseja excluir o plano "${plano.nome}"?`}
        type="danger"
      />

      <div className={styles.card}>
        <div className={styles.header}>
          <h3 className={styles.name}>{plano.nome}</h3>
          <div className={styles.actions}>
            <div className={styles.info}>
              <span>Usuários: {plano.limiteUsuarios}</span>
              <span>Alunos: {plano.limiteAlunos}</span>
              <span>Status: {plano.ativo ? "Ativo" : "Inativo"}</span>
            </div>
            <button
              type="button"
              className={styles.edit}
              onClick={() => onEdit(plano)}
              title="Editar Plano"
            >
              ✏️
            </button>
            <button
              type="button"
              className={styles.delete}
              onClick={() => setModalOpen(true)}
              title="Excluir Plano"
            >
              🗑️
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
