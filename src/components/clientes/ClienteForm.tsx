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

  // ✅ Estado separado para arquivo e preview
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>(
    initialData?.logo || ""
  );

  const [formData, setFormData] = useState({
    nome: initialData?.nome || "",
    ativo: initialData?.ativo ?? true,
  });

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

  // ✅ Handler para logo (arquivo local)
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

      // ✅ Usar FormData para enviar arquivo + dados
      const formDataToSend = new FormData();
      formDataToSend.append("nome", formData.nome);
      formDataToSend.append("ativo", String(formData.ativo));

      // ✅ Adicionar arquivo de logo (se houver)
      if (logoFile) {
        formDataToSend.append("logo", logoFile);
        console.log("📤 Enviando arquivo:", logoFile.name);
      } else if (isEdit && initialData?.logo) {
        // Se está editando e não mudou o logo, manter a URL existente
        formDataToSend.append("logoExistente", initialData.logo);
        console.log("📌 Mantendo logo existente:", initialData.logo);
      }

      console.log("💾 Enviando dados para API...");

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

      router.push("/dashboard/clientes");
      router.refresh();
    } catch (error: any) {
      console.error("❌ Erro ao salvar cliente:", error);
      alert(error.message || "Erro ao salvar cliente");
      setLoading(false);
    }
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

        {/* ✅ ImageUpload agora trabalha com File */}
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
