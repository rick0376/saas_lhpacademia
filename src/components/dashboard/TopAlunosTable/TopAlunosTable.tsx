"use client";

import Link from "next/link";
import styles from "./styles.module.scss";

interface TopAlunosTableProps {
  alunos: Array<{
    alunoId: string;
    nome: string;
    _count: { alunoId: number };
  }>;
}

export const TopAlunosTable: React.FC<TopAlunosTableProps> = ({ alunos }) => {
  return (
    <div className={styles.card}>
      <h3 className={styles.title}>🏆 Top 10 Alunos Mais Ativos</h3>
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Aluno</th>
              <th>Treinos (30d)</th>
            </tr>
          </thead>
          <tbody>
            {alunos.map((aluno, index) => (
              <tr key={aluno.alunoId}>
                <td>
                  <Link href={`/dashboard/alunos/${aluno.alunoId}`}>
                    <span className={styles.medal}>
                      {index === 0
                        ? "🥇"
                        : index === 1
                        ? "🥈"
                        : index === 2
                        ? "🥉"
                        : `${index + 1}º`}
                    </span>
                    {aluno.nome}
                  </Link>
                </td>
                <td className={styles.center}>{aluno._count.alunoId}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
