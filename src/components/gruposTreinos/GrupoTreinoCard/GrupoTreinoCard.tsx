"use client";

import Link from "next/link";
import styles from "./styles.module.scss";

type Props = {
  id: string;
  nome: string;
  descricao?: string | null;
  totalTreinos: number;
};

export function GrupoTreinoCard({ id, nome, descricao, totalTreinos }: Props) {
  return (
    <Link href={`/dashboard/grupos-treinos/${id}`} className={styles.card}>
      <div className={styles.top}>
        <div className={styles.icon}>📁</div>
        <div className={styles.count}>{totalTreinos} treino(s)</div>
      </div>

      <div className={styles.body}>
        <h3 className={styles.title}>{nome}</h3>
        <p className={styles.desc}>{descricao || "Sem descrição"}</p>
      </div>

      <div className={styles.arrow} aria-hidden="true">
        →
      </div>
    </Link>
  );
}
