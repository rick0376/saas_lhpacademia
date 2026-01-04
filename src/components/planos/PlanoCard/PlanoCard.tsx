"use client";

import { useState } from "react";
import { ConfirmModal } from "@/components/ui/ConfirmModal/ConfirmModal";
import { Modal } from "@/components/ui/Modal/Modal";
import { Toast } from "@/components/ui/Toast/Toast";
import styles from "./styles.module.scss";
import { Dumbbell, Edit, GraduationCap, Trash2, Users } from "lucide-react";

export interface ClienteResumo {
  id: string;
  nome: string;
  ativo: boolean;
}

export interface Plano {
  id: string;
  nome: string;
  limiteUsuarios: number;
  limiteAlunos: number;
  ativo: boolean;
  totalClientes: number;
  clientes?: ClienteResumo[];
}

interface PlanoCardProps {
  plano: Plano;
  onDelete: (id: string) => Promise<{ success?: boolean; error?: string }>;
  onEdit: (plano: Plano) => void;
}

export function PlanoCard({ plano, onDelete, onEdit }: PlanoCardProps) {
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [clientesModalOpen, setClientesModalOpen] = useState(false);

  const handleConfirmDelete = async () => {
    try {
      const result = await onDelete(plano.id);
      if (result?.error) {
        setToast({ message: result.error, type: "error" });
        return;
      }
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
      setConfirmDeleteOpen(false);
    }
  };

  return (
    <>
      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Excluir Plano"
        message={`Tem certeza que deseja excluir o plano "${plano.nome}"?`}
        type="danger"
      />

      {/* Card */}
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
            <span className={styles.label}>Clientes</span>
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
            onClick={() => setConfirmDeleteOpen(true)}
            className={styles.deleteButton}
            title="Excluir plano"
          >
            <Trash2 size={18} />
          </button>

          {/* Botão para abrir modal */}
          {plano.clientes && plano.clientes.length > 0 && (
            <button
              type="button"
              onClick={() => setClientesModalOpen(true)}
              className={styles.viewClientesButton}
              title="Ver clientes deste plano"
            >
              <Users size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Modal Clientes */}
      <Modal
        isOpen={clientesModalOpen}
        onClose={() => setClientesModalOpen(false)}
        title={`Clientes do Plano "${plano.nome}"`}
        size="medium"
      >
        <ul className={styles.clientesList}>
          {plano.clientes && plano.clientes.length > 0 ? (
            plano.clientes.map((cliente) => (
              <li key={cliente.id} className={styles.clienteItem}>
                {cliente.nome} {cliente.ativo ? "✅" : "🛑"}
              </li>
            ))
          ) : (
            <li className={styles.clienteItem}>Nenhum cliente neste plano</li>
          )}
        </ul>
      </Modal>
    </>
  );
}
