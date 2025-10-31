// app/alunos/configuracoes/page.tsx (COMPLETO)
"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlunoLayout } from "@/components/alunos/AlunoLayout";
import {
  Settings,
  User,
  Lock,
  Bell,
  Shield,
  LogOut,
  Save,
  ArrowLeft,
  Camera,
  X,
  Check,
  Eye,
  EyeOff,
  AlertCircle,
} from "lucide-react";
import styles from "./styles.module.scss";
import { Toast } from "@/components/ui/Toast/Toast";

interface AlunoConfigs {
  id: string;
  nome: string;
  email: string;
  foto: string | null;
  telefone: string | null;
  dataNascimento: Date | null;
  objetivo: string | null;
}

interface Notificacoes {
  emailTreino: boolean;
  emailAvaliacao: boolean;
  emailAlerta: boolean;
  emailNewsletter: boolean;
}

interface Privacidade {
  perfiliPublico: boolean;
  mostrarPeso: boolean;
  mostrarAltura: boolean;
  mostrarTreinos: boolean;
}

type TabType = "dados" | "seguranca" | "notificacoes" | "privacidade";

export default function ConfiguracoesPage() {
  const { data: session } = useSession();
  const router = useRouter();

  // ========================================
  // ESTADO PRINCIPAL
  // ========================================
  const [currentTab, setCurrentTab] = useState<TabType>("dados");
  const [alunoData, setAlunoData] = useState<AlunoConfigs | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Dados Pessoais
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<AlunoConfigs | null>(null);
  const [saving, setSaving] = useState(false);

  // Segurança
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [savingSenha, setSavingSenha] = useState(false);

  // Notificações
  const [notificacoes, setNotificacoes] = useState<Notificacoes>({
    emailTreino: true,
    emailAvaliacao: true,
    emailAlerta: false,
    emailNewsletter: false,
  });
  const [savingNotificacoes, setSavingNotificacoes] = useState(false);

  // Privacidade
  const [privacidade, setPrivacidade] = useState<Privacidade>({
    perfiliPublico: false,
    mostrarPeso: true,
    mostrarAltura: true,
    mostrarTreinos: true,
  });
  const [savingPrivacidade, setSavingPrivacidade] = useState(false);

  // Toast
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error" | "info" | "warning";
  }>({
    show: false,
    message: "",
    type: "success",
  });

  // ========================================
  // CARREGAR DADOS
  // ========================================
  useEffect(() => {
    if (!session?.user) {
      router.push("/alunos/login");
      return;
    }

    fetchAlunoData();
  }, [session]);

  const fetchAlunoData = async () => {
    try {
      setLoading(true);
      const alunoId = (session?.user as any).aluno?.id;

      if (!alunoId) {
        throw new Error("Aluno ID não encontrado");
      }

      const response = await fetch(`/api/alunos/perfil?alunoId=${alunoId}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`Erro: ${response.status}`);
      }

      const data = await response.json();
      setAlunoData(data);
      setFormData(data);
      setError("");
    } catch (err: any) {
      setError(err.message || "Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // DADOS PESSOAIS
  // ========================================
  const handleSavePersonalData = async () => {
    if (!formData) return;

    try {
      setSaving(true);
      const alunoId = (session?.user as any).aluno?.id;

      const response = await fetch(`/api/alunos/perfil`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alunoId,
          nome: formData.nome,
          telefone: formData.telefone,
          dataNascimento: formData.dataNascimento,
          objetivo: formData.objetivo,
        }),
      });

      if (!response.ok) {
        throw new Error("Erro ao salvar dados");
      }

      setAlunoData(formData);
      setEditMode(false);
      setToast({
        show: true,
        message: "✅ Dados atualizados com sucesso!",
        type: "success",
      });
    } catch (err: any) {
      setToast({
        show: true,
        message: `❌ ${err.message}`,
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  // ========================================
  // SEGURANÇA - ALTERAR SENHA
  // ========================================
  const handleAlterarSenha = async () => {
    if (!senhaAtual || !novaSenha || !confirmarSenha) {
      setToast({
        show: true,
        message: "❌ Preencha todos os campos",
        type: "error",
      });
      return;
    }

    if (novaSenha !== confirmarSenha) {
      setToast({
        show: true,
        message: "❌ As senhas não coincidem",
        type: "error",
      });
      return;
    }

    if (novaSenha.length < 6) {
      setToast({
        show: true,
        message: "❌ A nova senha deve ter pelo menos 6 caracteres",
        type: "error",
      });
      return;
    }

    try {
      setSavingSenha(true);
      const alunoId = (session?.user as any).aluno?.id;

      const response = await fetch(`/api/alunos/senha`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alunoId,
          senhaAtual,
          novaSenha,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao alterar senha");
      }

      setSenhaAtual("");
      setNovaSenha("");
      setConfirmarSenha("");
      setToast({
        show: true,
        message: "✅ Senha alterada com sucesso!",
        type: "success",
      });
    } catch (err: any) {
      setToast({
        show: true,
        message: `❌ ${err.message}`,
        type: "error",
      });
    } finally {
      setSavingSenha(false);
    }
  };

  // ========================================
  // NOTIFICAÇÕES
  // ========================================
  const handleSaveNotificacoes = async () => {
    try {
      setSavingNotificacoes(true);
      const alunoId = (session?.user as any).aluno?.id;

      const response = await fetch(`/api/alunos/notificacoes`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alunoId,
          ...notificacoes,
        }),
      });

      if (!response.ok) {
        throw new Error("Erro ao salvar notificações");
      }

      setToast({
        show: true,
        message: "✅ Notificações atualizadas!",
        type: "success",
      });
    } catch (err: any) {
      setToast({
        show: true,
        message: `❌ ${err.message}`,
        type: "error",
      });
    } finally {
      setSavingNotificacoes(false);
    }
  };

  // ========================================
  // PRIVACIDADE
  // ========================================
  const handleSavePrivacidade = async () => {
    try {
      setSavingPrivacidade(true);
      const alunoId = (session?.user as any).aluno?.id;

      const response = await fetch(`/api/alunos/privacidade`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alunoId,
          ...privacidade,
        }),
      });

      if (!response.ok) {
        throw new Error("Erro ao salvar privacidade");
      }

      setToast({
        show: true,
        message: "✅ Privacidade atualizada!",
        type: "success",
      });
    } catch (err: any) {
      setToast({
        show: true,
        message: `❌ ${err.message}`,
        type: "error",
      });
    } finally {
      setSavingPrivacidade(false);
    }
  };

  // ========================================
  // LOGOUT
  // ========================================
  const handleLogout = async () => {
    if (confirm("Tem certeza que deseja sair da sua conta?")) {
      await signOut({ callbackUrl: "/alunos/login" });
    }
  };

  // ========================================
  // RENDER - LOADING
  // ========================================
  if (loading) {
    return (
      <AlunoLayout>
        <div className={styles.container}>
          <div className={styles.loadingContainer}>
            <div className={styles.spinner} />
            <p>Carregando configurações...</p>
          </div>
        </div>
      </AlunoLayout>
    );
  }

  // ========================================
  // RENDER - ERROR
  // ========================================
  if (!alunoData) {
    return (
      <AlunoLayout>
        <div className={styles.container}>
          <div className={styles.errorContainer}>
            <AlertCircle size={48} />
            <p>❌ {error || "Erro ao carregar dados"}</p>
            <button onClick={fetchAlunoData} className={styles.retryButton}>
              Tentar Novamente
            </button>
          </div>
        </div>
      </AlunoLayout>
    );
  }

  // ========================================
  // RENDER - PRINCIPAL
  // ========================================
  return (
    <AlunoLayout>
      <div className={styles.container}>
        {/* HEADER */}
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <Settings size={32} className={styles.headerIcon} />
            <div>
              <h1>⚙️ Configurações</h1>
              <p className={styles.subtitle}>
                Gerencie seu perfil e preferências
              </p>
            </div>
          </div>
          <Link href="/alunos/dashboard" className={styles.backLink}>
            <ArrowLeft size={20} />
            Voltar
          </Link>
        </div>

        {/* TABS NAVIGATION */}
        <div className={styles.tabsNav}>
          {(
            ["dados", "seguranca", "notificacoes", "privacidade"] as TabType[]
          ).map((tab) => (
            <button
              key={tab}
              className={`${styles.tab} ${
                currentTab === tab ? styles.tabActive : ""
              }`}
              onClick={() => setCurrentTab(tab)}
            >
              {tab === "dados" && <User size={20} />}
              {tab === "seguranca" && <Lock size={20} />}
              {tab === "notificacoes" && <Bell size={20} />}
              {tab === "privacidade" && <Shield size={20} />}
              <span>
                {tab === "dados" && "Dados Pessoais"}
                {tab === "seguranca" && "Segurança"}
                {tab === "notificacoes" && "Notificações"}
                {tab === "privacidade" && "Privacidade"}
              </span>
            </button>
          ))}
        </div>

        {/* CONTENT */}
        <div className={styles.content}>
          {/* ========== TAB 1: DADOS PESSOAIS ========== */}
          {currentTab === "dados" && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2>
                  <User size={24} />
                  Dados Pessoais
                </h2>
                {!editMode ? (
                  <button
                    className={styles.editButton}
                    onClick={() => setEditMode(true)}
                  >
                    Editar Perfil
                  </button>
                ) : (
                  <div className={styles.actionButtons}>
                    <button
                      className={styles.saveButton}
                      onClick={handleSavePersonalData}
                      disabled={saving}
                    >
                      <Save size={18} />
                      {saving ? "Salvando..." : "Salvar"}
                    </button>
                    <button
                      className={styles.cancelButton}
                      onClick={() => {
                        setEditMode(false);
                        setFormData(alunoData);
                      }}
                    >
                      <X size={18} />
                      Cancelar
                    </button>
                  </div>
                )}
              </div>

              <div className={styles.formGrid}>
                {/* Foto */}
                <div className={styles.photoSection}>
                  <div className={styles.photoWrapper}>
                    <img
                      src={formData?.foto || "/default-avatar.png"}
                      alt="Foto de perfil"
                      className={styles.photo}
                      onError={(e) => {
                        e.currentTarget.src =
                          "https://via.placeholder.com/120x120/714797/FFFFFF?text=👤";
                      }}
                    />
                    {editMode && (
                      <button className={styles.photoUploadBtn}>
                        <Camera size={20} />
                      </button>
                    )}
                  </div>
                  {editMode && (
                    <p className={styles.photoHelp}>
                      Clique na foto para alterar
                    </p>
                  )}
                </div>

                {/* Formulário */}
                <div className={styles.formFields}>
                  {/* Nome */}
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Nome Completo *</label>
                    {editMode ? (
                      <input
                        type="text"
                        value={formData?.nome || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData!,
                            nome: e.target.value,
                          })
                        }
                        className={styles.input}
                        placeholder="Seu nome"
                      />
                    ) : (
                      <div className={styles.viewValue}>{alunoData.nome}</div>
                    )}
                  </div>

                  {/* Email */}
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Email</label>
                    <div className={styles.viewValue}>{alunoData.email}</div>
                    <p className={styles.helperText}>
                      💡 Email não pode ser alterado por segurança
                    </p>
                  </div>

                  {/* Telefone */}
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Telefone</label>
                    {editMode ? (
                      <input
                        type="tel"
                        value={formData?.telefone || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData!,
                            telefone: e.target.value,
                          })
                        }
                        className={styles.input}
                        placeholder="(11) 99999-9999"
                      />
                    ) : (
                      <div className={styles.viewValue}>
                        {alunoData.telefone || "Não informado"}
                      </div>
                    )}
                  </div>

                  {/* Data de Nascimento */}
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Data de Nascimento</label>
                    {editMode ? (
                      <input
                        type="date"
                        value={
                          formData?.dataNascimento
                            ? new Date(formData.dataNascimento)
                                .toISOString()
                                .split("T")[0]
                            : ""
                        }
                        onChange={(e) =>
                          setFormData({
                            ...formData!,
                            dataNascimento: e.target.value
                              ? new Date(e.target.value)
                              : null,
                          })
                        }
                        className={styles.input}
                      />
                    ) : (
                      <div className={styles.viewValue}>
                        {alunoData.dataNascimento
                          ? new Date(
                              alunoData.dataNascimento
                            ).toLocaleDateString("pt-BR")
                          : "Não informado"}
                      </div>
                    )}
                  </div>

                  {/* Objetivo */}
                  <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                    <label className={styles.label}>Objetivo de Treino</label>
                    {editMode ? (
                      <textarea
                        value={formData?.objetivo || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData!,
                            objetivo: e.target.value,
                          })
                        }
                        className={styles.textarea}
                        placeholder="Ex: Ganhar massa muscular, perder peso..."
                        rows={3}
                      />
                    ) : (
                      <div className={styles.viewValue}>
                        {alunoData.objetivo || "Não informado"}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========== TAB 2: SEGURANÇA ========== */}
          {currentTab === "seguranca" && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2>
                  <Lock size={24} />
                  Alterar Senha
                </h2>
              </div>

              <div className={styles.securityForm}>
                {/* Senha Atual */}
                <div className={styles.formGroup}>
                  <label className={styles.label}>Senha Atual *</label>
                  <div className={styles.inputGroup}>
                    <input
                      type={mostrarSenha ? "text" : "password"}
                      value={senhaAtual}
                      onChange={(e) => setSenhaAtual(e.target.value)}
                      className={styles.input}
                      placeholder="Digite sua senha atual"
                    />
                    <button
                      type="button"
                      className={styles.eyeButton}
                      onClick={() => setMostrarSenha(!mostrarSenha)}
                    >
                      {mostrarSenha ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                {/* Nova Senha */}
                <div className={styles.formGroup}>
                  <label className={styles.label}>Nova Senha *</label>
                  <div className={styles.inputGroup}>
                    <input
                      type={mostrarSenha ? "text" : "password"}
                      value={novaSenha}
                      onChange={(e) => setNovaSenha(e.target.value)}
                      className={styles.input}
                      placeholder="Digite uma nova senha (mín. 6 caracteres)"
                    />
                    <button
                      type="button"
                      className={styles.eyeButton}
                      onClick={() => setMostrarSenha(!mostrarSenha)}
                    >
                      {mostrarSenha ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                {/* Confirmar Senha */}
                <div className={styles.formGroup}>
                  <label className={styles.label}>Confirmar Nova Senha *</label>
                  <div className={styles.inputGroup}>
                    <input
                      type={mostrarSenha ? "text" : "password"}
                      value={confirmarSenha}
                      onChange={(e) => setConfirmarSenha(e.target.value)}
                      className={styles.input}
                      placeholder="Confirme a nova senha"
                    />
                    <button
                      type="button"
                      className={styles.eyeButton}
                      onClick={() => setMostrarSenha(!mostrarSenha)}
                    >
                      {mostrarSenha ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <button
                  className={styles.saveButton}
                  onClick={handleAlterarSenha}
                  disabled={savingSenha}
                >
                  <Save size={18} />
                  {savingSenha ? "Salvando..." : "Alterar Senha"}
                </button>
              </div>
            </div>
          )}

          {/* ========== TAB 3: NOTIFICAÇÕES ========== */}
          {currentTab === "notificacoes" && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2>
                  <Bell size={24} />
                  Preferências de Notificações
                </h2>
              </div>

              <div className={styles.togglesSection}>
                {/* Email Treino */}
                <div className={styles.toggleItem}>
                  <div className={styles.toggleInfo}>
                    <h4>📅 Notificações de Treino</h4>
                    <p>Receba lembretes dos seus treinos agendados</p>
                  </div>
                  <label className={styles.toggle}>
                    <input
                      type="checkbox"
                      checked={notificacoes.emailTreino}
                      onChange={(e) =>
                        setNotificacoes({
                          ...notificacoes,
                          emailTreino: e.target.checked,
                        })
                      }
                    />
                    <span className={styles.toggleSlider} />
                  </label>
                </div>

                {/* Email Avaliação */}
                <div className={styles.toggleItem}>
                  <div className={styles.toggleInfo}>
                    <h4>📊 Notificações de Avaliação</h4>
                    <p>
                      Receba avisos quando novas avaliações forem
                      disponibilizadas
                    </p>
                  </div>
                  <label className={styles.toggle}>
                    <input
                      type="checkbox"
                      checked={notificacoes.emailAvaliacao}
                      onChange={(e) =>
                        setNotificacoes({
                          ...notificacoes,
                          emailAvaliacao: e.target.checked,
                        })
                      }
                    />
                    <span className={styles.toggleSlider} />
                  </label>
                </div>

                {/* Email Alerta */}
                <div className={styles.toggleItem}>
                  <div className={styles.toggleInfo}>
                    <h4>⚠️ Alertas Importantes</h4>
                    <p>Receba avisos sobre alterações na sua conta</p>
                  </div>
                  <label className={styles.toggle}>
                    <input
                      type="checkbox"
                      checked={notificacoes.emailAlerta}
                      onChange={(e) =>
                        setNotificacoes({
                          ...notificacoes,
                          emailAlerta: e.target.checked,
                        })
                      }
                    />
                    <span className={styles.toggleSlider} />
                  </label>
                </div>

                {/* Email Newsletter */}
                <div className={styles.toggleItem}>
                  <div className={styles.toggleInfo}>
                    <h4>📬 Newsletter</h4>
                    <p>Receba dicas de fitness e saúde por email</p>
                  </div>
                  <label className={styles.toggle}>
                    <input
                      type="checkbox"
                      checked={notificacoes.emailNewsletter}
                      onChange={(e) =>
                        setNotificacoes({
                          ...notificacoes,
                          emailNewsletter: e.target.checked,
                        })
                      }
                    />
                    <span className={styles.toggleSlider} />
                  </label>
                </div>
              </div>

              <button
                className={styles.saveButton}
                onClick={handleSaveNotificacoes}
                disabled={savingNotificacoes}
              >
                <Save size={18} />
                {savingNotificacoes ? "Salvando..." : "Salvar Preferências"}
              </button>
            </div>
          )}

          {/* ========== TAB 4: PRIVACIDADE ========== */}
          {currentTab === "privacidade" && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2>
                  <Shield size={24} />
                  Controle de Privacidade
                </h2>
              </div>

              <div className={styles.togglesSection}>
                {/* Perfil Público */}
                <div className={styles.toggleItem}>
                  <div className={styles.toggleInfo}>
                    <h4>👥 Perfil Público</h4>
                    <p>Permitir que outros alunos vejam seu perfil</p>
                  </div>
                  <label className={styles.toggle}>
                    <input
                      type="checkbox"
                      checked={privacidade.perfiliPublico}
                      onChange={(e) =>
                        setPrivacidade({
                          ...privacidade,
                          perfiliPublico: e.target.checked,
                        })
                      }
                    />
                    <span className={styles.toggleSlider} />
                  </label>
                </div>

                {/* Mostrar Peso */}
                <div className={styles.toggleItem}>
                  <div className={styles.toggleInfo}>
                    <h4>⚖️ Mostrar Peso</h4>
                    <p>Sua evolução de peso será visível no seu perfil</p>
                  </div>
                  <label className={styles.toggle}>
                    <input
                      type="checkbox"
                      checked={privacidade.mostrarPeso}
                      onChange={(e) =>
                        setPrivacidade({
                          ...privacidade,
                          mostrarPeso: e.target.checked,
                        })
                      }
                    />
                    <span className={styles.toggleSlider} />
                  </label>
                </div>

                {/* Mostrar Altura */}
                <div className={styles.toggleItem}>
                  <div className={styles.toggleInfo}>
                    <h4>📏 Mostrar Altura</h4>
                    <p>Sua altura será visível no seu perfil</p>
                  </div>
                  <label className={styles.toggle}>
                    <input
                      type="checkbox"
                      checked={privacidade.mostrarAltura}
                      onChange={(e) =>
                        setPrivacidade({
                          ...privacidade,
                          mostrarAltura: e.target.checked,
                        })
                      }
                    />
                    <span className={styles.toggleSlider} />
                  </label>
                </div>

                {/* Mostrar Treinos */}
                <div className={styles.toggleItem}>
                  <div className={styles.toggleInfo}>
                    <h4>💪 Mostrar Treinos</h4>
                    <p>Seus treinos serão visíveis no seu perfil</p>
                  </div>
                  <label className={styles.toggle}>
                    <input
                      type="checkbox"
                      checked={privacidade.mostrarTreinos}
                      onChange={(e) =>
                        setPrivacidade({
                          ...privacidade,
                          mostrarTreinos: e.target.checked,
                        })
                      }
                    />
                    <span className={styles.toggleSlider} />
                  </label>
                </div>
              </div>

              <button
                className={styles.saveButton}
                onClick={handleSavePrivacidade}
                disabled={savingPrivacidade}
              >
                <Save size={18} />
                {savingPrivacidade ? "Salvando..." : "Salvar Privacidade"}
              </button>
            </div>
          )}

          {/* ========== LOGOUT ========== */}
          <div className={styles.logoutSection}>
            <div className={styles.logoutContent}>
              <LogOut size={32} className={styles.logoutIcon} />
              <div>
                <h3>Sair da Conta</h3>
                <p>Você será desconectado de todos os dispositivos</p>
              </div>
            </div>
            <button className={styles.logoutButton} onClick={handleLogout}>
              <LogOut size={20} />
              Fazer Logout
            </button>
          </div>
        </div>

        {/* TOAST */}
        {toast.show && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast({ ...toast, show: false })}
          />
        )}
      </div>
    </AlunoLayout>
  );
}
