"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./styles.module.scss";
import { Button } from "@/components/ui/Button/Button";
import Link from "next/link";

type Treino = {
  id: string;
  nome: string;
  objetivo?: string | null;
  ativo: boolean;
  dataInicio: string;
};

type GrupoResponse = {
  id: string;
  nome: string;
  descricao?: string | null;
  treinos: Treino[];
};

export function TreinosDoGrupo({ grupoId }: { grupoId: string }) {
  const [data, setData] = useState<GrupoResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/grupos-treinos/${grupoId}`);
      const json = await res.json();
      if (!res.ok) {
        alert(json?.error || "Erro ao carregar grupo");
        setData(null);
        return;
      }
      setData(json);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [grupoId]);

  if (loading) return <div className={styles.loading}>Carregando...</div>;
  if (!data) return <div className={styles.loading}>Grupo não encontrado.</div>;

  return (
    <div className={styles.wrapper}>
      <div className={styles.head}>
        <div>
          <h2 className={styles.title}>📁 {data.nome}</h2>
          <p className={styles.desc}>{data.descricao || "Sem descrição"}</p>
        </div>
      </div>

      {data.treinos.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>📋</div>
          <h3>Nenhum treino associado</h3>
          <p>Associe treinos ao grupo pela tela de criação (por enquanto).</p>
          <Link href="/dashboard/treinos" className={styles.link}>
            Ir para Treinos
          </Link>
        </div>
      ) : (
        <div className={styles.list}>
          {data.treinos.map((t) => (
            <div key={t.id} className={styles.row}>
              <div className={styles.left}>
                <div className={styles.nome}>{t.nome}</div>
                <div className={styles.meta}>
                  {t.objetivo ? `🎯 ${t.objetivo} • ` : ""}
                  {new Date(t.dataInicio).toLocaleDateString("pt-BR")}
                </div>
              </div>

              <div className={styles.right}>
                <span
                  className={`${styles.badge} ${
                    t.ativo ? styles.on : styles.off
                  }`}
                >
                  {t.ativo ? "Ativo" : "Inativo"}
                </span>
                <Link
                  href={`/dashboard/treinos/${t.id}`}
                  className={styles.btn}
                >
                  Ver
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
