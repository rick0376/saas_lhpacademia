import { prisma } from "@/lib/prisma"; // ajuste o caminho conforme seu projeto
import { format } from "date-fns";
import Link from "next/link";
import styles from "./styles.module.scss";

interface Avaliacao {
  id: string;
  tipo: string | null;
  data: Date;
  resultado: string | null;
  observacoes: string | null;
}

interface Props {
  params: { id: string };
}

export default async function AvaliacoesPage({ params }: Props) {
  const alunoId = params.id;

  const aluno = await prisma.aluno.findUnique({
    where: { id: alunoId },
    select: { nome: true },
  });

  const avaliacoes = await prisma.avaliacao.findMany({
    where: { alunoId },
    select: {
      id: true,
      tipo: true,
      data: true,
      resultado: true,
      observacoes: true,
    },
    orderBy: { data: "desc" },
  });

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>
        Avaliações de: {aluno?.nome ?? "Desconhecido"}
      </h1>
      {avaliacoes.length === 0 ? (
        <p className={styles.noData}>Sem avaliações cadastradas.</p>
      ) : (
        <table className={styles.table}>
          <thead className={styles.tableHead}>
            <tr className={styles.tableHeadRow}>
              <th className={styles.tableHeadCell}>Tipo</th>
              <th className={styles.tableHeadCell}>Data</th>
              <th className={styles.tableHeadCell}>Resultado</th>
              <th className={styles.tableHeadCell}>Observações</th>
              <th
                className={`${styles.tableHeadCell} ${styles.tableBodyCellCenter}`}
              >
                Ações
              </th>
            </tr>
          </thead>
          <tbody>
            {avaliacoes.map((av) => (
              <tr key={av.id} className={styles.tableBodyRow}>
                <td className={styles.tableBodyCell} data-label="Tipo">
                  {av.tipo ?? "-"}
                </td>
                <td className={styles.tableBodyCell} data-label="Data">
                  {format(new Date(av.data), "dd/MM/yyyy")}
                </td>
                <td className={styles.tableBodyCell} data-label="Resultado">
                  {av.resultado ?? "-"}
                </td>
                <td className={styles.tableBodyCell} data-label="Observações">
                  {av.observacoes ?? "-"}
                </td>
                <td
                  className={`${styles.tableBodyCell} ${styles.tableBodyCellCenter}`}
                  data-label="Ações"
                >
                  <Link
                    href={`/dashboard/alunos/${alunoId}/avaliacoes/${av.id}`}
                    className={styles.linkButton}
                  >
                    Ver
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
