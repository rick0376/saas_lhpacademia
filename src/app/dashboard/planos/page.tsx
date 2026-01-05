"use client";

import { useState, useEffect } from "react";
import { PlanoForm } from "@/components/planos/PlanoForm/PlanoForm";
import { PlanoCard, Plano } from "@/components/planos/PlanoCard/PlanoCard";
import { Modal } from "@/components/ui/Modal/Modal";
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
  const [modalOpen, setModalOpen] = useState(false);

  // Busca todos os planos
  const fetchPlanos = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/planos?includeClientes=true");
      const data = await res.json();

      const planosNormalizados = data.map((plano: any) => ({
        ...plano,
        valor: Number(plano.valor),
      }));

      setPlanos(planosNormalizados);
    } catch (err) {
      console.error(err);
      setToast({ message: "Erro ao buscar planos", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlanos();
  }, []);

  // Abrir modal para edição
  const handleEditClick = (plano: Plano) => {
    setEditingPlano(plano);
    setModalOpen(true);
  };

  // Atualizar plano após edição
  const handleUpdatePlano = (planoAtualizado: Plano) => {
    setPlanos((prev) =>
      prev.map((p) => (p.id === planoAtualizado.id ? planoAtualizado : p))
    );
    setModalOpen(false);
    setEditingPlano(null);
    setToast({
      message: `Plano "${planoAtualizado.nome}" atualizado com sucesso!`,
      type: "success",
    });
  };

  // Deletar plano
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

      <section className={styles.cardSection}>
        {loading ? (
          <p>Carregando planos...</p>
        ) : planos.length > 0 ? (
          <div className={styles.cardContainer}>
            {planos.map((plano) => (
              <PlanoCard
                key={plano.id}
                plano={plano}
                onDelete={handleDelete}
                onEdit={handleEditClick} // botão editar abre modal
              />
            ))}
          </div>
        ) : (
          <p>Nenhum plano encontrado.</p>
        )}
      </section>

      {/* Modal de edição */}
      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingPlano(null);
        }}
        title={editingPlano ? `Editar Plano: ${editingPlano.nome}` : ""}
        size="medium"
      >
        {editingPlano && (
          <PlanoForm
            initialData={editingPlano}
            onSuccess={handleUpdatePlano}
            onCancel={() => {
              setModalOpen(false);
              setEditingPlano(null);
            }}
          />
        )}
      </Modal>
    </div>
  );
}
