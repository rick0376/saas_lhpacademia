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
  const [canList, setCanList] = useState(false);
  const [canCreate, setCanCreate] = useState(false);
  const [canProcurar, setCanProcurar] = useState(false);
  const [canDownload, setCanDownload] = useState(false);
  const [canRestore, setCanRestore] = useState(false);
  const [canDelete, setCanDelete] = useState(false);
  const [canSave, setCanSave] = useState(false);

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

        const pBackup = permissoes.find((p: any) => p.recurso === "backup");
        const pList = permissoes.find((p: any) => p.recurso === "backup");
        const pBackupRestaurar = permissoes.find(
          (p: any) => p.recurso === "backup"
        );
        const pBackupExcluir = permissoes.find(
          (p: any) => p.recurso === "backup"
        );

        const pBackupCriar = permissoes.find(
          (p: any) => p.recurso === "backup_criar"
        );

        const pBackupSalvar = permissoes.find(
          (p: any) => p.recurso === "backup_salvar"
        );

        const pBackupDownload = permissoes.find(
          (p: any) => p.recurso === "backup_download"
        );

        setCanView(superAdmin || !!pBackup?.ler);
        setCanList(superAdmin || !!pList?.criar);
        setCanRestore(superAdmin || !!pBackupRestaurar?.editar);
        setCanDelete(superAdmin || !!pBackupExcluir?.deletar);

        setCanCreate(superAdmin || !!pBackupCriar?.criar);

        // Botão “Salvar”
        setCanSave(
          superAdmin || !!pBackupSalvar?.salvar || !!pBackupSalvar?.editar
        );

        // Botão “Download”
        setCanDownload(superAdmin || !!pBackupDownload?.ler);
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
        if (tabelasSelecionadas.length > 0) body.tabelas = tabelasSelecionadas;
        if (clienteSelecionado) body.clienteId = clienteSelecionado;
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

  const abrirModalRestaurar = (nomeArquivo: string) => {
    setBackupSelecionado(nomeArquivo);
    setBackupExterno(null);
    setShowRestaurarModal(true);
  };

  const abrirModalExcluir = (nomeArquivo: string) => {
    setBackupParaExcluir(nomeArquivo);
    setShowExcluirModal(true);
  };

  const abrirSeletorArquivo = () => {
    fileInputRef.current?.click();
  };

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

  const handleRestaurar = async () => {
    setLoading(true);
    setShowRestaurarModal(false);
    try {
      let response;
      if (backupExterno) {
        const formData = new FormData();
        formData.append("file", backupExterno);
        response = await fetch("/api/backup/restaurar-upload", {
          method: "POST",
          body: formData,
        });
      } else {
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
      setTimeout(() => window.location.reload(), 2000);
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
      carregarBackups();
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

      {/* Página e seções — controladas por Visualizar */}
      {canView && (
        <>
          {/* Backup Manual */}
          <div className={styles.section}>
            <h3>Backup Manual</h3>
            <p className={styles.description}>
              Crie um backup completo ou seletivo do banco de dados.
            </p>

            {/* Tipo de Backup */}
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

            {/* Opções seletivas */}
            {tipoBackup === "seletivo" && (
              <>
                <div className={styles.field}>
                  <label>Filtrar por Cliente</label>
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
                  <label>Tabelas</label>
                  <div className={styles.checkboxGroup}>
                    {tabelasDisponiveis.map((t) => (
                      <label key={t} className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={tabelasSelecionadas.includes(t)}
                          onChange={(e) =>
                            setTabelasSelecionadas((prev) =>
                              e.target.checked
                                ? [...prev, t]
                                : prev.filter((x) => x !== t)
                            )
                          }
                        />
                        <span>{t}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* 📦 Criar Backup Agora — controlado pelo “Novo” */}
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
            <p>Importe um backup do seu computador para restaurar o banco.</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleArquivoSelecionado}
              style={{ display: "none" }}
            />
            {canProcurar && (
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
            <p>Configure backups automáticos.</p>
            <div className={styles.form}>
              <label>
                <input
                  type="checkbox"
                  checked={agendamentoAtivo}
                  onChange={(e) => setAgendamentoAtivo(e.target.checked)}
                />
                Ativar backups automáticos
              </label>
              {agendamentoAtivo && (
                <select
                  value={intervalo}
                  onChange={(e) => setIntervalo(e.target.value)}
                  className={styles.select}
                >
                  <option value="diario">Diário</option>
                  <option value="semanal">Semanal</option>
                  <option value="mensal">Mensal</option>
                </select>
              )}
              {canSave && (
                <Button onClick={handleSalvarAgendamento} disabled={loading}>
                  {loading ? "Salvando..." : "💾 Salvar Configuração"}
                </Button>
              )}
            </div>
          </div>

          <div className={styles.divider} />

          {/* 🔹 Backups Disponíveis — controlado exclusivamente por canView */}
          {canList && (
            <div className={styles.section}>
              <h3>Backups Disponíveis</h3>
              {backups.length === 0 ? (
                <p className={styles.empty}>Nenhum backup encontrado.</p>
              ) : (
                <div className={styles.backupList}>
                  {backups.map((b) => (
                    <div key={b.nome} className={styles.backupItem}>
                      <div className={styles.backupInfo}>
                        <span>📄 {b.nome}</span>
                        <span>
                          {b.tamanho} • {b.data}
                        </span>
                      </div>
                      <div className={styles.backupActions}>
                        {/* ⬇️ Download — check específico */}
                        {canDownload && (
                          <Button
                            variant="secondary"
                            onClick={() => handleDownload(b.nome)}
                          >
                            ⬇️ Download
                          </Button>
                        )}
                        {/* 🔄 Restaurar — check Restaurar */}
                        {canRestore && (
                          <Button
                            variant="warning"
                            onClick={() => abrirModalRestaurar(b.nome)}
                          >
                            🔄 Restaurar
                          </Button>
                        )}
                        {/* 🗑️ Excluir — check Deletar */}
                        {canDelete && (
                          <Button
                            variant="danger"
                            onClick={() => abrirModalExcluir(b.nome)}
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
          )}
        </>
      )}
    </div>
  );
};
