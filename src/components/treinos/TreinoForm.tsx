"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./formStyles.module.scss";
import { Input } from "../ui/Input/Input";
import { Button } from "../ui/Button/Button";
import Link from "next/link";

interface Aluno {
  id: string;
  nome: string;
}

interface TreinoFormProps {
  initialData?: {
    id?: string;
    nome: string;
    alunoId?: string;
    objetivo?: string;
    observacoes?: string;
    ativo: boolean;
    dataInicio: string;
    dataFim?: string;
  };
  isEdit?: boolean;
}

export const TreinoForm: React.FC<TreinoFormProps> = ({
  initialData,
  isEdit = false,
}) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    nome: initialData?.nome || "",
    alunoId: initialData?.alunoId || "",
    objetivo: initialData?.objetivo || "",
    observacoes: initialData?.observacoes || "",
    ativo: initialData?.ativo ?? true,
    dataInicio:
      initialData?.dataInicio || new Date().toISOString().split("T")[0],
    dataFim: initialData?.dataFim || "",
  });

  useEffect(() => {
    fetchAlunos();
  }, []);

  const fetchAlunos = async () => {
    try {
      const response = await fetch("/api/alunos");
      const data = await response.json();
      setAlunos(data.filter((a: any) => a.ativo));
    } catch (error) {
      console.error("Erro ao carregar alunos:", error);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });

    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.nome || formData.nome.trim().length < 3) {
      newErrors.nome = "O nome deve ter no mínimo 3 caracteres";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setLoading(true);

    try {
      const url = isEdit ? `/api/treinos/${initialData?.id}` : "/api/treinos";
      const method = isEdit ? "PUT" : "POST";

      // Separar alunoId para não enviar ao criar o treino
      const { alunoId, ...treinoData } = formData;

      // 1️⃣ Criar o treino sem alunoId
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(treinoData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao salvar treino");
      }

      const treino = await response.json();

      // 2️⃣ Se alunoId estiver preenchido, associar o aluno ao treino
      if (alunoId) {
        await fetch(`/api/treinos/${treino.id}/atribuir`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ alunoId }),
        });
      }

      router.push(`/dashboard/treinos/${treino.id}`);
      router.refresh();
    } catch (error: any) {
      alert(error.message || "Erro ao salvar treino");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.formGrid}>
        <Input
          label="Nome do Treino *"
          type="text"
          name="nome"
          placeholder="Ex: Treino A - Peito/Tríceps"
          value={formData.nome}
          onChange={handleChange}
          error={errors.nome}
          required
        />

        <div className={styles.selectWrapper}>
          <label className={styles.label}>Aluno (Opcional)</label>
          <select
            name="alunoId"
            value={formData.alunoId}
            onChange={handleChange}
            className={`${styles.select} ${errors.alunoId ? styles.error : ""}`}
            disabled={isEdit}
          >
            <option value="">Nenhum (Treino template)</option>
            {alunos.map((aluno) => (
              <option key={aluno.id} value={aluno.id}>
                {aluno.nome}
              </option>
            ))}
          </select>
          {errors.alunoId && (
            <span className={styles.errorText}>{errors.alunoId}</span>
          )}
          <Link href="/dashboard/alunos/novo" className={styles.linkNovoAluno}>
            + Cadastrar novo aluno
          </Link>
          <p className={styles.helpText}>
            💡 Deixe vazio para criar um treino reutilizável
          </p>
        </div>

        <div className={styles.selectWrapper}>
          <label className={styles.label}>Objetivo</label>
          <select
            name="objetivo"
            value={formData.objetivo}
            onChange={handleChange}
            className={styles.select}
          >
            <option value="">Selecione...</option>
            <option value="Emagrecimento">Emagrecimento</option>
            <option value="Hipertrofia">Hipertrofia</option>
            <option value="Condicionamento Físico">
              Condicionamento Físico
            </option>
            <option value="Reabilitação">Reabilitação</option>
            <option value="Performance Esportiva">Performance Esportiva</option>
          </select>
        </div>

        <Input
          label="Data de Início *"
          type="date"
          name="dataInicio"
          value={formData.dataInicio}
          onChange={handleChange}
          required
        />

        <Input
          label="Data de Término (opcional)"
          type="date"
          name="dataFim"
          value={formData.dataFim}
          onChange={handleChange}
        />

        <div className={styles.textareaWrapper}>
          <label className={styles.label}>Observações</label>
          <textarea
            name="observacoes"
            placeholder="Informações adicionais sobre o treino..."
            value={formData.observacoes}
            onChange={handleChange}
            className={styles.textarea}
            rows={4}
          />
        </div>

        <div className={styles.checkboxWrapper}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              name="ativo"
              checked={formData.ativo}
              onChange={handleChange}
              className={styles.checkbox}
            />
            <span>Treino ativo</span>
          </label>
          <p className={styles.checkboxHelp}>
            Apenas treinos ativos aparecem para seleção do aluno
          </p>
        </div>
      </div>

      <div className={styles.formActions}>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading
            ? "Salvando..."
            : isEdit
            ? "Atualizar Treino"
            : "Criar Treino"}
        </Button>
      </div>
    </form>
  );
};
