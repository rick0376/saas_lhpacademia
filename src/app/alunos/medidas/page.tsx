"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlunoLayout } from "@/components/alunos/AlunoLayout";
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
  const [medidas, setMedidas] = useState<Medida[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMedidas = async () => {
      try {
        const alunoId =
          localStorage.getItem("alunoId") || "cmh3lm26h00030gfcuq1chm08";
        console.log("🔍 Buscando medidas para alunoId:", alunoId);

        const res = await fetch(`/api/alunos/medidas?alunoId=${alunoId}`);
        if (!res.ok) {
          throw new Error(`Erro HTTP: ${res.status}`);
        }

        const data = await res.json();
        setMedidas(data);
        console.log("✅ Medidas carregadas:", data.length);
      } catch (err: any) {
        console.error("❌ Erro ao buscar medidas:", err.message);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMedidas();
  }, []);

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
          <div className={styles.loading}>Carregando medidas...</div>
        </div>
      </AlunoLayout>
    );
  }

  if (error) {
    return (
      <AlunoLayout>
        <div className={styles.container}>
          <div className={styles.error}>Erro ao carregar: {error}</div>
          <Link href="/alunos/dashboard" className={styles.backLink}>
            ← Voltar ao Dashboard
          </Link>
        </div>
      </AlunoLayout>
    );
  }

  return (
    <AlunoLayout>
      <div className={styles.container}>
        <h1>Minhas Medidas Corporais</h1>

        {medidas.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>📏</div>
            <p>Nenhuma medida cadastrada ainda.</p>
            <p>Aguarde o treinador registrar sua primeira avaliação!</p>
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

            {/* Histórico de medidas */}
            <div className={styles.tableWrapper}>
              <h2>Histórico de Evolução</h2>
              <table>
                <thead>
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
                <tbody>
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
                      <td data-label="Braço D">{medida.bracoDireito || "-"}</td>
                      <td data-label="Braço E">
                        {medida.bracoEsquerdo || "-"}
                      </td>
                      <td data-label="Coxa D">{medida.coxaDireita || "-"}</td>
                      <td data-label="Coxa E">{medida.coxaEsquerda || "-"}</td>
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

            {/* Observações da última medida */}
            {medidas[0]?.observacoes && (
              <div className={styles.observacoesCard}>
                <h3>Observações da Última Avaliação</h3>
                <p>{medidas[0].observacoes}</p>
              </div>
            )}
          </>
        )}

        <Link href="/alunos/dashboard" className={styles.backLink}>
          ← Voltar ao Dashboard
        </Link>
      </div>
    </AlunoLayout>
  );
}
