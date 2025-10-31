"use client";

import { useState, useRef } from "react";
import styles from "./styles.module.scss";
import Image from "next/image";

interface ImageUploadProps {
  value?: string;
  onChange: (file: File | null, previewUrl: string) => void;
  label?: string;
  disabled?: boolean;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  onChange,
  label = "Imagem",
  disabled = false,
}) => {
  const [preview, setPreview] = useState<string>(value || "");
  const [fileName, setFileName] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/gif",
    ];

    if (!allowedTypes.includes(file.type)) {
      alert("Formato inválido! Use: JPG, PNG, WEBP ou GIF");
      return;
    }

    if (file.size > maxSize) {
      alert("Arquivo muito grande! Máximo: 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const previewUrl = reader.result as string;
      setPreview(previewUrl);
      setFileName(file.name);
      onChange(file, previewUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleRemove = () => {
    setPreview("");
    setFileName("");
    onChange(null, "");
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  return (
    <div className={styles.container}>
      <label className={styles.label}>{label}</label>

      {preview && (
        <div className={styles.preview}>
          <div className={styles.imageWrapper}>
            <Image
              src={preview}
              alt="Preview"
              width={200}
              height={200}
              className={styles.image}
              unoptimized
            />
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className={styles.removeButton}
            disabled={disabled}
            title="Remover imagem"
          >
            ✕
          </button>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
        onChange={handleFileSelect}
        className={styles.hiddenInput}
        disabled={disabled}
      />

      <button
        type="button"
        onClick={handleClick}
        className={styles.uploadButton}
        disabled={disabled}
      >
        {preview ? "🔄 Trocar Imagem" : "📤 Selecionar Imagem"}
      </button>

      {fileName && <p className={styles.fileName}>📄 {fileName}</p>}

      <p className={styles.hint}>
        ⚠️ A imagem será enviada apenas quando você salvar o exercício
      </p>

      {preview && !value && (
        <div className={styles.localPreview}>
          ⏳ Preview local (não enviado ainda)
        </div>
      )}
    </div>
  );
};
