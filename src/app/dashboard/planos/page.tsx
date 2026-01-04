"use client";

import { useState, useEffect } from "react";
import { PlanoForm } from "@/components/planos/PlanoForm/PlanoForm";
import { PlanoCard, Plano } from "@/components/planos/PlanoCard/PlanoCard";
import { Toast } from "@/components/ui/Toast/Toast";
import styles from "./styles.module.scss";

export default function PlanosPage() {
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [editingPlano, setEditingPlano] = useState<Plano | null>(null);

  // Busca planos
  const fetchPlanos = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/planos");
      const data = await res.json();
      setPlanos(data);
    } catch (err) {
      console.error(err);
      setToast({ message: "Erro ao buscar planos", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  // Criação ou atualização de plano
  const handleCreateOrUpdate = (planoData: Plano) => {
    if (editingPlano) {
      setPlanos((prev) =>
        prev.map((p) => (p.id === planoData.id ? planoData : p))
      );
      setEditingPlano(null);
    } else {
      setPlanos((prev) => [...prev, planoData]);
    }
  };

  // Deleta plano com retorno correto
  const handleDelete = async (
    id: string
  ): Promise<{ success?: boolean; error?: string }> => {
    try {
      const res = await fetch(`/api/planos/${id}`, { method: "DELETE" });
      const data = await res.json();

      if (!res.ok || data.error) {
        const errorMsg = data.error || "Erro ao deletar plano";
        setToast({ message: errorMsg, type: "error" });
        return { error: errorMsg };
      }

      setPlanos((prev) => prev.filter((p) => p.id !== id));
      setToast({ message: "Plano deletado com sucesso!", type: "success" });
      return { success: true };
    } catch (err: any) {
      const errorMsg = err?.message || "Erro ao deletar plano";
      setToast({ message: errorMsg, type: "error" });
      return { error: errorMsg };
    }
  };

  // Dispara edição: envia plano para o form
  const handleEditClick = (plano: Plano) => {
    setEditingPlano(plano);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Cancela edição
  const handleCancelEdit = () => {
    setEditingPlano(null);
  };

  useEffect(() => {
    fetchPlanos();
  }, []);

  return (
    <div className={styles.container}>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <h1 className={styles.title}>Planos</h1>

      <section className={styles.formSection}>
        <h2 className={styles.subtitle}>
          {editingPlano ? "Editar Plano" : "Criar Plano"}
        </h2>
        <PlanoForm
          initialData={editingPlano ?? undefined}
          onSuccess={handleCreateOrUpdate}
          onCancel={handleCancelEdit}
        />
      </section>

      <section className={styles.cardSection}>
        <h2 className={styles.subtitle}>Planos Cadastrados</h2>
        {loading ? (
          <p>Carregando planos...</p>
        ) : planos.length > 0 ? (
          <div className={styles.cardContainer}>
            {planos.map((plano) => (
              <PlanoCard
                key={plano.id}
                plano={plano}
                onDelete={handleDelete}
                onEdit={handleEditClick}
              />
            ))}
          </div>
        ) : (
          <p>Nenhum plano encontrado.</p>
        )}
      </section>
    </div>
  );
}
