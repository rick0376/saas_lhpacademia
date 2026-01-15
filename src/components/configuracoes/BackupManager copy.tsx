//src/components/configuracoes/BackupManager.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
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

  const { data: session } = useSession();
  const [canView, setCanView] = useState(false);
  const [canCreate, setCanCreate] = useState(false);
  const [canSearch, setCanSearch] = useState(false);
  const [canSaveConfig, setCanSaveConfig] = useState(false);
  const [canDownload, setCanDownload] = useState(false);
  const [canRestore, setCanRestore] = useState(false);
  const [canDelete, setCanDelete] = useState(false);

  useEffect(() => {
    carregarBackups();
    carregarConfigAgendamento();
  }, []);

  useEffect(() => {
    carregarBackups();
    carregarConfigAgendamento();
    carregarClientes();
  }, []);

  useEffect(() => {
    const verificarPermissoes = async () => {
      if (!session?.user?.id) return;

      try {
        const res = await fetch(`/api/permissoes?usuarioId=${session.user.id}`);
        const permissoes = await res.json();

        const superAdmin = session.user.role === "SUPERADMIN";

        const pConfig = permissoes.find(
          (p: any) => p.recurso === "configuracoes"
        );
        const pBackupCriar = permissoes.find(
          (p: any) => p.recurso === "backup_criar"
        );
        const pBackupProcurar = permissoes.find(
          (p: any) => p.recurso === "backup_procurar"
        );
        const pBackupSalvar = permissoes.find(
          (p: any) => p.recurso === "backup_salvar"
        );
        const pBackupDownload = permissoes.find(
          (p: any) => p.recurso === "backup_download"
        );
        const pBackupRestaurar = permissoes.find(
          (p: any) => p.recurso === "backup_restaurar"
        );

        /* const pBackupExcluir = permissoes.find(
          (p: any) => p.recurso === "backup_excluir"
        );

        setCanView(superAdmin || !!pConfig?.ler);
        setCanCreate(superAdmin || !!pBackupCriar?.criar);
        setCanSearch(
          superAdmin || !!pBackupProcurar?.ler || !!pBackupProcurar?.editar
        );
        setCanSaveConfig(
          superAdmin || !!pBackupSalvar?.criar || !!pBackupSalvar?.editar
        );
        setCanDownload(superAdmin || !!pBackupDownload?.ler);
        setCanRestore(superAdmin || !!pBackupRestaurar?.editar);
        setCanDelete(superAdmin || !!pBackupExcluir?.deletar);
       */
        const pBackup = permissoes.find((p: any) => p.recurso === "backup");
        // const superAdmin = session.user.role === "SUPERADMIN";

        setCanView(superAdmin || !!pBackup?.ler); // mostra toda a área de backup
        setCanCreate(superAdmin || !!pBackup?.criar); // botão "Criar Backup Agora"
        setCanSaveConfig(superAdmin || !!pBackup?.editar); // salvar configuração e restaurar
        setCanDelete(superAdmin || !!pBackup?.deletar); // excluir backups
      } catch (error) {
        console.error("Erro ao verificar permissões:", error);
      }
    };
    verificarPermissoes();
  }, [session]);

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
      {canView && (
        <>
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

            {canCreate && (
              <Button onClick={handleBackupManual} disabled={loading} fullWidth>
                {loading ? "Criando backup..." : "📦 Criar Backup Agora"}
              </Button>
            )}
          </div>

          <div className={styles.divider} />

          {/* Restaurar de Arquivo */}
          <div className={styles.section}>
            <h3>Restaurar de Arquivo</h3>
            <p className={styles.description}>
              Importe um backup do seu computador para restaurar o banco de
              dados.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleArquivoSelecionado}
              style={{ display: "none" }}
            />
            {canSaveConfig && (
              <Button
                onClick={abrirSeletorArquivo}
                variant="secondary"
                fullWidth
              >
                📂 Procurar Arquivo de Backup
              </Button>
            )}
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

              {canSaveConfig && (
                <Button onClick={handleSalvarAgendamento} disabled={loading}>
                  {loading ? "Salvando..." : "💾 Salvar Configuração"}
                </Button>
              )}
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
                      <span className={styles.backupNome}>
                        📄 {backup.nome}
                      </span>
                      <span className={styles.backupMeta}>
                        {backup.tamanho} • {backup.data}
                      </span>
                    </div>

                    <div className={styles.backupActions}>
                      <Button
                        variant="secondary"
                        onClick={() => handleDownload(backup.nome)}
                        disabled={!canView}
                      >
                        ⬇️ Download
                      </Button>
                      {canSaveConfig && (
                        <Button
                          variant="warning"
                          onClick={() => abrirModalRestaurar(backup.nome)}
                        >
                          🔄 Restaurar
                        </Button>
                      )}
                      {canDelete && (
                        <Button
                          variant="danger"
                          onClick={() => abrirModalExcluir(backup.nome)}
                        >
                          🗑️ Excluir
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
