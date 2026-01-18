"use client";

import { Modal } from "@/components/ui/Modal/Modal";
import { Button } from "@/components/ui/Button/Button";
import styles from "./styles.module.scss";

type Grupo = { id: string; nome: string };

export function ExcluirGrupoTreinoModal({
  isOpen,
  grupo,
  onClose,
  onDeleted,
}: {
  isOpen: boolean;
  grupo: Grupo | null;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const excluir = async () => {
    if (!grupo) return;

    const res = await fetch(`/api/grupos-treinos/${grupo.id}`, {
      method: "DELETE",
    });
    const data = await res.json();

    if (!res.ok) {
      alert(data?.error || "Erro ao excluir grupo");
      return;
    }

    onDeleted();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Excluir Grupo" size="small">
      <div className={styles.body}>
        <p>
          Tem certeza que deseja excluir o grupo <strong>{grupo?.nome}</strong>?
        </p>
        <p className={styles.warn}>
          ⚠️ Apenas o grupo será excluído. Os treinos continuam existindo.
        </p>

        <div className={styles.actions}>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={excluir}>
            Excluir
          </Button>
        </div>
      </div>
    </Modal>
  );
}
