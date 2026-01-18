"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./styles.module.scss";
import { Modal } from "@/components/ui/Modal/Modal";
import { Button } from "@/components/ui/Button/Button";
import { useSession } from "next-auth/react";

type TreinoItem = { id: string; nome: string };

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
};

export function CriarGrupoTreinoModal({ isOpen, onClose, onCreated }: Props) {
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [treinos, setTreinos] = useState<TreinoItem[]>([]);
  const [selecionados, setSelecionados] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const { data: session } = useSession();
  const role = (session?.user as any)?.role;
  const isSuperAdmin = role === "SUPERADMIN";

  const [clienteId, setClienteId] = useState<string>("");
  const [clientes, setClientes] = useState<Array<{ id: string; nome: string }>>(
    []
  );

  const canSubmit = useMemo(() => {
    const okNome = nome.trim().length >= 2;
    if (!okNome) return false;
    if (isSuperAdmin) return !!clienteId;
    return true;
  }, [nome, isSuperAdmin, clienteId]);

  const carregarTreinos = async () => {
    try {
      const res = await fetch("/api/treinos");
      const data = await res.json();
      if (Array.isArray(data)) {
        setTreinos(
          data
            .map((t: any) => ({ id: t.id, nome: t.nome }))
            .sort((a, b) => a.nome.localeCompare(b.nome))
        );
      } else {
        setTreinos([]);
      }
    } catch {
      setTreinos([]);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    setNome("");
    setDescricao("");
    setSelecionados([]);
    setClienteId("");

    carregarTreinos();

    if (isSuperAdmin) {
      fetch("/api/clientes")
        .then((r) => r.json())
        .then((data) => setClientes(Array.isArray(data) ? data : []))
        .catch(() => setClientes([]));
    }
  }, [isOpen, isSuperAdmin]);

  const toggleTreino = (id: string) => {
    setSelecionados((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const criar = async () => {
    if (!canSubmit) return;

    setLoading(true);
    try {
      const res = await fetch("/api/grupos-treinos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome,
          descricao: descricao.trim() || null,
          treinoIds: selecionados,
          ...(isSuperAdmin ? { clienteId } : {}),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data?.error || "Erro ao criar grupo");
        return;
      }

      onCreated();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Criar Grupo de Treinos"
      size="medium"
    >
      <div className={styles.body}>
        <div className={styles.field}>
          <label>Nome do grupo</label>
          <input
            className={styles.input}
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex: Fortalecimento"
          />
        </div>

        <div className={styles.field}>
          <label>Descrição (opcional)</label>
          <textarea
            className={styles.textarea}
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Ex: Treinos para fortalecimento e estabilidade"
          />
        </div>

        {isSuperAdmin && (
          <div className={styles.field}>
            <label>Cliente (obrigatório)</label>
            <select
              className={styles.select}
              value={clienteId}
              onChange={(e) => setClienteId(e.target.value)}
            >
              <option value="">Selecione um cliente...</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className={styles.field}>
          <label>Associar treinos existentes (opcional)</label>
          <div className={styles.list}>
            {treinos.length === 0 ? (
              <div className={styles.muted}>Nenhum treino encontrado.</div>
            ) : (
              treinos.map((t) => (
                <label key={t.id} className={styles.item}>
                  <input
                    type="checkbox"
                    checked={selecionados.includes(t.id)}
                    onChange={() => toggleTreino(t.id)}
                  />
                  <span>{t.nome}</span>
                </label>
              ))
            )}
          </div>
        </div>

        <div className={styles.actions}>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={criar}
            disabled={!canSubmit || loading}
          >
            {loading ? "Criando..." : "Criar Grupo"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
