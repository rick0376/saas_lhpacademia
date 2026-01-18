"use client";

import { useEffect, useMemo, useState } from "react";
import { Modal } from "@/components/ui/Modal/Modal";
import { Button } from "@/components/ui/Button/Button";
import styles from "./styles.module.scss";

type Grupo = { id: string; nome: string; descricao?: string | null };

export function EditarGrupoTreinoModal({
  isOpen,
  grupo,
  onClose,
  onSaved,
}: {
  isOpen: boolean;
  grupo: Grupo | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !grupo) return;
    setNome(grupo.nome || "");
    setDescricao(grupo.descricao || "");
  }, [isOpen, grupo]);

  const canSubmit = useMemo(() => nome.trim().length >= 2, [nome]);

  const salvar = async () => {
    if (!grupo) return;
    if (!canSubmit) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/grupos-treinos/${grupo.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, descricao }),
      });
      const data = await res.json();

      if (!res.ok) {
        alert(data?.error || "Erro ao editar grupo");
        return;
      }

      onSaved();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Editar Grupo" size="small">
      <div className={styles.body}>
        <div className={styles.field}>
          <label>Nome</label>
          <input
            className={styles.input}
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label>Descrição (opcional)</label>
          <textarea
            className={styles.textarea}
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
          />
        </div>

        <div className={styles.actions}>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={salvar}
            disabled={!canSubmit || loading}
          >
            {loading ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
