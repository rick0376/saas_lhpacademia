"use client";

import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import styles from "./styles.module.scss";

type Props = {
  id: string;
  nome: string;
  descricao?: string | null;
  totalTreinos: number;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
};

export function GrupoTreinoCard({
  id,
  nome,
  descricao,
  totalTreinos,
  onEdit,
  onDelete,
}: Props) {
  return (
    <Link href={`/dashboard/grupos-treinos/${id}`} className={styles.card}>
      <div className={styles.top}>
        <div className={styles.icon}>📁</div>

        <div className={styles.actions}>
          {onEdit && (
            <button
              type="button"
              className={styles.actionBtn}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onEdit(id);
              }}
              title="Editar grupo"
            >
              <Pencil size={16} />
            </button>
          )}

          {onDelete && (
            <button
              type="button"
              className={`${styles.actionBtn} ${styles.danger}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDelete(id);
              }}
              title="Excluir grupo"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>

      <div className={styles.body}>
        <h3 className={styles.title}>{nome}</h3>
        <p className={styles.desc}>{descricao || "Sem descrição"}</p>
      </div>

      <div className={styles.footer}>
        <span className={styles.count}>{totalTreinos} treino(s)</span>
        <span className={styles.arrow} aria-hidden="true">
          →
        </span>
      </div>
    </Link>
  );
}
