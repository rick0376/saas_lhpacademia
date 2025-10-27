"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import styles from "./styles.module.scss";

export default function NovaAvaliacao() {
  const router = useRouter();
  const params = useParams();
  const alunoId = params.alunoId as string;
  const [formData, setFormData] = useState({
    tipo: "",
    resultado: "",
    observacoes: "",
    data: new Date().toISOString().split("T")[0],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Placeholder; integre Cloudinary upload aqui
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const data = new FormData();
    data.append("alunoId", alunoId);
    data.append("tipo", formData.tipo);
    data.append("resultado", formData.resultado);
    data.append("observacoes", formData.observacoes);
    data.append("data", formData.data);

    try {
      const res = await fetch("/api/avaliacoes", {
        method: "POST",
        body: data,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erro ao cadastrar");
      }
      setSuccess(true);
      setTimeout(
        () => router.push(`/admin/alunos/${alunoId}/avaliacoes`),
        1500
      );
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className={styles.success}>Avaliação cadastrada com sucesso!</div>
    );
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Nova Avaliação para Aluno ID: {alunoId}</h1>
      {error && <div className={styles.error}>{error}</div>}
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label className={styles.label}>Tipo *</label>
          <select
            name="tipo"
            value={formData.tipo}
            onChange={handleChange}
            required
            className={styles.input}
          >
            <option value="">Selecione</option>
            <option value="Inicial">Inicial</option>
            <option value="Mensal">Mensal</option>
            <option value="Trimestral">Trimestral</option>
            <option value="Anual">Anual</option>
          </select>
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Resultado *</label>
          <textarea
            name="resultado"
            value={formData.resultado}
            onChange={handleChange}
            required
            rows={3}
            className={styles.textarea}
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Observações</label>
          <textarea
            name="observacoes"
            value={formData.observacoes}
            onChange={handleChange}
            rows={3}
            className={styles.textarea}
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Data *</label>
          <input
            type="date"
            name="data"
            value={formData.data}
            onChange={handleChange}
            required
            className={styles.input}
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Arquivo PDF (opcional)</label>
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            className={styles.input}
          />
        </div>
        <button type="submit" disabled={loading} className={styles.button}>
          {loading ? "Cadastrando..." : "Cadastrar Avaliação"}
        </button>
        <Link href={`/admin/alunos/${alunoId}`} className={styles.back}>
          ← Voltar para Aluno
        </Link>
      </form>
    </div>
  );
}
