"use client";

import { useState } from "react";
import { ConfirmModal } from "@/components/ui/ConfirmModal/ConfirmModal";
import { Toast } from "@/components/ui/Toast/Toast";
import styles from "./styles.module.scss";
import {
  Building2,
  Dumbbell,
  Edit,
  GraduationCap,
  Trash2,
  Users,
} from "lucide-react";

export interface Plano {
  id: string;
  nome: string;
  limiteUsuarios: number;
  limiteAlunos: number;
  ativo: boolean;
  totalClientes: number;
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
        <div className={styles.cardHeader}>
          <div className={styles.headerInfo}>
            <h3 className={styles.cardName}>{plano.nome}</h3>

            <span
              className={`${styles.statusBadge} ${
                plano.ativo ? styles.ativo : styles.inativo
              }`}
            >
              {plano.ativo ? "Ativo" : "Inativo"}
            </span>
          </div>
        </div>

        <div className={styles.cardContent}>
          <span className={styles.sectionLabel}>Limites do Plano</span>

          <div className={styles.infoPlan}>
            <div className={styles.infoItem}>
              <Users
                size={18}
                className={`${styles.iconInfo} ${styles.iconUsuarios}`}
              />
              <span className={styles.label}>Usuários</span>
              <span className={styles.value}>{plano.limiteUsuarios}</span>
            </div>

            <div className={styles.infoItem}>
              <GraduationCap
                size={18}
                className={`${styles.iconInfo} ${styles.iconAlunos}`}
              />
              <span className={styles.label}>Alunos</span>
              <span className={styles.value}>{plano.limiteAlunos}</span>
            </div>
          </div>

          <div className={styles.infoItem}>
            <Dumbbell
              size={18}
              className={`${styles.iconInfo} ${styles.iconClientes}`}
            />
            <span className={styles.label}>Clientes </span>
            <span className={styles.value}>{plano.totalClientes}</span>
          </div>
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            onClick={() => onEdit(plano)}
            className={styles.editButton}
            title="Editar plano"
          >
            <Edit size={18} />
          </button>

          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className={styles.deleteButton}
            title="Excluir plano"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
    </>
  );
}
