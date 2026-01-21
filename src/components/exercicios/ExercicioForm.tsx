"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./styles.module.scss";
import { Input } from "../ui/Input/Input";
import { Button } from "../ui/Button/Button";
import { GrupoMuscular } from "@/types";
import { ImageUpload } from "../ui/ImageUpload/ImageUpload";
import { Cliente } from "@prisma/client";
import { getSession } from "next-auth/react"; // Importando getSession

interface ExercicioFormProps {
  initialData?: {
    id?: string;
    nome: string;
    grupoMuscular: GrupoMuscular;
    descricao?: string;
    video?: string;
    imagem?: string;
    equipamento?: string;
    clienteId?: string;
  };
  isEdit?: boolean;
}

export const ExercicioForm: React.FC<ExercicioFormProps> = ({
  initialData,
  isEdit = false,
}) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ✅ Estado separado para arquivo e preview
  const [imagemFile, setImagemFile] = useState<File | null>(null);
  const [imagemPreview, setImagemPreview] = useState<string>(
    initialData?.imagem || "",
  );

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [formData, setFormData] = useState<{
    nome: string;
    grupoMuscular: string;
    descricao: string | undefined;
    video: string | undefined;
    equipamento: string | undefined;
    clienteId: string; // Incluindo clienteId
  }>({
    nome: initialData?.nome || "",
    grupoMuscular: initialData?.grupoMuscular || "",
    descricao: initialData?.descricao || "",
    video: initialData?.video || "",
    equipamento: initialData?.equipamento || "",
    clienteId: initialData?.clienteId || "", // inicializando clienteId
  });

  useEffect(() => {
    // Verificar se o usuário é SUPERADMIN ou ADMIN
    const fetchClientes = async () => {
      const session = await getSession();

      if (session?.user?.role === "SUPERADMIN") {
        setFormData((prevData) => ({
          ...prevData,
          clienteId: "",
        }));
      } else if (session?.user?.role === "ADMIN") {
        setFormData((prevData) => ({
          ...prevData,
          clienteId: session.user.clienteId || "",
        }));
      }

      const response = await fetch("/api/clientes");
      const data = await response.json();
      setClientes(data);
    };
    fetchClientes();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value,
    });

    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  // ✅ Handler para imagem (arquivo local)
  const handleImageChange = (file: File | null, previewUrl: string) => {
    console.log("📸 Imagem selecionada:", file ? file.name : "removida");
    setImagemFile(file);
    setImagemPreview(previewUrl);
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.nome || formData.nome.trim().length < 3) {
      newErrors.nome = "O nome deve ter no mínimo 3 caracteres";
    }

    if (!formData.grupoMuscular) {
      newErrors.grupoMuscular = "Selecione um grupo muscular";
    }

    if (!formData.clienteId) {
      newErrors.clienteId = "Selecione um cliente";
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
      const url = isEdit
        ? `/api/exercicios/${initialData?.id}`
        : "/api/exercicios";
      const method = isEdit ? "PUT" : "POST";

      // ✅ Usar FormData para enviar arquivo + dados
      const formDataToSend = new FormData();
      formDataToSend.append("nome", formData.nome);
      formDataToSend.append("grupoMuscular", formData.grupoMuscular);
      formDataToSend.append("descricao", formData.descricao || "");
      formDataToSend.append("video", formData.video || "");
      formDataToSend.append("equipamento", formData.equipamento || "");
      formDataToSend.append("clienteId", formData.clienteId || "");

      // ✅ Adicionar arquivo de imagem (se houver)
      if (imagemFile) {
        formDataToSend.append("imagem", imagemFile);
        console.log("📤 Enviando arquivo:", imagemFile.name);
      } else if (isEdit && initialData?.imagem) {
        formDataToSend.append("imagemExistente", initialData.imagem);
        console.log("📌 Mantendo imagem existente:", initialData.imagem);
      }

      console.log("💾 Enviando dados para API...");

      const response = await fetch(url, {
        method,
        body: formDataToSend,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao salvar exercício");
      }

      const resultado = await response.json();
      console.log("✅ Exercício salvo com sucesso:", resultado);

      router.push("/dashboard/exercicios");
      router.refresh();
    } catch (error: any) {
      console.error("❌ Erro ao salvar exercício:", error);
      alert(error.message || "Erro ao salvar exercício");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.formGrid}>
        <Input
          label="Nome do Exercício *"
          type="text"
          name="nome"
          placeholder="Ex: Supino Reto"
          value={formData.nome}
          onChange={handleChange}
          error={errors.nome}
          required
        />

        <div className={styles.selectWrapper}>
          <label className={styles.label}>Grupo Muscular *</label>
          <select
            name="grupoMuscular"
            value={formData.grupoMuscular}
            onChange={handleChange}
            className={`${styles.select} ${
              errors.grupoMuscular ? styles.error : ""
            }`}
            required
          >
            <option value="">Selecione...</option>
            <option value="PEITO">Peito</option>
            <option value="COSTAS">Costas</option>
            <option value="OMBROS">Ombros</option>
            <option value="BICEPS">Bíceps</option>
            <option value="TRICEPS">Tríceps</option>
            <option value="PERNAS">Pernas</option>
            <option value="GLUTEOS">Glúteos</option>
            <option value="ABDOMEN">Abdômen</option>
            <option value="PANTURRILHA">Panturrilha</option>
            <option value="ANTEBRACO">Antebraço</option>
            <option value="CARDIO">Cardio</option>
            <option value="FUNCIONAL">Funcional</option>
          </select>
          {errors.grupoMuscular && (
            <span className={styles.errorText}>{errors.grupoMuscular}</span>
          )}
        </div>

        <Input
          label="Equipamento"
          type="text"
          name="equipamento"
          placeholder="Ex: Barra, Halteres, Máquina"
          value={formData.equipamento}
          onChange={handleChange}
        />

        {/* Mostrar o select de clientes apenas quando o usuário for SUPERADMIN */}
        {formData.clienteId === "" && (
          <div className={styles.selectWrapper}>
            <label className={styles.label}>Cliente *</label>
            <select
              name="clienteId"
              value={formData.clienteId || ""}
              onChange={handleChange}
              className={`${styles.select} ${
                errors.clienteId ? styles.error : ""
              }`}
              required
            >
              <option value="">Selecione um Cliente</option>
              {clientes.map((cliente) => (
                <option key={cliente.id} value={cliente.id}>
                  {cliente.nome}
                </option>
              ))}
            </select>
            {errors.clienteId && (
              <span className={styles.errorText}>{errors.clienteId}</span>
            )}
          </div>
        )}

        <ImageUpload
          value={imagemPreview}
          onChange={handleImageChange}
          label="Imagem do Exercício"
          disabled={loading}
        />

        <Input
          label="URL do Vídeo (opcional)"
          type="text"
          name="video"
          placeholder="https://youtube.com/watch?v=..."
          value={formData.video}
          onChange={handleChange}
        />

        <div className={styles.textareaWrapper}>
          <label className={styles.label}>Descrição / Instruções</label>
          <textarea
            name="descricao"
            placeholder="Descreva como executar o exercício corretamente..."
            value={formData.descricao}
            onChange={handleChange}
            className={styles.textarea}
            rows={5}
          />
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
              ? "Atualizar Exercício"
              : "Criar Exercício"}
        </Button>
      </div>
    </form>
  );
};
