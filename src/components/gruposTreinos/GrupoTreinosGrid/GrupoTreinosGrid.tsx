//src/components/gruposTreinos/GrupoTreinosGrid/GrupoTreinosGrid.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./styles.module.scss";
import { GrupoTreinoCard } from "../GrupoTreinoCard/GrupoTreinoCard";
import { Button } from "@/components/ui/Button/Button";
import { useSession } from "next-auth/react";
import { CriarGrupoTreinoModal } from "../CriarGrupoTreinoModal/CriarGrupoTreinoModal";

type GrupoItem = {
  id: string;
  nome: string;
  descricao?: string | null;
  totalTreinos: number;
};

type Permissao = {
  recurso: string;
  ler: boolean;
  criar: boolean;
  editar: boolean;
  deletar: boolean;
};

export function GrupoTreinosGrid() {
  const { data: session, status } = useSession();

  const [grupos, setGrupos] = useState<GrupoItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [permissoes, setPermissoes] = useState<Permissao[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

  const role = (session?.user as any)?.role;

  const podeCriarGrupo = useMemo(() => {
    if (role === "SUPERADMIN") return true;
    const pTreinos = permissoes.find((p) => p.recurso === "treinos");
    // Grupo é organização de Treinos: permitir criar grupo se tiver criar OU editar treinos
    return !!(pTreinos?.criar || pTreinos?.editar);
  }, [permissoes, role]);

  const fetchPermissoes = async () => {
    if (!session) return;
    if (role === "SUPERADMIN") {
      setPermissoes([
        {
          recurso: "treinos",
          ler: true,
          criar: true,
          editar: true,
          deletar: true,
        },
      ]);
      return;
    }
    try {
      const res = await fetch("/api/permissoes/usuario");
      const data = await res.json();
      if (Array.isArray(data)) setPermissoes(data);
      else setPermissoes([]);
    } catch {
      setPermissoes([]);
    }
  };

  const fetchGrupos = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/grupos-treinos");
      const data = await res.json();
      setGrupos(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchPermissoes();
      fetchGrupos();
    }
  }, [status]);

  return (
    <div className={styles.wrapper}>
      <div className={styles.toolbar}>
        <div className={styles.left}>
          <h2 className={styles.h2}>📁 Grupos</h2>
          <p className={styles.p}>
            Clique em um grupo para ver os treinos associados.
          </p>
        </div>

        <div className={styles.right}>
          {podeCriarGrupo && (
            <Button onClick={() => setModalOpen(true)} variant="primary">
              ➕ Novo Grupo
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className={styles.loading}>Carregando grupos...</div>
      ) : grupos.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>📁</div>
          <h3>Nenhum grupo criado</h3>
          <p>Crie seu primeiro grupo e associe treinos existentes.</p>
          {podeCriarGrupo && (
            <Button onClick={() => setModalOpen(true)} variant="primary">
              Criar primeiro grupo
            </Button>
          )}
        </div>
      ) : (
        <div className={styles.grid}>
          {grupos.map((g) => (
            <GrupoTreinoCard
              key={g.id}
              id={g.id}
              nome={g.nome}
              descricao={g.descricao}
              totalTreinos={g.totalTreinos}
            />
          ))}
        </div>
      )}

      <CriarGrupoTreinoModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={() => {
          setModalOpen(false);
          fetchGrupos();
        }}
      />
    </div>
  );
}
