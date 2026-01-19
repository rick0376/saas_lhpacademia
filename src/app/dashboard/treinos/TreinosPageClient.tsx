"use client";

import { useEffect, useState } from "react";
import { TreinoTable } from "@/components/treinos/TreinoTable";
import styles from "./styles.module.scss";

type Grupo = { id: string; nome: string };

export function TreinosPageClient() {
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [filtro, setFiltro] = useState<string>("all");

  useEffect(() => {
    fetch("/api/grupos-treinos")
      .then((r) => r.json())
      .then((data) => setGrupos(Array.isArray(data) ? data : []));
  }, []);

  return (
    <>
      {/* 🔽 SELECT DE GRUPOS */}
      <div className={styles.filterBar}>
        <select
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          className={styles.select}
        >
          <option value="all">Todos os treinos</option>
          <option value="none">Sem grupo</option>

          {grupos.map((g) => (
            <option key={g.id} value={g.id}>
              {g.nome}
            </option>
          ))}
        </select>
      </div>

      <TreinoTable
        grupoId={filtro !== "all" && filtro !== "none" ? filtro : undefined}
        semGrupo={filtro === "none"}
      />
    </>
  );
}
