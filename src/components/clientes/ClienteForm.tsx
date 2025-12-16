"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./styles.module.scss";
import { Input } from "../ui/Input/Input";
import { Button } from "../ui/Button/Button";
import { ImageUpload } from "../ui/ImageUpload/ImageUpload";

interface ClienteFormProps {
  initialData?: {
    id?: string;
    nome: string;
    logo?: string;
    ativo: boolean;
    dataVencimento?: Date | null;
  };
  isEdit?: boolean;
}

export const ClienteForm: React.FC<ClienteFormProps> = ({
  initialData,
  isEdit = false,
}) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>(
    initialData?.logo || ""
  );

  const [formData, setFormData] = useState({
    nome: initialData?.nome || "",
    login: "", // ✅ LOGIN
    senha: "", // ✅ SENHA
    ativo: initialData?.ativo ?? true,
    dataVencimento: initialData?.dataVencimento
      ? new Date(initialData.dataVencimento).toISOString().slice(0, 10)
      : "",
    diasAdicionar: "",
  });

  /*const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
*/

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleLogoChange = (file: File | null, previewUrl: string) => {
    console.log("📸 Logo selecionado:", file ? file.name : "removido");
    setLogoFile(file);
    setLogoPreview(previewUrl);
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.nome || formData.nome.trim().length < 3) {
      newErrors.nome = "O nome deve ter no mínimo 3 caracteres";
    }

    // ✅ VALIDAR LOGIN E SENHA (só ao criar)
    if (!isEdit) {
      if (!formData.login || formData.login.trim().length < 3) {
        newErrors.login = "Login deve ter no mínimo 3 caracteres";
      }
      if (!formData.senha || formData.senha.length < 6) {
        newErrors.senha = "Senha deve ter no mínimo 6 caracteres";
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
      const url = isEdit ? `/api/clientes/${initialData?.id}` : "/api/clientes";
      const method = isEdit ? "PUT" : "POST";

      const formDataToSend = new FormData();
      formDataToSend.append("nome", formData.nome);
      formDataToSend.append("ativo", String(formData.ativo));
      formDataToSend.append("dataVencimento", formData.dataVencimento);

      // ✅ ADICIONAR LOGIN E SENHA (só ao criar)
      if (!isEdit) {
        formDataToSend.append("login", formData.login);
        formDataToSend.append("senha", formData.senha);
      }

      if (logoFile) {
        formDataToSend.append("logo", logoFile);
      } else if (isEdit && initialData?.logo) {
        formDataToSend.append("logoExistente", initialData.logo);
      }

      const response = await fetch(url, {
        method,
        body: formDataToSend,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao salvar cliente");
      }

      const resultado = await response.json();
      console.log("✅ Cliente salvo com sucesso:", resultado);

      // ✅ EXIBIR DADOS DE LOGIN
      if (resultado.admin) {
        alert(
          `✅ Cliente criado com sucesso!\n\n📧 Login: ${resultado.admin.login}\n🔑 Senha: ${resultado.admin.senha}\n\n⚠️ Anote essas informações!`
        );
      }

      router.push("/dashboard/clientes");
      router.refresh();
    } catch (error: any) {
      console.error("❌ Erro ao salvar cliente:", error);
      alert(error.message || "Erro ao salvar cliente");
      setLoading(false);
    }
  };

  const aplicarDias = () => {
    const qtd = Number(formData.diasAdicionar || 0);
    if (!formData.dataVencimento || !qtd) return;

    const base = new Date(formData.dataVencimento);
    base.setDate(base.getDate() + qtd);

    const novaData = base.toISOString().slice(0, 10);

    setFormData((prev) => ({
      ...prev,
      dataVencimento: novaData,
      diasAdicionar: "",
    }));
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.formGrid}>
        <Input
          label="Nome do Cliente *"
          type="text"
          name="nome"
          placeholder="Digite o nome do cliente"
          value={formData.nome}
          onChange={handleChange}
          error={errors.nome}
          required
        />

        <Input
          label="Data de Vencimento"
          type="date"
          name="dataVencimento"
          value={formData.dataVencimento}
          onChange={handleChange}
        />

        <div className={styles.inlineGroup}>
          <Input
            label="Adicionar dias"
            type="number"
            name="diasAdicionar"
            placeholder="Ex: 20"
            value={formData.diasAdicionar}
            onChange={handleChange}
          />
          <Button type="button" onClick={aplicarDias}>
            Aplicar
          </Button>
        </div>

        {/* ✅ LOGIN E SENHA (só aparece ao criar) */}
        {!isEdit && (
          <>
            <Input
              label="Login do Administrador *"
              type="text"
              name="login"
              placeholder="admin"
              value={formData.login}
              onChange={handleChange}
              error={errors.login}
              required
            />
            <Input
              label="Senha do Administrador *"
              type="password"
              name="senha"
              placeholder="Mínimo 6 caracteres"
              value={formData.senha}
              onChange={handleChange}
              error={errors.senha}
              required
            />
          </>
        )}

        <ImageUpload
          value={logoPreview}
          onChange={handleLogoChange}
          label="Logo do Cliente"
          disabled={loading}
        />

        <div className={styles.checkboxWrapper}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              name="ativo"
              checked={formData.ativo}
              onChange={handleChange}
              className={styles.checkbox}
            />
            <span>Cliente ativo</span>
          </label>
          <p className={styles.checkboxHelp}>
            Clientes inativos não aparecerão na tela de seleção
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
            ? "Atualizar Cliente"
            : "Criar Cliente"}
        </Button>
      </div>
    </form>
  );
};
