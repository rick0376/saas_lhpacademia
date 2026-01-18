"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./styles.module.scss";
import { Modal } from "@/components/ui/Modal/Modal";
import { Button } from "@/components/ui/Button/Button";

type TreinoItem = { id: string; nome: string };

type Props = {
  isOpen: boolean;
  grupoId: string;
  onClose: () => void;
  onUpdated: () => void;
};

export function AdicionarTreinosModal({
  isOpen,
  grupoId,
  onClose,
  onUpdated,
}: Props) {
  const [treinos, setTreinos] = useState<TreinoItem[]>([]);
  const [selecionados, setSelecionados] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const carregarTreinos = async () => {
    try {
      const res = await fetch("/api/treinos");
      const data = await res.json();

      if (Array.isArray(data)) {
        setTreinos(
          data
            .map((t: any) => ({ id: t.id, nome: t.nome }))
            .sort((a: TreinoItem, b: TreinoItem) =>
              a.nome.localeCompare(b.nome)
            )
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
    setSelecionados([]);
    carregarTreinos();
  }, [isOpen]);

  const toggle = (id: string) => {
    setSelecionados((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const canSubmit = useMemo(() => selecionados.length > 0, [selecionados]);

  const adicionar = async () => {
    if (!canSubmit) return;

    setLoading(true);
    try {
      const results = await Promise.all(
        selecionados.map((treinoId) =>
          fetch(`/api/grupos-treinos/${grupoId}/treinos`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ treinoId }),
          })
        )
      );

      const failed = results.filter((r) => !r.ok);
      if (failed.length > 0) {
        alert(`Não foi possível adicionar ${failed.length} treino(s).`);
      } else {
        onUpdated();
        onClose();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Adicionar treinos ao grupo"
      size="medium"
    >
      <div className={styles.body}>
        <div className={styles.list}>
          {treinos.length === 0 ? (
            <div className={styles.muted}>Nenhum treino encontrado.</div>
          ) : (
            treinos.map((t) => (
              <label key={t.id} className={styles.item}>
                <input
                  type="checkbox"
                  checked={selecionados.includes(t.id)}
                  onChange={() => toggle(t.id)}
                />
                <span>{t.nome}</span>
              </label>
            ))
          )}
        </div>

        <div className={styles.actions}>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={adicionar}
            disabled={!canSubmit || loading}
          >
            {loading ? "Adicionando..." : "Adicionar"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
