"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import styles from "./userform.module.scss";
import { Input } from "../ui/Input/Input";
import { Button } from "../ui/Button/Button";
import { Toast } from "../ui/Toast/Toast";
import { Eye, EyeOff } from "lucide-react";
import {
  validateEmail,
  validatePassword,
  validateNome,
} from "@/utils/validators";

interface UserFormProps {
  initialData?: {
    id?: string;
    nome: string;
    email: string;
    telefone?: string;
    dataNascimento?: string;
    objetivo?: string;
    role: string;
    ativo: boolean;
  };
  isEdit?: boolean;
}

export const UserForm: React.FC<UserFormProps> = ({
  initialData,
  isEdit = false,
}) => {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ✅ Estados para mostrar/ocultar senhas
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Estado para controlar toast
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
    visible: boolean;
  }>({
    message: "",
    type: "success",
    visible: false,
  });

  const [formData, setFormData] = useState({
    nome: initialData?.nome || "",
    email: initialData?.email || "",
    telefone: initialData?.telefone || "",
    dataNascimento: initialData?.dataNascimento || "",
    objetivo: initialData?.objetivo || "",
    senha: "",
    confirmarSenha: "",
    role: initialData?.role || "USER",
    ativo: initialData?.ativo ?? false,
    clienteId: "",
  });

  const [clientes, setClientes] = useState<Array<{ id: string; nome: string }>>(
    []
  );
  const [loadingClientes, setLoadingClientes] = useState(false);

  useEffect(() => {
    const fetchClientes = async () => {
      if (session?.user?.role !== "SUPERADMIN") return;

      try {
        setLoadingClientes(true);
        const resp = await fetch("/api/clientes");
        if (!resp.ok) throw new Error("Erro ao carregar clientes");

        const data = await resp.json();
        setClientes(
          data.map((c: any) => ({
            id: c.id,
            nome: c.nome,
          }))
        );
      } catch (err) {
        console.error("Erro ao buscar clientes", err);
      } finally {
        setLoadingClientes(false);
      }
    };

    fetchClientes();
  }, [session]);

  // Função para formatação do telefone
  const formatTelefone = (value: string) => {
    const digits = value.replace(/\D/g, "");

    if (digits.length <= 2) return digits;

    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;

    if (digits.length <= 11)
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(
        7,
        11
      )}`;

    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(
      7,
      11
    )}`;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    let newValue = value;

    if (name === "telefone") {
      newValue = formatTelefone(value);
      if (newValue.length > 15) return;
    }

    if (name === "dataNascimento") {
      if (value.length > 10) return;
      if (value.length >= 5) {
        const yearPart = value.slice(0, 4);
        if (!/^\d{0,4}$/.test(yearPart)) return;
      }
    }

    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : newValue,
    });

    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!validateNome(formData.nome).valid) {
      newErrors.nome = "Nome inválido";
    }

    if (!validateEmail(formData.email)) {
      newErrors.email = "Email inválido";
    }

    const telefoneDigits = formData.telefone.replace(/\D/g, "");
    if (telefoneDigits.length !== 10 && telefoneDigits.length !== 11) {
      newErrors.telefone = "Telefone deve conter 10 ou 11 dígitos";
    }

    if (formData.dataNascimento) {
      if (formData.dataNascimento.length !== 10) {
        newErrors.dataNascimento = "Data de nascimento inválida";
      } else {
        const ano = new Date(formData.dataNascimento).getFullYear();
        if (ano.toString().length !== 4) {
          newErrors.dataNascimento = "Ano da data de nascimento inválido";
        }
      }
    }

    if (!isEdit) {
      if (!validatePassword(formData.senha).valid) {
        newErrors.senha = "Senha inválida";
      }

      if (formData.senha !== formData.confirmarSenha) {
        newErrors.confirmarSenha = "As senhas não coincidem";
      }
    } else if (formData.senha) {
      if (!validatePassword(formData.senha).valid) {
        newErrors.senha = "Senha inválida";
      }

      if (formData.senha !== formData.confirmarSenha) {
        newErrors.confirmarSenha = "As senhas não coincidem";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      setToast({
        message: "Preencha os campos corretamente",
        type: "error",
        visible: true,
      });
      return;
    }

    setLoading(true);
    try {
      const url = isEdit ? `/api/usuarios/${initialData?.id}` : "/api/usuarios";
      const method = isEdit ? "PUT" : "POST";

      const body: any = {
        nome: formData.nome,
        email: formData.email,
        telefone: formData.telefone,
        dataNascimento: formData.dataNascimento,
        objetivo: formData.objetivo,
        role: formData.role,
        ativo: formData.ativo,
      };

      // ⬇️ SE SUPERADMIN, ENVIA O CLIENTE ESCOLHIDO
      if (session?.user?.role === "SUPERADMIN" && formData.clienteId) {
        body.clienteId = formData.clienteId;
      }

      if (formData.senha) {
        body.senha = formData.senha;
      }

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao salvar usuário");
      }

      setToast({
        message: "Usuário salvo com sucesso!",
        type: "success",
        visible: true,
      });
      router.push("/dashboard/usuarios");
      router.refresh();
    } catch (error: any) {
      setToast({
        message: error.message || "Erro ao salvar usuário",
        type: "error",
        visible: true,
      });
      setLoading(false);
    }
  };

  const roleOptions =
    session?.user?.role === "ADMIN"
      ? [
          { value: "USER", label: "Usuário" },
          { value: "ADMIN", label: "Admin" },
        ]
      : [
          { value: "USER", label: "Usuário" },
          { value: "ADMIN", label: "Admin" },
          { value: "SUPERADMIN", label: "Super Admin" },
        ];

  return (
    <>
      {toast.visible && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast((prev) => ({ ...prev, visible: false }))}
        />
      )}
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGrid}>
          <Input
            label="Nome completo"
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
            placeholder="usuario@email.com"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
            required
          />
          <Input
            label="Telefone"
            type="text"
            name="telefone"
            placeholder="(11) 99999-9999"
            value={formData.telefone}
            onChange={handleChange}
            error={errors.telefone}
          />
          <Input
            label="Data de nascimento"
            type="date"
            name="dataNascimento"
            value={formData.dataNascimento}
            onChange={handleChange}
            error={errors.dataNascimento}
          />
          <Input
            label="Objetivo"
            type="text"
            name="objetivo"
            placeholder="Objetivo do usuário"
            value={formData.objetivo}
            onChange={handleChange}
          />

          {/* ✅ Campo de Senha com toggle */}
          <div className={styles.passwordWrapper}>
            <Input
              label={
                isEdit
                  ? "Nova senha (deixe em branco para não alterar)"
                  : "Senha"
              }
              type={showPassword ? "text" : "password"}
              name="senha"
              placeholder="••••••••"
              value={formData.senha}
              onChange={handleChange}
              error={errors.senha}
              required={!isEdit}
            />
            <button
              type="button"
              className={styles.togglePassword}
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {/* ✅ Campo de Confirmar Senha com toggle */}
          <div className={styles.passwordWrapper}>
            <Input
              label="Confirmar senha"
              type={showConfirmPassword ? "text" : "password"}
              name="confirmarSenha"
              placeholder="••••••••"
              value={formData.confirmarSenha}
              onChange={handleChange}
              error={errors.confirmarSenha}
              required={!isEdit || !!formData.senha}
            />
            <button
              type="button"
              className={styles.togglePassword}
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              tabIndex={-1}
            >
              {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <div className={styles.selectWrapper}>
            <label className={styles.label}>Perfil de acesso</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className={styles.select}
            >
              {roleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {session?.user?.role === "SUPERADMIN" && (
            <div className={styles.selectWrapper}>
              <label className={styles.label}>Cliente</label>
              <select
                name="clienteId"
                value={formData.clienteId}
                onChange={handleChange}
                className={styles.select}
              >
                <option value="">Selecione um cliente</option>
                {clientes.map((cliente) => (
                  <option key={cliente.id} value={cliente.id}>
                    {cliente.nome}
                  </option>
                ))}
              </select>
              {loadingClientes && (
                <span className={styles.helperText}>
                  Carregando clientes...
                </span>
              )}
            </div>
          )}

          <div className={styles.checkboxWrapper}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                name="ativo"
                checked={formData.ativo}
                onChange={handleChange}
                className={styles.checkbox}
              />
              <span>Usuário ativo</span>
            </label>
            <p className={styles.checkboxHelp}>
              Usuários inativos não poderão fazer login no sistema
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
              ? isEdit
                ? "Atualizando..."
                : "Salvando..."
              : isEdit
              ? "Atualizar Usuário"
              : "Criar Usuário"}
          </Button>
        </div>
      </form>
    </>
  );
};
