"use client";

import Link from "next/link";
import styles from "./styles.module.scss";

interface AlunosInativosTableProps {
  alunos: Array<{
    id: string;
    nome: string;
    dataCadastro: Date;
    _count: { treinos: number };
  }>;
}

export const AlunosInativosTable: React.FC<AlunosInativosTableProps> = ({
  alunos,
}) => {
  return (
    <div className={styles.card}>
      <h3 className={styles.title}>⚠️ Alunos Inativos (15+ dias)</h3>
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Aluno</th>
              <th>Treinos</th>
              <th>Desde</th>
            </tr>
          </thead>
          <tbody>
            {alunos.map((aluno) => (
              <tr key={aluno.id}>
                <td>
                  <Link href={`/dashboard/alunos/${aluno.id}`}>
                    {aluno.nome}
                  </Link>
                </td>
                <td className={styles.center}>{aluno._count.treinos}</td>
                <td>
                  {new Date(aluno.dataCadastro).toLocaleDateString("pt-BR")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
