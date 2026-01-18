// src/components/gruposTreinos/GrupoTreinosGrid/GrupoTreinosGrid.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./styles.module.scss";
import { GrupoTreinoCard } from "../GrupoTreinoCard/GrupoTreinoCard";
import { Button } from "@/components/ui/Button/Button";
import { useSession } from "next-auth/react";
import { CriarGrupoTreinoModal } from "../CriarGrupoTreinoModal/CriarGrupoTreinoModal";
import { EditarGrupoTreinoModal } from "../EditarGrupoTreinoModal/EditarGrupoTreinoModal";
import { ExcluirGrupoTreinoModal } from "../ExcluirGrupoTreinoModal/ExcluirGrupoTreinoModal";

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
  const role = (session?.user as any)?.role;

  const [grupos, setGrupos] = useState<GrupoItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [permissoes, setPermissoes] = useState<Permissao[]>([]);
  const [modalCreateOpen, setModalCreateOpen] = useState(false);

  const [modalEditOpen, setModalEditOpen] = useState(false);
  const [modalDeleteOpen, setModalDeleteOpen] = useState(false);
  const [grupoSelecionado, setGrupoSelecionado] = useState<GrupoItem | null>(
    null
  );

  const pTreinos = useMemo(
    () => permissoes.find((p) => p.recurso === "treinos"),
    [permissoes]
  );

  const podeCriarOuEditarGrupo = useMemo(() => {
    if (role === "SUPERADMIN") return true;
    return !!(pTreinos?.criar || pTreinos?.editar);
  }, [role, pTreinos]);

  const podeExcluirGrupo = useMemo(() => {
    if (role === "SUPERADMIN") return true;
    return !!pTreinos?.deletar;
  }, [role, pTreinos]);

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
      setPermissoes(Array.isArray(data) ? data : []);
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

  const abrirEditar = (id: string) => {
    const found = grupos.find((g) => g.id === id) || null;
    setGrupoSelecionado(found);
    setModalEditOpen(true);
  };

  const abrirExcluir = (id: string) => {
    const found = grupos.find((g) => g.id === id) || null;
    setGrupoSelecionado(found);
    setModalDeleteOpen(true);
  };

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
          {podeCriarOuEditarGrupo && (
            <Button onClick={() => setModalCreateOpen(true)} variant="primary">
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
          {podeCriarOuEditarGrupo && (
            <Button onClick={() => setModalCreateOpen(true)} variant="primary">
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
              onEdit={podeCriarOuEditarGrupo ? abrirEditar : undefined}
              onDelete={podeExcluirGrupo ? abrirExcluir : undefined}
            />
          ))}
        </div>
      )}

      {/* ✅ Modal Criar */}
      <CriarGrupoTreinoModal
        isOpen={modalCreateOpen}
        onClose={() => setModalCreateOpen(false)}
        onCreated={() => {
          setModalCreateOpen(false);
          fetchGrupos();
        }}
      />

      {/* ✅ Modal Editar */}
      <EditarGrupoTreinoModal
        isOpen={modalEditOpen}
        grupo={
          grupoSelecionado
            ? {
                id: grupoSelecionado.id,
                nome: grupoSelecionado.nome,
                descricao: grupoSelecionado.descricao,
              }
            : null
        }
        onClose={() => setModalEditOpen(false)}
        onSaved={fetchGrupos}
      />

      {/* ✅ Modal Excluir */}
      <ExcluirGrupoTreinoModal
        isOpen={modalDeleteOpen}
        grupo={
          grupoSelecionado
            ? { id: grupoSelecionado.id, nome: grupoSelecionado.nome }
            : null
        }
        onClose={() => setModalDeleteOpen(false)}
        onDeleted={fetchGrupos}
      />
    </div>
  );
}
