"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import styles from "./styles.module.scss";
import { Input } from "../ui/Input/Input";
import { Button } from "../ui/Button/Button";
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

  const [formData, setFormData] = useState({
    nome: initialData?.nome || "",
    email: initialData?.email || "",
    senha: "",
    confirmarSenha: "",
    role: initialData?.role || "USER",
    ativo: initialData?.ativo ?? false,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
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

    const nomeValidation = validateNome(formData.nome);
    if (!nomeValidation.valid) {
      newErrors.nome = nomeValidation.message || "";
    }

    if (!validateEmail(formData.email)) {
      newErrors.email = "Email inválido";
    }

    if (!isEdit) {
      const senhaValidation = validatePassword(formData.senha);
      if (!senhaValidation.valid) {
        newErrors.senha = senhaValidation.message || "";
      }

      if (formData.senha !== formData.confirmarSenha) {
        newErrors.confirmarSenha = "As senhas não coincidem";
      }
    } else if (formData.senha) {
      const senhaValidation = validatePassword(formData.senha);
      if (!senhaValidation.valid) {
        newErrors.senha = senhaValidation.message || "";
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
      return;
    }

    setLoading(true);

    try {
      const url = isEdit ? `/api/usuarios/${initialData?.id}` : "/api/usuarios";
      const method = isEdit ? "PUT" : "POST";

      const body: any = {
        nome: formData.nome,
        email: formData.email,
        role: formData.role,
        ativo: formData.ativo,
      };

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

      router.push("/dashboard/usuarios");
      router.refresh();
    } catch (error: any) {
      alert(error.message || "Erro ao salvar usuário");
      setLoading(false);
    }
  };

  // ✅ ADMIN só vê USER e ADMIN (não SUPERADMIN)
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
          label={
            isEdit ? "Nova senha (deixe em branco para não alterar)" : "Senha"
          }
          type="password"
          name="senha"
          placeholder="••••••••"
          value={formData.senha}
          onChange={handleChange}
          error={errors.senha}
          required={!isEdit}
        />

        <Input
          label="Confirmar senha"
          type="password"
          name="confirmarSenha"
          placeholder="••••••••"
          value={formData.confirmarSenha}
          onChange={handleChange}
          error={errors.confirmarSenha}
          required={!isEdit || !!formData.senha}
        />

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
            ? "Salvando..."
            : isEdit
            ? "Atualizar Usuário"
            : "Criar Usuário"}
        </Button>
      </div>
    </form>
  );
};
