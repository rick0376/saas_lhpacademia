"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { AlunoLayout } from "@/components/alunos/AlunoLayout";
import { ArrowLeft, RefreshCw } from "lucide-react";
import styles from "./styles.module.scss";

interface Medida {
  id: string;
  peso: number;
  altura: number;
  peito: number | null;
  cintura: number | null;
  quadril: number | null;
  bracoDireito: number | null;
  bracoEsquerdo: number | null;
  coxaDireita: number | null;
  coxaEsquerda: number | null;
  panturrilhaDireita: number | null;
  panturrilhaEsquerda: number | null;
  observacoes: string | null;
  data: string;
}

export default function MedidasPage() {
  const { data: session } = useSession();
  const [medidas, setMedidas] = useState<Medida[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloading, setReloading] = useState(false);

  // ✅ FUNÇÃO DE BUSCA
  const fetchMedidas = async (alunoId: string) => {
    try {
      console.log("🔍 BUSCANDO COM alunoId:", alunoId);

      const res = await fetch(`/api/alunos/medidas?alunoId=${alunoId}`, {
        cache: "no-store",
      });

      console.log("📡 STATUS DA RESPOSTA:", res.status);

      if (!res.ok) {
        throw new Error(`Erro HTTP: ${res.status}`);
      }

      const data = await res.json();
      console.log("✅ DADOS RETORNADOS:", data);

      setMedidas(data);
      setError(null);
    } catch (err: any) {
      console.error("❌ Erro:", err.message);
      setError(err.message);
    } finally {
      setLoading(false);
      setReloading(false);
    }
  };

  // ✅ FUNÇÃO DE RECARREGAR
  const recarregarMedidas = async () => {
    if (!session?.user) return;

    setReloading(true);
    const alunoId = (session.user as any).aluno?.id;
    if (alunoId) {
      await fetchMedidas(alunoId);
    }
  };

  // ✅ useEffect COM AUTO-REFRESH
  useEffect(() => {
    if (!session?.user) return;

    const alunoId = (session.user as any).aluno?.id;
    if (!alunoId) return;

    // Busca na primeira carga
    fetchMedidas(alunoId);

    // ✅ AUTO-RECARREGA A CADA 8 SEGUNDOS
    const interval = setInterval(() => {
      fetchMedidas(alunoId);
    }, 8000);

    return () => clearInterval(interval);
  }, [session]); // ✅ DEPENDE DA SESSÃO

  const calcularIMC = (peso: number, altura: number): string => {
    const imc = peso / (altura * altura);
    return imc.toFixed(1);
  };

  const formatarData = (data: string): string => {
    return new Date(data).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <AlunoLayout>
        <div className={styles.container}>
          <div className={styles.loading}>⏳ Carregando medidas...</div>
        </div>
      </AlunoLayout>
    );
  }

  if (error) {
    return (
      <AlunoLayout>
        <div className={styles.container}>
          <div className={styles.error}>❌ Erro ao carregar: {error}</div>
          <Link href="/alunos/dashboard" className={styles.backLink}>
            <ArrowLeft size={20} />
            Voltar ao Dashboard
          </Link>
        </div>
      </AlunoLayout>
    );
  }

  return (
    <AlunoLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>📏 Minhas Medidas Corporais</h1>
          <button
            onClick={recarregarMedidas}
            disabled={reloading}
            className={styles.refreshBtn}
            title="Recarregar medidas"
          >
            <RefreshCw size={20} />
            {reloading ? "Atualizando..." : "Atualizar"}
          </button>
        </div>

        {medidas.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>📏</div>
            <p>Nenhuma medida cadastrada ainda.</p>
            <p>Aguarde o treinador registrar sua primeira avaliação!</p>
            <button
              onClick={recarregarMedidas}
              disabled={reloading}
              className={styles.emptyButton}
            >
              <RefreshCw size={18} />
              Recarregar Agora
            </button>
          </div>
        ) : (
          <>
            {/* Estatísticas da última medida */}
            {medidas[0] && (
              <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                  <div className={styles.statIcon}>⚖️</div>
                  <div className={styles.statContent}>
                    <span className={styles.statValue}>
                      {medidas[0].peso} kg
                    </span>
                    <span className={styles.statLabel}>Peso Atual</span>
                  </div>
                </div>

                <div className={styles.statCard}>
                  <div className={styles.statIcon}>📏</div>
                  <div className={styles.statContent}>
                    <span className={styles.statValue}>
                      {(medidas[0].altura * 100).toFixed(0)} cm
                    </span>
                    <span className={styles.statLabel}>Altura</span>
                  </div>
                </div>

                <div className={styles.statCard}>
                  <div className={styles.statIcon}>📊</div>
                  <div className={styles.statContent}>
                    <span className={styles.statValue}>
                      {calcularIMC(medidas[0].peso, medidas[0].altura)}
                    </span>
                    <span className={styles.statLabel}>IMC</span>
                  </div>
                </div>

                <div className={styles.statCard}>
                  <div className={styles.statIcon}>📅</div>
                  <div className={styles.statContent}>
                    <span className={styles.statValue}>{medidas.length}</span>
                    <span className={styles.statLabel}>
                      {medidas.length === 1 ? "Medida" : "Medidas"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Histórico de medidas - COM SCROLL DIV */}
            <div className={styles.tableWrapper}>
              <h2>Histórico de Evolução</h2>
              <div className={styles.tableScroll}>
                <table className={styles.table}>
                  <thead className={styles.tableHead}>
                    <tr>
                      <th>Data</th>
                      <th>Peso (kg)</th>
                      <th>Altura (m)</th>
                      <th>IMC</th>
                      <th>Peito (cm)</th>
                      <th>Cintura (cm)</th>
                      <th>Quadril (cm)</th>
                      <th>Braço D (cm)</th>
                      <th>Braço E (cm)</th>
                      <th>Coxa D (cm)</th>
                      <th>Coxa E (cm)</th>
                      <th>Panturrilha D (cm)</th>
                      <th>Panturrilha E (cm)</th>
                    </tr>
                  </thead>
                  <tbody className={styles.tableBody}>
                    {medidas.map((medida) => (
                      <tr key={medida.id}>
                        <td data-label="Data">{formatarData(medida.data)}</td>
                        <td data-label="Peso">{medida.peso}</td>
                        <td data-label="Altura">{medida.altura.toFixed(2)}</td>
                        <td data-label="IMC">
                          {calcularIMC(medida.peso, medida.altura)}
                        </td>
                        <td data-label="Peito">{medida.peito || "-"}</td>
                        <td data-label="Cintura">{medida.cintura || "-"}</td>
                        <td data-label="Quadril">{medida.quadril || "-"}</td>
                        <td data-label="Braço D">
                          {medida.bracoDireito || "-"}
                        </td>
                        <td data-label="Braço E">
                          {medida.bracoEsquerdo || "-"}
                        </td>
                        <td data-label="Coxa D">{medida.coxaDireita || "-"}</td>
                        <td data-label="Coxa E">
                          {medida.coxaEsquerda || "-"}
                        </td>
                        <td data-label="Panturrilha D">
                          {medida.panturrilhaDireita || "-"}
                        </td>
                        <td data-label="Panturrilha E">
                          {medida.panturrilhaEsquerda || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Observações da última medida */}
            {medidas[0]?.observacoes && (
              <div className={styles.observacoesCard}>
                <h3>📝 Observações da Última Avaliação</h3>
                <p>{medidas[0].observacoes}</p>
              </div>
            )}
          </>
        )}

        <Link href="/alunos/dashboard" className={styles.backLink}>
          <ArrowLeft size={20} />
          Voltar ao Dashboard
        </Link>
      </div>
    </AlunoLayout>
  );
}
