import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { MedidasList } from "@/components/medidas/MedidasList";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import styles from "./styles.module.scss";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AlunoPerfilPage({ params }: Props) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/");
  }

  // ✅ Await params (já correto no seu código)
  const { id } = await params;

  const aluno = await prisma.aluno.findUnique({
    where: { id },
    include: {
      treinos: {
        where: { ativo: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      },
      medidas: {
        orderBy: { data: "desc" },
        take: 1,
      },
      _count: {
        select: {
          treinos: true,
          medidas: true,
        },
      },
    },
  });

  if (!aluno) {
    redirect("/dashboard/alunos");
  }

  const calcularIdade = (dataNascimento: Date | null): number | null => {
    if (!dataNascimento) return null;
    const hoje = new Date();
    const nascimento = new Date(dataNascimento);
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const mes = hoje.getMonth() - nascimento.getMonth();
    if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
      idade--;
    }
    return idade;
  };

  const calcularIMC = (peso: number, altura: number): string => {
    const imc = peso / (altura * altura);
    return imc.toFixed(1);
  };

  const idade = aluno.dataNascimento
    ? calcularIdade(aluno.dataNascimento)
    : null;
  const ultimaMedida = aluno.medidas[0];
  const imc = ultimaMedida
    ? calcularIMC(ultimaMedida.peso, ultimaMedida.altura)
    : null;

  return (
    <>
      <main className={styles.main}>
        <div className={styles.container}>
          {/* Header do Perfil */}
          <div className={styles.profileHeader}>
            <Link href="/dashboard/alunos" className={styles.backButton}>
              ← Voltar
            </Link>

            <div className={styles.profileCard}>
              <div className={styles.profileInfo}>
                <div className={styles.avatar}>
                  {aluno.foto ? (
                    <img src={aluno.foto} alt={aluno.nome} />
                  ) : (
                    <span>{aluno.nome.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className={styles.info}>
                  <h1 className={styles.nome}>{aluno.nome}</h1>

                  <div className={styles.meta}>
                    {idade && <span>📅 {idade} anos</span>}
                    {aluno.objetivo && <span>🎯 {aluno.objetivo}</span>}
                    <span
                      className={`${styles.statusBadge} ${
                        aluno.ativo ? styles.ativo : styles.inativo
                      }`}
                    >
                      {aluno.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </div>
                </div>
              </div>

              <div className={styles.actionsContainer}>
                <div className={styles.actions}>
                  <Link href={`/dashboard/alunos/${aluno.id}/editar`}>
                    <button className={styles.editButton}>✏️ Editar</button>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Estatísticas */}
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>📋</div>
              <div className={styles.statContent}>
                <span className={styles.statValue}>{aluno._count.treinos}</span>
                <span className={styles.statLabel}> Treinos</span>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIcon}>📏</div>
              <div className={styles.statContent}>
                <span className={styles.statValue}>{aluno._count.medidas}</span>
                <span className={styles.statLabel}> Medidas</span>
              </div>
            </div>

            {ultimaMedida && (
              <>
                <div className={styles.statCard}>
                  <div className={styles.statIcon}>⚖️</div>
                  <div className={styles.statContent}>
                    <span className={styles.statValue}>
                      {ultimaMedida.peso} kg
                    </span>
                    <span className={styles.statLabel}> Peso Atual</span>
                  </div>
                </div>

                {imc && (
                  <div className={styles.statCard}>
                    <div className={styles.statIcon}>📊</div>
                    <div className={styles.statContent}>
                      <span className={styles.statValue}>{imc}</span>
                      <span className={styles.statLabel}> IMC</span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Informações de Contato */}
          {(aluno.email || aluno.telefone) && (
            <div className={styles.contactCard}>
              <h3 className={styles.cardTitleContacto}>
                Informações de Contato
              </h3>
              <div className={styles.contactGrid}>
                {aluno.email && (
                  <div className={styles.contactItem}>
                    <span className={styles.contactIcon}>📧</span>
                    <div>
                      <span className={styles.contactLabel}>Email: </span>
                      <span className={styles.contactValue}>{aluno.email}</span>
                    </div>
                  </div>
                )}
                {aluno.telefone && (
                  <div className={styles.contactItem}>
                    <span className={styles.contactIcon}>📱</span>
                    <div>
                      <span className={styles.contactLabel}>Telefone</span>
                      <span className={styles.contactValue}>
                        {aluno.telefone}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Treinos Ativos */}
          {aluno.treinos.length > 0 && (
            <div className={styles.treinosCard}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>Treinos Ativos</h3>
                <Link
                  href={`/dashboard/treinos?alunoId=${aluno.id}`}
                  className={styles.viewAll}
                >
                  Ver todos →
                </Link>
              </div>
              <div className={styles.treinosGrid}>
                {aluno.treinos.map((treino: any) => (
                  <Link
                    key={treino.id}
                    href={`/dashboard/treinos/${treino.id}`}
                    className={styles.treinoItem}
                  >
                    <span className={styles.treinoNome}>{treino.nome}</span>
                    {treino.objetivo && (
                      <span className={styles.treinoObjetivo}>
                        {treino.objetivo}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Observações */}
          {aluno.observacoes && (
            <div className={styles.observacoesCard}>
              <h3 className={styles.cardTitleObs}>Observações</h3>
              <p className={styles.observacoesText}>{aluno.observacoes}</p>
            </div>
          )}

          {/* Lista de Medidas */}
          <MedidasList alunoId={aluno.id} alunoNome={aluno.nome} />
        </div>
      </main>
    </>
  );
}
