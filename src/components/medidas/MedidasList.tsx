"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./styles.module.scss";
import { Button } from "../ui/Button/Button";
import { Modal } from "../ui/Modal/Modal";
import { Input } from "../ui/Input/Input";
import { MultipleImageUpload } from "../ui/MultipleImageUpload/MultipleImageUpload";
import Image from "next/image";

interface Medida {
  id: string;
  peso: number;
  altura: number;
  peito?: number;
  cintura?: number;
  quadril?: number;
  bracoDireito?: number;
  bracoEsquerdo?: number;
  coxaDireita?: number;
  coxaEsquerda?: number;
  panturrilhaDireita?: number;
  panturrilhaEsquerda?: number;
  observacoes?: string;
  fotos?: string[];
  data: string;
}

interface MedidasListProps {
  alunoId: string;
  alunoNome: string;
}

export const MedidasList: React.FC<MedidasListProps> = ({
  alunoId,
  alunoNome,
}) => {
  const router = useRouter();
  const [medidas, setMedidas] = useState<Medida[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalAddMedida, setModalAddMedida] = useState(false);
  const [modalViewMedida, setModalViewMedida] = useState<{
    isOpen: boolean;
    medida?: Medida;
  }>({ isOpen: false });

  // ✅ Modal de confirmação de exclusão
  const [modalDeleteMedida, setModalDeleteMedida] = useState<{
    isOpen: boolean;
    medidaId?: string;
  }>({ isOpen: false });

  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);

  const [fotosFiles, setFotosFiles] = useState<File[]>([]);
  const [fotosPreviews, setFotosPreviews] = useState<string[]>([]);

  const [novaMedida, setNovaMedida] = useState({
    peso: "",
    altura: "",
    peito: "",
    cintura: "",
    quadril: "",
    bracoDireito: "",
    bracoEsquerdo: "",
    coxaDireita: "",
    coxaEsquerda: "",
    panturrilhaDireita: "",
    panturrilhaEsquerda: "",
    observacoes: "",
  });

  useEffect(() => {
    fetchMedidas();
  }, []);

  const fetchMedidas = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/alunos/${alunoId}/medidas`);
      const data = await response.json();
      setMedidas(data);
    } catch (error) {
      console.error("Erro ao carregar medidas:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFotosChange = (files: File[], previewUrls: string[]) => {
    console.log(`📸 ${files.length} foto(s) selecionada(s)`);
    setFotosFiles(files);
    setFotosPreviews(previewUrls);
  };

  const handleAddMedida = async () => {
    if (!novaMedida.peso || !novaMedida.altura) {
      alert("Peso e altura são obrigatórios");
      return;
    }

    setLoadingSubmit(true);

    try {
      const formData = new FormData();
      formData.append("peso", novaMedida.peso);
      formData.append("altura", novaMedida.altura);
      formData.append("peito", novaMedida.peito || "");
      formData.append("cintura", novaMedida.cintura || "");
      formData.append("quadril", novaMedida.quadril || "");
      formData.append("bracoDireito", novaMedida.bracoDireito || "");
      formData.append("bracoEsquerdo", novaMedida.bracoEsquerdo || "");
      formData.append("coxaDireita", novaMedida.coxaDireita || "");
      formData.append("coxaEsquerda", novaMedida.coxaEsquerda || "");
      formData.append(
        "panturrilhaDireita",
        novaMedida.panturrilhaDireita || ""
      );
      formData.append(
        "panturrilhaEsquerda",
        novaMedida.panturrilhaEsquerda || ""
      );
      formData.append("observacoes", novaMedida.observacoes || "");

      fotosFiles.forEach((file, index) => {
        formData.append(`foto${index}`, file);
      });
      formData.append("totalFotos", String(fotosFiles.length));

      console.log(`📤 Enviando medida com ${fotosFiles.length} foto(s)`);

      const response = await fetch(`/api/alunos/${alunoId}/medidas`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Erro ao adicionar medida");

      console.log("✅ Medida adicionada com sucesso!");

      router.refresh();
      fetchMedidas();
      setModalAddMedida(false);

      setNovaMedida({
        peso: "",
        altura: "",
        peito: "",
        cintura: "",
        quadril: "",
        bracoDireito: "",
        bracoEsquerdo: "",
        coxaDireita: "",
        coxaEsquerda: "",
        panturrilhaDireita: "",
        panturrilhaEsquerda: "",
        observacoes: "",
      });
      setFotosFiles([]);
      setFotosPreviews([]);
    } catch (error) {
      console.error("❌ Erro ao adicionar medida:", error);
      alert("Erro ao adicionar medida");
    } finally {
      setLoadingSubmit(false);
    }
  };

  // ✅ Abrir modal de confirmação
  const handleOpenDeleteModal = (medidaId: string) => {
    setModalDeleteMedida({ isOpen: true, medidaId });
  };

  // ✅ Confirmar exclusão
  const handleConfirmDelete = async () => {
    if (!modalDeleteMedida.medidaId) return;

    setLoadingDelete(true);

    try {
      const response = await fetch(
        `/api/medidas/${modalDeleteMedida.medidaId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) throw new Error("Erro ao excluir medida");

      console.log("✅ Medida excluída com sucesso!");

      fetchMedidas();
      setModalDeleteMedida({ isOpen: false });
    } catch (error) {
      console.error("❌ Erro ao excluir medida:", error);
      alert("Erro ao excluir medida");
    } finally {
      setLoadingDelete(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setNovaMedida({
      ...novaMedida,
      [e.target.name]: e.target.value,
    });
  };

  const calcularIMC = (peso: number, altura: number): string => {
    const imc = peso / (altura * altura);
    return imc.toFixed(1);
  };

  const getIMCCategoria = (imc: number): { label: string; color: string } => {
    if (imc < 18.5) return { label: "Abaixo do peso", color: "#f59e0b" };
    if (imc < 25) return { label: "Peso normal", color: "#10b981" };
    if (imc < 30) return { label: "Sobrepeso", color: "#f59e0b" };
    return { label: "Obesidade", color: "#ef4444" };
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Carregando medidas...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Histórico de Medidas</h2>
          <p className={styles.subtitle}>Acompanhamento de {alunoNome}</p>
        </div>
        <Button onClick={() => setModalAddMedida(true)}>+ Nova Medida</Button>
      </div>

      {medidas.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>📏</div>
          <h3>Nenhuma medida registrada</h3>
          <p>Adicione a primeira medida para começar o acompanhamento</p>
        </div>
      ) : (
        <div className={styles.medidasGrid}>
          {medidas.map((medida) => {
            const imc = parseFloat(calcularIMC(medida.peso, medida.altura));
            const imcCategoria = getIMCCategoria(imc);

            return (
              <div key={medida.id} className={styles.medidaCard}>
                <div className={styles.cardHeader}>
                  <span className={styles.data}>
                    📅 {formatDate(medida.data)}
                  </span>
                  <button
                    onClick={() => handleOpenDeleteModal(medida.id)}
                    className={styles.deleteButton}
                    title="Excluir"
                  >
                    🗑️
                  </button>
                </div>

                {medida.fotos && medida.fotos.length > 0 && (
                  <div className={styles.fotosPreview}>
                    {medida.fotos.slice(0, 3).map((foto, index) => (
                      <div key={index} className={styles.fotoThumb}>
                        <Image
                          src={foto}
                          alt={`Foto ${index + 1}`}
                          width={60}
                          height={60}
                          className={styles.thumbImage}
                          unoptimized
                        />
                      </div>
                    ))}
                    {medida.fotos.length > 3 && (
                      <div className={styles.morePhotos}>
                        +{medida.fotos.length - 3}
                      </div>
                    )}
                  </div>
                )}

                <div className={styles.mainStats}>
                  <div className={styles.stat}>
                    <span className={styles.statLabel}>Peso</span>
                    <span className={styles.statValue}>{medida.peso} kg</span>
                  </div>
                  <div className={styles.stat}>
                    <span className={styles.statLabel}>Altura</span>
                    <span className={styles.statValue}>{medida.altura} m</span>
                  </div>
                  <div className={styles.stat}>
                    <span className={styles.statLabel}>IMC</span>
                    <span
                      className={styles.statValue}
                      style={{ color: imcCategoria.color }}
                    >
                      {imc}
                    </span>
                  </div>
                </div>

                <div
                  className={styles.imcBadge}
                  style={{ backgroundColor: imcCategoria.color }}
                >
                  {imcCategoria.label}
                </div>

                <button
                  onClick={() => setModalViewMedida({ isOpen: true, medida })}
                  className={styles.viewDetailsButton}
                >
                  Ver todas as medidas →
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Adicionar Medida */}
      <Modal
        isOpen={modalAddMedida}
        onClose={() => setModalAddMedida(false)}
        title="Nova Medida"
        size="large"
      >
        <div className={styles.modalContent}>
          <div className={styles.modalGrid}>
            <Input
              label="Peso (kg) *"
              type="number"
              step="0.1"
              name="peso"
              placeholder="75.5"
              value={novaMedida.peso}
              onChange={handleChange}
              required
            />

            <Input
              label="Altura (m) *"
              type="number"
              step="0.01"
              name="altura"
              placeholder="1.75"
              value={novaMedida.altura}
              onChange={handleChange}
              required
            />

            <Input
              label="Peito (cm)"
              type="number"
              step="0.1"
              name="peito"
              placeholder="95"
              value={novaMedida.peito}
              onChange={handleChange}
            />

            <Input
              label="Cintura (cm)"
              type="number"
              step="0.1"
              name="cintura"
              placeholder="85"
              value={novaMedida.cintura}
              onChange={handleChange}
            />

            <Input
              label="Quadril (cm)"
              type="number"
              step="0.1"
              name="quadril"
              placeholder="98"
              value={novaMedida.quadril}
              onChange={handleChange}
            />

            <Input
              label="Braço Direito (cm)"
              type="number"
              step="0.1"
              name="bracoDireito"
              placeholder="35"
              value={novaMedida.bracoDireito}
              onChange={handleChange}
            />

            <Input
              label="Braço Esquerdo (cm)"
              type="number"
              step="0.1"
              name="bracoEsquerdo"
              placeholder="35"
              value={novaMedida.bracoEsquerdo}
              onChange={handleChange}
            />

            <Input
              label="Coxa Direita (cm)"
              type="number"
              step="0.1"
              name="coxaDireita"
              placeholder="55"
              value={novaMedida.coxaDireita}
              onChange={handleChange}
            />

            <Input
              label="Coxa Esquerda (cm)"
              type="number"
              step="0.1"
              name="coxaEsquerda"
              placeholder="55"
              value={novaMedida.coxaEsquerda}
              onChange={handleChange}
            />

            <Input
              label="Panturrilha Direita (cm)"
              type="number"
              step="0.1"
              name="panturrilhaDireita"
              placeholder="38"
              value={novaMedida.panturrilhaDireita}
              onChange={handleChange}
            />

            <Input
              label="Panturrilha Esquerda (cm)"
              type="number"
              step="0.1"
              name="panturrilhaEsquerda"
              placeholder="38"
              value={novaMedida.panturrilhaEsquerda}
              onChange={handleChange}
            />

            <MultipleImageUpload
              value={fotosPreviews}
              onChange={handleFotosChange}
              label="Fotos de Progresso (máx 5)"
              disabled={loadingSubmit}
              maxFiles={5}
            />

            <div className={styles.fullWidth}>
              <label className={styles.label}>Observações</label>
              <textarea
                name="observacoes"
                placeholder="Informações adicionais..."
                value={novaMedida.observacoes}
                onChange={handleChange}
                className={styles.textarea}
                rows={3}
              />
            </div>
          </div>

          <div className={styles.modalActions}>
            <Button variant="outline" onClick={() => setModalAddMedida(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddMedida} disabled={loadingSubmit}>
              {loadingSubmit ? "Salvando..." : "Salvar Medida"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ✅ Modal de Confirmação de Exclusão */}
      <Modal
        isOpen={modalDeleteMedida.isOpen}
        onClose={() => setModalDeleteMedida({ isOpen: false })}
        title="Confirmar Exclusão"
        size="small"
      >
        <div className={styles.deleteModalContent}>
          <div className={styles.deleteIcon}>⚠️</div>
          <p className={styles.deleteMessage}>
            Tem certeza que deseja excluir esta medida?
          </p>
          <p className={styles.deleteWarning}>
            Todas as fotos associadas também serão excluídas permanentemente.
          </p>

          <div className={styles.modalActions}>
            <Button
              variant="outline"
              onClick={() => setModalDeleteMedida({ isOpen: false })}
              disabled={loadingDelete}
            >
              Cancelar
            </Button>
            <Button onClick={handleConfirmDelete} disabled={loadingDelete}>
              {loadingDelete ? "Excluindo..." : "Sim, Excluir"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Ver Detalhes */}
      <Modal
        isOpen={modalViewMedida.isOpen}
        onClose={() => setModalViewMedida({ isOpen: false })}
        title="Detalhes da Medida"
        size="medium"
      >
        {modalViewMedida.medida && (
          <div className={styles.detailsContent}>
            {modalViewMedida.medida.fotos &&
              modalViewMedida.medida.fotos.length > 0 && (
                <div className={styles.fotosGallery}>
                  <h4>Fotos de Progresso</h4>
                  <div className={styles.galleryGrid}>
                    {modalViewMedida.medida.fotos.map((foto, index) => (
                      <div key={index} className={styles.galleryItem}>
                        <Image
                          src={foto}
                          alt={`Foto ${index + 1}`}
                          width={200}
                          height={200}
                          className={styles.galleryImage}
                          unoptimized
                        />
                        <span className={styles.galleryLabel}>
                          Foto {index + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            <div className={styles.detailsGrid}>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Peso:</span>
                <span className={styles.detailValue}>
                  {modalViewMedida.medida.peso} kg
                </span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Altura:</span>
                <span className={styles.detailValue}>
                  {modalViewMedida.medida.altura} m
                </span>
              </div>
              {modalViewMedida.medida.peito && (
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Peito:</span>
                  <span className={styles.detailValue}>
                    {modalViewMedida.medida.peito} cm
                  </span>
                </div>
              )}
              {modalViewMedida.medida.cintura && (
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Cintura:</span>
                  <span className={styles.detailValue}>
                    {modalViewMedida.medida.cintura} cm
                  </span>
                </div>
              )}
              {modalViewMedida.medida.quadril && (
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Quadril:</span>
                  <span className={styles.detailValue}>
                    {modalViewMedida.medida.quadril} cm
                  </span>
                </div>
              )}
              {modalViewMedida.medida.bracoDireito && (
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Braço Direito:</span>
                  <span className={styles.detailValue}>
                    {modalViewMedida.medida.bracoDireito} cm
                  </span>
                </div>
              )}
              {modalViewMedida.medida.bracoEsquerdo && (
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Braço Esquerdo:</span>
                  <span className={styles.detailValue}>
                    {modalViewMedida.medida.bracoEsquerdo} cm
                  </span>
                </div>
              )}
              {modalViewMedida.medida.coxaDireita && (
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Coxa Direita:</span>
                  <span className={styles.detailValue}>
                    {modalViewMedida.medida.coxaDireita} cm
                  </span>
                </div>
              )}
              {modalViewMedida.medida.coxaEsquerda && (
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Coxa Esquerda:</span>
                  <span className={styles.detailValue}>
                    {modalViewMedida.medida.coxaEsquerda} cm
                  </span>
                </div>
              )}
              {modalViewMedida.medida.panturrilhaDireita && (
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>
                    Panturrilha Direita:
                  </span>
                  <span className={styles.detailValue}>
                    {modalViewMedida.medida.panturrilhaDireita} cm
                  </span>
                </div>
              )}
              {modalViewMedida.medida.panturrilhaEsquerda && (
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>
                    Panturrilha Esquerda:
                  </span>
                  <span className={styles.detailValue}>
                    {modalViewMedida.medida.panturrilhaEsquerda} cm
                  </span>
                </div>
              )}
            </div>

            {modalViewMedida.medida.observacoes && (
              <div className={styles.observacoes}>
                <strong>Observações:</strong>
                <p>{modalViewMedida.medida.observacoes}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
