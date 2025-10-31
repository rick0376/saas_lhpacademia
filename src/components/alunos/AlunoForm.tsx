"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./alunoForm.module.scss";
import { Input } from "../ui/Input/Input";
import { Button } from "../ui/Button/Button";
import { ImageUpload } from "../ui/ImageUpload/ImageUpload";

interface AlunoFormProps {
  clienteId?: string | null;
  initialData?: {
    id?: string;
    nome: string;
    email?: string;
    telefone?: string;
    dataNascimento?: string;
    foto?: string;
    objetivo?: string;
    observacoes?: string;
    ativo: boolean;
  };
  isEdit?: boolean;
}

export const AlunoForm: React.FC<AlunoFormProps> = ({
  clienteId,
  initialData,
  isEdit = false,
}) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [clientes, setClientes] = useState<any[]>([]);

  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string>(
    initialData?.foto || ""
  );

  const [formData, setFormData] = useState({
    nome: initialData?.nome || "",
    email: initialData?.email || "",
    telefone: initialData?.telefone || "",
    dataNascimento: initialData?.dataNascimento || "",
    objetivo: initialData?.objetivo || "",
    observacoes: initialData?.observacoes || "",
    ativo: initialData?.ativo ?? true,
    darAcessoApp: false,
    senhaInicial: "",
    clienteIdSelecionado: clienteId || "",
  });

  useEffect(() => {
    if (!clienteId && !isEdit) {
      fetchClientes();
    }
  }, [clienteId, isEdit]);

  const fetchClientes = async () => {
    try {
      const response = await fetch("/api/clientes");
      if (response.ok) {
        const data = await response.json();
        setClientes(data.filter((c: any) => c.ativo));
      }
    } catch (error) {
      console.error("Erro ao buscar clientes:", error);
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

  const handleFotoChange = (file: File | null, previewUrl: string) => {
    setFotoFile(file);
    setFotoPreview(previewUrl);
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.nome || formData.nome.trim().length < 3) {
      newErrors.nome = "O nome deve ter no mínimo 3 caracteres";
    }

    if (!clienteId && !formData.clienteIdSelecionado) {
      newErrors.clienteIdSelecionado = "Selecione um cliente";
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Email inválido";
    }

    if (!isEdit && formData.darAcessoApp) {
      if (!formData.email) {
        newErrors.email = "Email é obrigatório para dar acesso ao app";
      }
      if (!formData.senhaInicial || formData.senhaInicial.length < 6) {
        newErrors.senhaInicial = "A senha deve ter no mínimo 6 caracteres";
      }
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
      const url = isEdit ? `/api/alunos/${initialData?.id}` : "/api/alunos";
      const method = isEdit ? "PUT" : "POST";

      const formDataToSend = new FormData();
      formDataToSend.append("nome", formData.nome);
      formDataToSend.append("email", formData.email || "");
      formDataToSend.append("telefone", formData.telefone || "");
      formDataToSend.append("dataNascimento", formData.dataNascimento || "");
      formDataToSend.append("objetivo", formData.objetivo || "");
      formDataToSend.append("observacoes", formData.observacoes || "");
      formDataToSend.append("ativo", String(formData.ativo));

      const clienteIdFinal = clienteId || formData.clienteIdSelecionado;
      formDataToSend.append("clienteId", clienteIdFinal);

      if (!isEdit) {
        formDataToSend.append("darAcessoApp", String(formData.darAcessoApp));
        if (formData.darAcessoApp) {
          formDataToSend.append("senhaInicial", formData.senhaInicial);
        }
      }

      if (fotoFile) {
        formDataToSend.append("foto", fotoFile);
      } else if (isEdit && initialData?.foto) {
        formDataToSend.append("fotoExistente", initialData.foto);
      }

      const response = await fetch(url, {
        method,
        body: formDataToSend,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao salvar aluno");
      }

      const resultado = await response.json();
      console.log("✅ Aluno salvo com sucesso:", resultado);

      router.push("/dashboard/alunos");
      router.refresh();
    } catch (error: any) {
      console.error("❌ Erro ao salvar aluno:", error);
      alert(error.message || "Erro ao salvar aluno");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.formGrid}>
        {!clienteId && !isEdit && (
          <div className={styles.selectWrapper}>
            <label className={styles.label}>Cliente/Academia *</label>
            <select
              name="clienteIdSelecionado"
              value={formData.clienteIdSelecionado}
              onChange={handleChange}
              className={styles.select}
              required
            >
              <option value="">Selecione o cliente...</option>
              {clientes.map((cliente) => (
                <option key={cliente.id} value={cliente.id}>
                  {cliente.nome}
                </option>
              ))}
            </select>
            {errors.clienteIdSelecionado && (
              <span className={styles.error}>
                {errors.clienteIdSelecionado}
              </span>
            )}
          </div>
        )}

        <Input
          label="Nome completo *"
          type="text"
          name="nome"
          placeholder="Digite o nome completo"
          value={formData.nome}
          onChange={handleChange}
          error={errors.nome}
          required
        />

        <Input
          label="Email"
          type="email"
          name="email"
          placeholder="email@exemplo.com"
          value={formData.email}
          onChange={handleChange}
          error={errors.email}
        />

        <Input
          label="Telefone"
          type="text"
          name="telefone"
          placeholder="(11) 98765-4321"
          value={formData.telefone}
          onChange={handleChange}
        />

        <Input
          label="Data de Nascimento"
          type="date"
          name="dataNascimento"
          value={formData.dataNascimento}
          onChange={handleChange}
        />

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
            <option value="Saúde e Bem-estar">Saúde e Bem-estar</option>
          </select>
        </div>

        <ImageUpload
          value={fotoPreview}
          onChange={handleFotoChange}
          label="Foto do Aluno"
          disabled={loading}
        />

        <div className={styles.textareaWrapper}>
          <label className={styles.label}>Observações</label>
          <textarea
            name="observacoes"
            placeholder="Informações adicionais sobre o aluno..."
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
            <span>Aluno ativo</span>
          </label>
          <p className={styles.checkboxHelp}>
            Alunos inativos não aparecem nas listagens principais
          </p>
        </div>

        {!isEdit && (
          <>
            <div className={styles.divider} />

            <div className={styles.checkboxWrapper}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  name="darAcessoApp"
                  checked={formData.darAcessoApp}
                  onChange={handleChange}
                  className={styles.checkbox}
                />
                <span>Dar acesso ao aplicativo do aluno</span>
              </label>
              <p className={styles.checkboxHelp}>
                O aluno poderá fazer login no app e visualizar seus treinos
              </p>
            </div>

            {formData.darAcessoApp && (
              <div className={styles.inputWrapper}>
                <Input
                  label="Senha Inicial *"
                  type="password"
                  name="senhaInicial"
                  placeholder="Defina uma senha para o aluno (mín. 6 caracteres)"
                  value={formData.senhaInicial}
                  onChange={handleChange}
                  error={errors.senhaInicial}
                  required
                />
                <p className={styles.inputHelp}>
                  O aluno poderá alterar esta senha depois no app
                </p>
              </div>
            )}
          </>
        )}
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
          {loading ? "Salvando..." : isEdit ? "Atualizar Aluno" : "Criar Aluno"}
        </Button>
      </div>
    </form>
  );
};
