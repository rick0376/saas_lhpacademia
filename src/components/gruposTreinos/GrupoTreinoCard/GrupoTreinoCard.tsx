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
      <div className={styles.cardHeader}>
        <h3 className={styles.cardTitle}>{nome}</h3>

        <div className={styles.headerRight}>
          <span className={styles.badge}>
            {String(totalTreinos).padStart(2, "0")} treinos
          </span>

          {(onEdit || onDelete) && (
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
          )}
        </div>
      </div>

      <div className={styles.cardBody}>
        <div className={styles.infoRow}>
          <span className={styles.label}>Descrição:</span>
          <span className={styles.value}>
            {descricao?.trim() ? descricao : "Sem descrição"}
          </span>
        </div>

        <div className={styles.statsRow}>
          <div className={styles.stat}>
            <span className={styles.statNumber}>
              {String(totalTreinos).padStart(2, "0")}
            </span>
            <span className={styles.statLabel}>Treinos no grupo</span>
          </div>
        </div>
      </div>

      <div className={styles.cardActions}>
        <span className={styles.viewButton}>👁️ Abrir Grupo</span>
        <span className={styles.cardArrow} aria-hidden="true">
          →
        </span>
      </div>
    </Link>
  );
}
