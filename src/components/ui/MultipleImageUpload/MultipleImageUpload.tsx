"use client";

import { useState, useRef } from "react";
import styles from "./styles.module.scss";
import Image from "next/image";

interface MultipleImageUploadProps {
  value?: string[]; // URLs existentes (para edição)
  onChange: (files: File[], previewUrls: string[]) => void;
  label?: string;
  disabled?: boolean;
  maxFiles?: number;
}

export const MultipleImageUpload: React.FC<MultipleImageUploadProps> = ({
  value = [],
  onChange,
  label = "Fotos",
  disabled = false,
  maxFiles = 5,
}) => {
  const [previews, setPreviews] = useState<string[]>(value);
  const [files, setFiles] = useState<File[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);

    if (selectedFiles.length === 0) return;

    // Validar quantidade total
    const totalFiles = previews.length + selectedFiles.length;
    if (totalFiles > maxFiles) {
      alert(`Você pode adicionar no máximo ${maxFiles} fotos`);
      return;
    }

    // Validações
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/gif",
    ];

    for (const file of selectedFiles) {
      if (!allowedTypes.includes(file.type)) {
        alert(`Formato inválido: ${file.name}. Use: JPG, PNG, WEBP ou GIF`);
        return;
      }

      if (file.size > maxSize) {
        alert(`Arquivo muito grande: ${file.name}. Máximo: 5MB`);
        return;
      }
    }

    console.log(`📸 ${selectedFiles.length} arquivo(s) selecionado(s)`);

    // Criar previews locais
    const newPreviews: string[] = [];
    const newFiles: File[] = [...files];

    let processed = 0;

    selectedFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        newPreviews.push(reader.result as string);
        newFiles.push(file);
        processed++;

        if (processed === selectedFiles.length) {
          const allPreviews = [...previews, ...newPreviews];
          setPreviews(allPreviews);
          setFiles(newFiles);
          onChange(newFiles, allPreviews);
          console.log(
            `✅ ${newPreviews.length} preview(s) criado(s) localmente`
          );
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemove = (index: number) => {
    const newPreviews = previews.filter((_, i) => i !== index);
    const newFiles = files.filter((_, i) => i !== index);

    setPreviews(newPreviews);
    setFiles(newFiles);
    onChange(newFiles, newPreviews);

    if (inputRef.current) {
      inputRef.current.value = "";
    }

    console.log(`🗑️ Foto ${index + 1} removida`);
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  return (
    <div className={styles.container}>
      <label className={styles.label}>
        {label} {previews.length > 0 && `(${previews.length}/${maxFiles})`}
      </label>

      {previews.length > 0 && (
        <div className={styles.previewGrid}>
          {previews.map((preview, index) => (
            <div key={index} className={styles.previewItem}>
              <div className={styles.imageWrapper}>
                <Image
                  src={preview}
                  alt={`Foto ${index + 1}`}
                  width={150}
                  height={150}
                  className={styles.image}
                  unoptimized
                />
              </div>
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className={styles.removeButton}
                disabled={disabled}
                title="Remover foto"
              >
                ✕
              </button>
              <span className={styles.photoNumber}>#{index + 1}</span>
            </div>
          ))}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
        onChange={handleFileSelect}
        className={styles.hiddenInput}
        disabled={disabled || previews.length >= maxFiles}
        multiple
      />

      <button
        type="button"
        onClick={handleClick}
        className={styles.uploadButton}
        disabled={disabled || previews.length >= maxFiles}
      >
        {previews.length >= maxFiles
          ? `✓ Máximo de ${maxFiles} fotos atingido`
          : previews.length > 0
          ? "📤 Adicionar mais fotos"
          : "📤 Selecionar fotos"}
      </button>

      <p className={styles.hint}>
        ⚠️ As fotos serão enviadas apenas quando você salvar a medida
      </p>

      {previews.length > 0 && (
        <div className={styles.localPreview}>
          ⏳ {previews.length} foto(s) em preview local (não enviadas ainda)
        </div>
      )}
    </div>
  );
};
