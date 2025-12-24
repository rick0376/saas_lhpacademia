"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button/Button";
import { Toast } from "@/components/ui/Toast/Toast";
import styles from "./styles.module.scss";

interface Backup {
  nome: string;
  tamanho: string;
  data: string;
}

export const BackupManager = () => {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(false);
  const [agendamentoAtivo, setAgendamentoAtivo] = useState(false);
  const [intervalo, setIntervalo] = useState("diario");
  const [showRestaurarModal, setShowRestaurarModal] = useState(false);
  const [showExcluirModal, setShowExcluirModal] = useState(false);
  const [backupParaExcluir, setBackupParaExcluir] = useState<string>("");
  const [backupSelecionado, setBackupSelecionado] = useState<string>("");
  const [backupExterno, setBackupExterno] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [tipoBackup, setTipoBackup] = useState<"completo" | "seletivo">(
    "completo"
  );
  const [tabelasSelecionadas, setTabelasSelecionadas] = useState<string[]>([]);
  const [clienteSelecionado, setClienteSelecionado] = useState<string>("");
  const [clientes, setClientes] = useState<Array<{ id: string; nome: string }>>(
    []
  );

  const tabelasDisponiveis = [
    "usuarios",
    "clientes",
    "alunos",
    "treinos",
    "exercicios",
    "avaliacoes",
    "medidas",
    "permissoes",
  ];

  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error" | "info" | "warning";
  }>({ show: false, message: "", type: "success" });

  useEffect(() => {
    carregarBackups();
    carregarConfigAgendamento();
  }, []);

  useEffect(() => {
    carregarBackups();
    carregarConfigAgendamento();
    carregarClientes();
  }, []);

  const carregarClientes = async () => {
    try {
      const response = await fetch("/api/clientes");
      const data = await response.json();
      setClientes(data || []);
    } catch (error) {
      console.error("Erro ao carregar clientes:", error);
    }
  };

  const carregarBackups = async () => {
    try {
      const response = await fetch("/api/backup/listar");
      const data = await response.json();
      setBackups(data.backups || []);
    } catch (error) {
      console.error("Erro ao carregar backups:", error);
    }
  };

  const carregarConfigAgendamento = async () => {
    try {
      const response = await fetch("/api/backup/automatico");
      const data = await response.json();
      setAgendamentoAtivo(data.ativo || false);
      setIntervalo(data.intervalo || "diario");
    } catch (error) {
      console.error("Erro ao carregar configuração:", error);
    }
  };

  const handleBackupManual = async () => {
    setLoading(true);
    try {
      const body: any = { tipo: tipoBackup };

      if (tipoBackup === "seletivo") {
        if (tabelasSelecionadas.length > 0) {
          body.tabelas = tabelasSelecionadas;
        }
        if (clienteSelecionado) {
          body.clienteId = clienteSelecionado;
        }
      }

      const response = await fetch("/api/backup/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      setToast({
        show: true,
        message: "Backup criado com sucesso!",
        type: "success",
      });
      carregarBackups();
    } catch (error: any) {
      setToast({
        show: true,
        message: error.message || "Erro ao criar backup",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSalvarAgendamento = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/backup/automatico", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ativo: agendamentoAtivo, intervalo }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setToast({
        show: true,
        message: "Configuração salva com sucesso!",
        type: "success",
      });
    } catch (error: any) {
      setToast({
        show: true,
        message: error.message || "Erro ao salvar configuração",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (nomeArquivo: string) => {
    window.open(`/api/backup/download?file=${nomeArquivo}`, "_blank");
  };

  // ✅ Restaurar backup da lista
  const abrirModalRestaurar = (nomeArquivo: string) => {
    setBackupSelecionado(nomeArquivo);
    setBackupExterno(null);
    setShowRestaurarModal(true);
  };

  // ✅ NOVO: Abrir seletor de arquivo
  const abrirSeletorArquivo = () => {
    fileInputRef.current?.click();
  };

  // ✅ NOVO: Quando arquivo é selecionado
  const handleArquivoSelecionado = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".json")) {
      setToast({
        show: true,
        message: "Apenas arquivos .json são permitidos",
        type: "error",
      });
      return;
    }

    setBackupExterno(file);
    setBackupSelecionado("");
    setShowRestaurarModal(true);
  };

  // ✅ Restaurar backup (da lista ou externo)
  const handleRestaurar = async () => {
    setLoading(true);
    setShowRestaurarModal(false);

    try {
      let response;

      if (backupExterno) {
        // ✅ Restaurar arquivo externo (upload)
        const formData = new FormData();
        formData.append("file", backupExterno);

        response = await fetch("/api/backup/restaurar-upload", {
          method: "POST",
          body: formData,
        });
      } else {
        // ✅ Restaurar backup da lista
        response = await fetch("/api/backup/restaurar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filename: backupSelecionado }),
        });
      }

      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      setToast({
        show: true,
        message: "Banco de dados restaurado com sucesso!",
        type: "success",
      });

      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error: any) {
      setToast({
        show: true,
        message: error.message || "Erro ao restaurar backup",
        type: "error",
      });
    } finally {
      setLoading(false);
      setBackupExterno(null);
    }
  };

  // ✅ Abrir Modal Excluir Backups
  const abrirModalExcluir = (nomeArquivo: string) => {
    setBackupParaExcluir(nomeArquivo);
    setShowExcluirModal(true);
  };

  // ✅ Excluir Backups
  const handleExcluirBackup = async () => {
    setLoading(true);
    setShowExcluirModal(false);

    try {
      const response = await fetch("/api/backup/excluir", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: backupParaExcluir }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      setToast({
        show: true,
        message: "Backup excluído com sucesso!",
        type: "success",
      });

      carregarBackups(); // Recarregar lista
    } catch (error: any) {
      setToast({
        show: true,
        message: error.message || "Erro ao excluir backup",
        type: "error",
      });
    } finally {
      setLoading(false);
      setBackupParaExcluir("");
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>💾 Backup do Banco de Dados</h2>

      {/* Backup Manual */}
      <div className={styles.section}>
        <h3>Backup Manual</h3>
        <p className={styles.description}>
          Crie um backup completo ou seletivo do banco de dados.
        </p>

        {/* Seletor de Tipo */}
        <div className={styles.field}>
          <label>Tipo de Backup</label>
          <select
            value={tipoBackup}
            onChange={(e) =>
              setTipoBackup(e.target.value as "completo" | "seletivo")
            }
            className={styles.select}
          >
            <option value="completo">Completo (todas as tabelas)</option>
            <option value="seletivo">
              Seletivo (escolher tabelas/cliente)
            </option>
          </select>
        </div>

        {/* Opções de Backup Seletivo */}
        {tipoBackup === "seletivo" && (
          <>
            <div className={styles.field}>
              <label>Filtrar por Cliente (opcional)</label>
              <select
                value={clienteSelecionado}
                onChange={(e) => setClienteSelecionado(e.target.value)}
                className={styles.select}
              >
                <option value="">Todos os clientes</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.field}>
              <label>Tabelas (opcional)</label>
              <div className={styles.checkboxGroup}>
                {tabelasDisponiveis.map((tabela) => (
                  <label key={tabela} className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={tabelasSelecionadas.includes(tabela)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setTabelasSelecionadas([
                            ...tabelasSelecionadas,
                            tabela,
                          ]);
                        } else {
                          setTabelasSelecionadas(
                            tabelasSelecionadas.filter((t) => t !== tabela)
                          );
                        }
                      }}
                    />
                    <span>{tabela}</span>
                  </label>
                ))}
              </div>
            </div>
          </>
        )}

        <Button onClick={handleBackupManual} disabled={loading} fullWidth>
          {loading ? "Criando backup..." : "📦 Criar Backup Agora"}
        </Button>
      </div>

      <div className={styles.divider} />

      {/* ✅ NOVO: Restaurar de Arquivo */}
      <div className={styles.section}>
        <h3>Restaurar de Arquivo</h3>
        <p className={styles.description}>
          Importe um backup do seu computador para restaurar o banco de dados.
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleArquivoSelecionado}
          style={{ display: "none" }}
        />
        <Button onClick={abrirSeletorArquivo} variant="secondary" fullWidth>
          📂 Procurar Arquivo de Backup
        </Button>
      </div>

      <div className={styles.divider} />

      {/* Backup Automático */}
      <div className={styles.section}>
        <h3>Backup Automático</h3>
        <p className={styles.description}>
          Configure backups automáticos em intervalos regulares.
        </p>

        <div className={styles.form}>
          <div className={styles.toggle}>
            <label>
              <input
                type="checkbox"
                checked={agendamentoAtivo}
                onChange={(e) => setAgendamentoAtivo(e.target.checked)}
              />
              <span>Ativar backups automáticos</span>
            </label>
          </div>

          {agendamentoAtivo && (
            <div className={styles.field}>
              <label>Frequência</label>
              <select
                value={intervalo}
                onChange={(e) => setIntervalo(e.target.value)}
                className={styles.select}
              >
                <option value="diario">Diário (todo dia às 03:00)</option>
                <option value="semanal">Semanal (domingo às 03:00)</option>
                <option value="mensal">Mensal (dia 1 às 03:00)</option>
              </select>
            </div>
          )}

          <Button onClick={handleSalvarAgendamento} disabled={loading}>
            {loading ? "Salvando..." : "💾 Salvar Configuração"}
          </Button>
        </div>
      </div>

      <div className={styles.divider} />

      {/* Lista de Backups */}
      <div className={styles.section}>
        <h3>Backups Disponíveis</h3>
        {backups.length === 0 ? (
          <p className={styles.empty}>Nenhum backup encontrado.</p>
        ) : (
          <div className={styles.backupList}>
            {backups.map((backup) => (
              <div key={backup.nome} className={styles.backupItem}>
                <div className={styles.backupInfo}>
                  <span className={styles.backupNome}>📄 {backup.nome}</span>
                  <span className={styles.backupMeta}>
                    {backup.tamanho} • {backup.data}
                  </span>
                </div>
                <div className={styles.backupActions}>
                  <Button
                    variant="secondary"
                    onClick={() => handleDownload(backup.nome)}
                  >
                    ⬇️ Download
                  </Button>
                  <Button
                    variant="warning"
                    onClick={() => abrirModalRestaurar(backup.nome)}
                  >
                    🔄 Restaurar
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => abrirModalExcluir(backup.nome)}
                  >
                    🗑️ Excluir
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Confirmação */}
      {showRestaurarModal && (
        <div
          className={styles.modalOverlay}
          onClick={() => {
            setShowRestaurarModal(false);
            setBackupExterno(null);
          }}
        >
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalIcon}>⚠️</div>
            <h3 className={styles.modalTitle}>Confirmar Restauração</h3>
            <p className={styles.modalText}>
              <strong>ATENÇÃO:</strong> Esta ação irá substituir TODOS os dados
              atuais do banco de dados pelo backup selecionado.
            </p>
            <p className={styles.modalText}>
              Backup:{" "}
              <strong>
                {backupExterno ? backupExterno.name : backupSelecionado}
              </strong>
            </p>
            <p className={styles.modalWarning}>
              ⚠️ Esta operação NÃO pode ser desfeita!
            </p>
            <div className={styles.modalActions}>
              <Button
                variant="secondary"
                onClick={() => {
                  setShowRestaurarModal(false);
                  setBackupExterno(null);
                }}
              >
                Cancelar
              </Button>
              <Button variant="danger" onClick={handleRestaurar}>
                Confirmar Restauração
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {showExcluirModal && (
        <div
          className={styles.modalOverlay}
          onClick={() => {
            setShowExcluirModal(false);
            setBackupParaExcluir("");
          }}
        >
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalIcon}>🗑️</div>
            <h3 className={styles.modalTitle}>Confirmar Exclusão</h3>
            <p className={styles.modalText}>
              Tem certeza que deseja excluir este backup?
            </p>
            <p className={styles.modalText}>
              Backup: <strong>{backupParaExcluir}</strong>
            </p>
            <p className={styles.modalWarning}>
              ⚠️ Esta operação NÃO pode ser desfeita!
            </p>
            <div className={styles.modalActions}>
              <Button
                variant="secondary"
                onClick={() => {
                  setShowExcluirModal(false);
                  setBackupParaExcluir("");
                }}
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
                onClick={handleExcluirBackup}
                disabled={loading}
              >
                {loading ? "Excluindo..." : "Confirmar Exclusão"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
          duration={3000}
        />
      )}
    </div>
  );
};
