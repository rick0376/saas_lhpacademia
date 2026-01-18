//src/components/gruposTreinos/TreinosDoGrupo/TreinosDoGrupo.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./styles.module.scss";
import Link from "next/link";
import { Button } from "@/components/ui/Button/Button";
import { useSession } from "next-auth/react";
import { AdicionarTreinosModal } from "../AdicionarTreinosModal/AdicionarTreinosModal";

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

type Permissao = {
  recurso: string;
  ler: boolean;
  criar: boolean;
  editar: boolean;
  deletar: boolean;
};

export function TreinosDoGrupo({ grupoId }: { grupoId: string }) {
  const { data: session, status } = useSession();
  const role = (session?.user as any)?.role;

  const [data, setData] = useState<GrupoResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const [permissoes, setPermissoes] = useState<Permissao[]>([]);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const [modalAddOpen, setModalAddOpen] = useState(false);

  const pTreinos = useMemo(
    () => permissoes.find((p) => p.recurso === "treinos"),
    [permissoes]
  );

  const podeEditarTreino = useMemo(() => {
    if (role === "SUPERADMIN") return true;
    return !!pTreinos?.editar;
  }, [role, pTreinos]);

  const podeRemoverDoGrupo = useMemo(() => {
    if (role === "SUPERADMIN") return true;
    // Remover do grupo = edição/remoção do vínculo (permitir com editar ou deletar treinos)
    return !!(pTreinos?.editar || pTreinos?.deletar);
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
      const json = await res.json();
      setPermissoes(Array.isArray(json) ? json : []);
    } catch {
      setPermissoes([]);
    }
  };

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

  useEffect(() => {
    if (status === "authenticated") {
      fetchPermissoes();
    }
  }, [status]);

  const removerDoGrupo = async (treinoId: string) => {
    if (!podeRemoverDoGrupo) return;

    setRemovingId(treinoId);
    try {
      const res = await fetch(
        `/api/grupos-treinos/${grupoId}/treinos?treinoId=${treinoId}`,
        { method: "DELETE" }
      );
      const json = await res.json();

      if (!res.ok) {
        alert(json?.error || "Erro ao remover treino do grupo");
        return;
      }

      // Atualiza lista na tela sem reload
      setData((prev) =>
        prev
          ? { ...prev, treinos: prev.treinos.filter((t) => t.id !== treinoId) }
          : prev
      );
    } finally {
      setRemovingId(null);
    }
  };

  if (loading) return <div className={styles.loading}>Carregando...</div>;
  if (!data) return <div className={styles.loading}>Grupo não encontrado.</div>;

  return (
    <div className={styles.wrapper}>
      <div className={styles.head}>
        <div>
          <h2 className={styles.title}>📁 {data.nome}</h2>
          <p className={styles.desc}>{data.descricao || "Sem descrição"}</p>
        </div>

        {podeRemoverDoGrupo && (
          <Button variant="primary" onClick={() => setModalAddOpen(true)}>
            ➕ Adicionar treinos
          </Button>
        )}
      </div>

      {data.treinos.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>📋</div>
          <h3>Nenhum treino associado</h3>
          <p>
            Associe treinos ao grupo pela tela de criação / adicionar treinos.
          </p>
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

                {podeRemoverDoGrupo && (
                  <button
                    type="button"
                    className={styles.btnRemove}
                    onClick={() => removerDoGrupo(t.id)}
                    disabled={removingId === t.id}
                    title="Remover do grupo (o treino não será apagado)"
                  >
                    {removingId === t.id ? "Removendo..." : "Remover"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      <AdicionarTreinosModal
        isOpen={modalAddOpen}
        grupoId={grupoId}
        onClose={() => setModalAddOpen(false)}
        onUpdated={fetchData}
      />
    </div>
  );
}
