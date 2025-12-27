// Componente React AlunoForm.tsx completo com preenchimento automático dos campos

"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "./alunoForm.module.scss";
import { Input } from "../ui/Input/Input";
import { Button } from "../ui/Button/Button";
import { ImageUpload } from "../ui/ImageUpload/ImageUpload";
import { Toast } from "../ui/Toast/Toast";

interface Usuario {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  dataNascimento?: string;
  objetivo?: string;
  role: string;
}

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
    clienteId?: string;
  };
  isEdit?: boolean;
}

export const AlunoForm: React.FC<AlunoFormProps> = ({
  clienteId,
  initialData,
  isEdit = false,
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [clientes, setClientes] = useState<any[]>([]);
  const [clienteNome, setClienteNome] = useState<string>("");
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [toastData, setToastData] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
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
    clienteIdSelecionado: clienteId || initialData?.clienteId || "",

    usuarioSelecionadoId: "",
  });

  useEffect(() => {
    const cid = clienteId || (isEdit ? initialData?.clienteId : "");
    if (!cid) return;

    setFormData((prev) => ({
      ...prev,
      clienteIdSelecionado: cid,
    }));
  }, [clienteId, isEdit, initialData?.clienteId]);

  useEffect(() => {
    if (!clienteId && !isEdit) {
      fetchClientes();
    }
  }, [clienteId, isEdit]);

  useEffect(() => {
    async function fetchClienteNome() {
      if (!clienteId) return;

      try {
        const response = await fetch(`/api/clientes/${clienteId}`);
        if (!response.ok) return;

        const data = await response.json();
        setClienteNome(data.nome);
      } catch (err) {
        console.error("Erro ao buscar nome do cliente:", err);
      }
    }

    fetchClienteNome();
  }, [clienteId]);

  useEffect(() => {
    if (formData.clienteIdSelecionado) {
      fetchUsuarios(formData.clienteIdSelecionado);
    }
  }, [formData.clienteIdSelecionado]);

  async function fetchClientes() {
    try {
      const response = await fetch("/api/clientes");
      if (response.ok) {
        const data = await response.json();
        setClientes(data.filter((c: any) => c.ativo));
      }
    } catch (error) {
      console.error("Erro ao buscar clientes:", error);
    }
  }

  async function fetchUsuarios(clienteId: string) {
    try {
      const response = await fetch(`/api/usuarios?clienteId=${clienteId}`);
      if (response.ok) {
        const data = await response.json();
        setUsuarios(data);
      }
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
    }
  }

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));

    if (name === "usuarioSelecionadoId") {
      if (value === "") {
        setFormData((prev) => ({
          ...prev,
          nome: "",
          email: "",
          telefone: "",
          dataNascimento: "",
          objetivo: "",
          usuarioSelecionadoId: "",
        }));
      } else {
        const usuario = usuarios.find((u) => u.id === value);
        if (usuario) {
          setFormData((prev) => ({
            ...prev,
            nome: usuario.nome,
            email: usuario.email,
            telefone: usuario.telefone || "",
            dataNascimento: usuario.dataNascimento || "",
            objetivo: usuario.objetivo || "",
            usuarioSelecionadoId: value,
          }));
        }
      }
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
    if (!formData.clienteIdSelecionado) {
      newErrors.clienteIdSelecionado = "Selecione um cliente";
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Email inválido";
    }
    if (!formData.usuarioSelecionadoId && !formData.email) {
      newErrors.email = "Informe um email ou selecione um usuário";
    }
    if (
      formData.darAcessoApp &&
      (!formData.senhaInicial || formData.senhaInicial.length < 6)
    ) {
      newErrors.senhaInicial =
        "A senha inicial deve ter no mínimo 6 caracteres";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  async function handleSubmit(e: React.FormEvent) {
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
      formDataToSend.append("clienteId", formData.clienteIdSelecionado);
      formDataToSend.append("usuarioId", formData.usuarioSelecionadoId);

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

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erro ao salvar aluno");
      }

      setToastData({ message: "Aluno salvo com sucesso!", type: "success" });
      setLoading(false);

      await router.replace("/dashboard/alunos");
    } catch (error: any) {
      setToastData({ message: `Erro: ${error.message}`, type: "error" });
      setLoading(false);
    }
  }

  const closeToast = () => setToastData(null);

  return (
    <>
      <form onSubmit={handleSubmit} className={styles.form} noValidate>
        <div className={styles.formGrid}>
          {!clienteId && !isEdit && (
            <div className={styles.selectWrapper}>
              <label className={styles.label}>Cliente/Academia *</label>
              <select
                className={styles.select}
                name="clienteIdSelecionado"
                value={formData.clienteIdSelecionado}
                onChange={handleChange}
                required
              >
                <option value="">Selecione o cliente...</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
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

          {clienteId && (
            <h2 className={styles.clienteTitulo}>
              Criando aluno para cliente:
              <span className={styles.clienteNome}>{clienteNome}</span>
            </h2>
          )}

          <div className={styles.selectWrapper}>
            <label className={styles.label}>Selecionar usuário existente</label>
            <select
              className={styles.select}
              name="usuarioSelecionadoId"
              value={formData.usuarioSelecionadoId}
              onChange={handleChange}
            >
              <option value="">Nenhum</option>
              {usuarios.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nome} ({u.email} - {u.role})
                </option>
              ))}
            </select>
          </div>

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
              className={styles.select}
              name="objetivo"
              value={formData.objetivo}
              onChange={handleChange}
            >
              <option value="">Selecione...</option>
              <option value="Emagrecimento">Emagrecimento</option>
              <option value="Hipertrofia">Hipertrofia</option>
              <option value="Condicionamento Físico">
                Condicionamento Físico
              </option>
              <option value="Reabilitação">Reabilitação</option>
              <option value="Performance Esportiva">
                Performance Esportiva
              </option>
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
              className={styles.textarea}
              name="observacoes"
              placeholder="Informações adicionais sobre o aluno..."
              value={formData.observacoes}
              onChange={handleChange}
              rows={4}
            />
          </div>

          <div className={styles.checkboxWrapper}>
            <label className={styles.checkboxLabel}>
              <input
                className={styles.checkbox}
                type="checkbox"
                name="ativo"
                checked={formData.ativo}
                onChange={handleChange}
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
                    className={styles.checkbox}
                    type="checkbox"
                    name="darAcessoApp"
                    checked={formData.darAcessoApp}
                    onChange={handleChange}
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
            {loading
              ? "Salvando..."
              : isEdit
              ? "Atualizar Aluno"
              : "Criar Aluno"}
          </Button>
        </div>
      </form>

      {toastData && (
        <Toast
          message={toastData.message}
          type={toastData.type}
          onClose={closeToast}
          duration={3000}
        />
      )}
    </>
  );
};
