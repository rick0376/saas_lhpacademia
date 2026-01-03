"use client";

import { useState } from "react";
import { ConfirmModal } from "../../ui/ConfirmModal/ConfirmModal";
import styles from "./styles.module.scss";

interface PlanoTableProps {
  planos: {
    id: string;
    nome: string;
    limiteUsuarios: number;
    limiteAlunos: number;
    ativo: boolean;
  }[];
  onDelete: (id: string) => void;
}

export function PlanoTable({ planos, onDelete }: PlanoTableProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPlanoId, setSelectedPlanoId] = useState<string | null>(null);

  const openModal = (id: string) => {
    setSelectedPlanoId(id);
    setModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (selectedPlanoId) await onDelete(selectedPlanoId);
    setModalOpen(false);
    setSelectedPlanoId(null);
  };

  return (
    <>
      <ConfirmModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Excluir Plano"
        message="Tem certeza que deseja excluir este plano?"
        type="danger"
      />

      <table className={styles.table}>
        <thead>
          <tr>
            <th>Nome</th>
            <th>Usuários</th>
            <th>Alunos</th>
            <th>Ativo</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {planos.map((plano) => (
            <tr key={plano.id}>
              <td>{plano.nome}</td>
              <td>{plano.limiteUsuarios}</td>
              <td>{plano.limiteAlunos}</td>
              <td>{plano.ativo ? "Sim" : "Não"}</td>
              <td>
                <button
                  className={styles.deleteButton}
                  onClick={() => openModal(plano.id)}
                >
                  🗑️
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
