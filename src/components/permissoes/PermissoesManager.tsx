//src/components/permissoes/PermissoesManager.tsx

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./styles.module.scss";
import { Button } from "../ui/Button/Button";
import { Toast } from "../ui/Toast/Toast";

interface Usuario {
  id: string;
  nome: string;
  email: string;
  role: string;
  ativo: boolean;
}

interface Permissao {
  id: string;
  recurso: string;
  criar: boolean;
  ler: boolean;
  editar: boolean;
  deletar: boolean;
}

const RECURSOS = [
  // ======================
  // 📊 GERAL
  // ======================
  {
    value: "dashboard",
    label: "📊 Dashboard",
    description: "Acessar métricas e relatórios",
  },

  // ======================
  // 🏢 CLIENTES / 👥 USUÁRIOS
  // ======================
  {
    value: "clientes",
    label: "🏢 Clientes",
    description: "Gerenciar clientes/academias",
  },
  {
    value: "usuarios",
    label: "👥 Usuários",
    description: "Gerenciar usuários do sistema",
  },
  {
    value: "usuarios_compartilhar",
    label: "📤 Usuários • Compartilhar",
    description: "Exportar lista de usuários em PDF e enviar via WhatsApp",
    tipos: ["ler"],
  },

  // ======================
  // 👤 ALUNOS
  // ======================
  {
    value: "alunos",
    label: "👤 Alunos",
    description: "Gerenciar cadastro de alunos",
  },
  {
    value: "alunos_perfil",
    label: "👤 Alunos • Perfil",
    description: "Acessar o perfil detalhado do aluno",
    tipos: ["ler"],
  },
  {
    value: "alunos_evolucao",
    label: "📈 Alunos • Evolução",
    description: "Visualizar evolução de treinos e progresso",
    tipos: ["ler"],
  },
  {
    value: "alunos_avaliacoes",
    label: "📝 Alunos • Avaliações",
    description: "Permitir acesso ao botão de avaliações dentro do aluno",
    tipos: ["ler"],
  },
  {
    value: "alunos_medidas",
    label: "📏 Alunos • Medidas",
    description: "Visualizar e registrar medidas corporais",
    tipos: ["ler"],
  },
  {
    value: "alunos_compartilhar",
    label: "📤 Alunos • Compartilhar",
    description: "Exportar relatório em PDF e enviar via WhatsApp",
    tipos: ["ler"],
  },

  // ======================
  // 📊 AVALIAÇÕES
  // ======================
  {
    value: "avaliacoes",
    label: "📊 Avaliações",
    description: "Gerenciar avaliações de alunos",
  },
  {
    value: "avaliacoes_compartilhar",
    label: "📤 Avaliações • Compartilhar",
    description: "Gerar PDF e enviar via WhatsApp",
    tipos: ["ler"], // só Visualizar
  },

  // ======================
  // 💪 EXERCÍCIOS
  // ======================
  {
    value: "exercicios",
    label: "💪 Exercícios",
    description: "Biblioteca de exercícios",
  },
  {
    value: "exercicios_compartilhar",
    label: "📤 Exercícios • Compartilhar",
    description: "Exportar lista de exercícios em PDF e enviar via WhatsApp",
    tipos: ["ler"],
  },

  // ======================
  // 📋 TREINOS
  // ======================
  {
    value: "treinos",
    label: "📋 Treinos",
    description: "Criação e edição de treinos",
  },
  {
    value: "treinos_compartilhar",
    label: "📤 Treinos • Compartilhar",
    description:
      "Exportar lista de treinos/fichas em PDF e enviar via WhatsApp",
    tipos: ["ler"],
  },
  {
    value: "treinos_atribuir",
    label: "🔗 Treinos • Atribuir ao Aluno",
    description: "Vincular treinos aos alunos e gerenciar cronogramas",
    tipos: ["ler", "deletar"],
  },

  // ======================
  // 📏 MEDIDAS
  // ======================
  {
    value: "medidas",
    label: "📏 Medidas",
    description: "Registro de medidas corporais",
    tipos: ["criar", "ler", "deletar"],
  },
  {
    value: "medidas_compartilhar",
    label: "📤 Medidas • Compartilhar",
    description: "Gerar PDF e enviar via WhatsApp",
    tipos: ["ler"],
  },

  // ======================
  // ✅ EXECUÇÕES / ⚙️ CONFIG / 💾 BACKUP
  // ======================
  {
    value: "execucoes",
    label: "✅ Execuções",
    description: "Registro de treinos realizados",
  },
  {
    value: "configuracoes",
    label: "⚙️ Configurações",
    description: "Acessar configurações do sistema",
  },
  {
    value: "backup",
    label: "💾 Backup",
    description: "Criar, restaurar e gerenciar backups do banco de dados",
    tipos: ["criar", "ler"],
    labels: { criar: "Backup Disponível" }, // <-- só muda o texto do criar
  },

  {
    value: "backup_criar",
    label: "💾 Backup • Criar",
    description:
      "Permite criar backups manualmente pelo botão 'Criar Backup Agora'",
    tipos: ["criar"],
  },
  {
    value: "backup_procurar",
    label: "📂 Backup • Procurar Arquivo",
    description: "Permite procurar e selecionar arquivos de backup",
    tipos: ["ler", "editar"],
  },
  {
    value: "backup_salvar",
    label: "💾 Backup • Salvar Configuração",
    description: "Permite salvar configurações de backup do sistema",
    tipos: ["criar", "editar"],
  },
  {
    value: "backup_download",
    label: "⬇️ Backup • Download",
    description: "Permite baixar arquivos de backup",
    tipos: ["ler"],
  },
  {
    value: "backup_restaurar",
    label: "♻️ Backup • Restaurar",
    description: "Permite restaurar um backup existente",
    tipos: ["editar"],
  },
  {
    value: "backup_excluir",
    label: "🗑️ Backup • Excluir",
    description: "Permite excluir arquivos de backup do servidor",
    tipos: ["deletar"],
  },
];

export const PermissoesManager = () => {
  const router = useRouter();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [usuarioSelecionado, setUsuarioSelecionado] = useState<string>("");
  const [permissoes, setPermissoes] = useState<Record<string, Permissao>>({});
  const [loading, setLoading] = useState(false);
  const [loadingSave, setLoadingSave] = useState(false);
  const [error, setError] = useState<string>("");
  const [mostrarTodos, setMostrarTodos] = useState(false);

  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error" | "info" | "warning";
  }>({
    show: false,
    message: "",
    type: "success",
  });

  useEffect(() => {
    fetchUsuarios();
  }, []);

  useEffect(() => {
    fetchUsuarios();
  }, [mostrarTodos]);

  useEffect(() => {
    if (usuarioSelecionado) {
      fetchPermissoes(usuarioSelecionado);
    }
  }, [usuarioSelecionado]);

  const fetchUsuarios = async () => {
    try {
      setError("");
      const response = await fetch("/api/usuarios");
      if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);

      const data = await response.json();

      const usuariosFiltrados = mostrarTodos
        ? data.filter((u: Usuario) => u.ativo)
        : data.filter(
            (u: Usuario) => u.ativo && (u.role === "ADMIN" || u.role === "USER")
          );

      setUsuarios(usuariosFiltrados);

      if (usuariosFiltrados.length === 0) {
        setError(
          mostrarTodos
            ? "Nenhum usuário ativo encontrado."
            : "Nenhum usuário ADMIN ou USER ativo encontrado. Cadastre usuários com essas roles ou marque 'Mostrar todos os usuários'."
        );
      }
    } catch (error) {
      console.error("❌ Erro ao carregar usuários:", error);
      setError(`Erro ao carregar usuários: ${error}`);
    }
  };

  const fetchPermissoes = async (usuarioId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/permissoes?usuarioId=${usuarioId}`);
      const data = await response.json();

      const permissoesMap: Record<string, Permissao> = {};
      data.forEach((p: Permissao) => {
        permissoesMap[p.recurso] = p;
      });

      setPermissoes(permissoesMap);
    } catch (error) {
      console.error("Erro ao carregar permissões:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePermissao = (
    recurso: string,
    tipo: "criar" | "ler" | "editar" | "deletar"
  ) => {
    setPermissoes((prev) => {
      const permissaoAtual = prev[recurso] || {
        id: "",
        recurso,
        criar: false,
        ler: true,
        editar: false,
        deletar: false,
      };

      return {
        ...prev,
        [recurso]: {
          ...permissaoAtual,
          [tipo]: !permissaoAtual[tipo],
        },
      };
    });
  };

  const handleToggleTodas = (tipo: "criar" | "ler" | "editar" | "deletar") => {
    setPermissoes((prev) => {
      const novoEstado: Record<string, Permissao> = { ...prev };
      const novoValor = !(
        RECURSOS.every((r) => novoEstado[r.value]?.[tipo]) ?? false
      );

      RECURSOS.forEach(({ value: recurso }) => {
        novoEstado[recurso] = {
          ...(novoEstado[recurso] || {
            id: "",
            recurso,
            criar: false,
            ler: true,
            editar: false,
            deletar: false,
          }),
          [tipo]: novoValor,
        };
      });

      return novoEstado;
    });
  };

  const handleToggleTodosTiposRecurso = (recurso: string) => {
    setPermissoes((prev) => {
      const permissaoAtual = prev[recurso] || {
        id: "",
        recurso,
        criar: false,
        ler: true,
        editar: true,
        deletar: false,
      };

      const algumMarcado =
        permissaoAtual.criar ||
        permissaoAtual.ler ||
        permissaoAtual.editar ||
        permissaoAtual.deletar;

      return {
        ...prev,
        [recurso]: {
          ...permissaoAtual,
          criar: !algumMarcado,
          ler: !algumMarcado,
          editar: !algumMarcado,
          deletar: !algumMarcado,
        },
      };
    });
  };

  const todosTiposMarcadosNoRecurso = (recurso: string) => {
    const permissao = permissoes[recurso];
    if (!permissao) return false;
    return (
      permissao.criar && permissao.ler && permissao.editar && permissao.deletar
    );
  };

  const handleSalvar = async () => {
    if (!usuarioSelecionado) {
      showToast("Selecione um usuário", "warning");
      return;
    }

    setLoadingSave(true);

    try {
      const promises = RECURSOS.map(async ({ value: recurso }) => {
        const permissao = permissoes[recurso] || {
          criar: false,
          ler: true,
          editar: true,
          deletar: false,
        };

        return fetch("/api/permissoes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            usuarioId: usuarioSelecionado,
            recurso,
            criar: permissao.criar,
            ler: permissao.ler,
            editar: permissao.editar,
            deletar: permissao.deletar,
          }),
        });
      });

      await Promise.all(promises);
      showToast("Permissões salvas com sucesso!", "success");
      router.refresh();
    } catch (error) {
      showToast("Erro ao salvar permissões", "error");
      console.error(error);
    } finally {
      setLoadingSave(false);
    }
  };

  const showToast = (
    message: string,
    type: "success" | "error" | "info" | "warning"
  ) => {
    setToast({ show: true, message, type });
  };

  const closeToast = () => {
    setToast((prev) => ({ ...prev, show: false }));
  };

  const todasMarcadas = (tipo: "criar" | "ler" | "editar" | "deletar") => {
    return RECURSOS.every((r) => permissoes[r.value]?.[tipo]);
  };

  const usuarioInfo = usuarios.find((u) => u.id === usuarioSelecionado);

  return (
    <div className={styles.container}>
      <div className={styles.filterToggle}>
        <label>
          <input
            type="checkbox"
            checked={mostrarTodos}
            onChange={(e) => setMostrarTodos(e.target.checked)}
          />
          <span>Mostrar todos os usuários</span>
        </label>
      </div>

      <div className={styles.selectSection}>
        <label className={styles.label}>Selecione o Usuário</label>
        <select
          value={usuarioSelecionado}
          onChange={(e) => setUsuarioSelecionado(e.target.value)}
          className={styles.select}
        >
          <option value="">
            {usuarios.length === 0
              ? "⚠️ Nenhum usuário disponível"
              : "Escolha um usuário..."}
          </option>
          {usuarios.map((usuario) => (
            <option key={usuario.id} value={usuario.id}>
              {usuario.nome} ({usuario.email}) - {usuario.role}
            </option>
          ))}
        </select>
      </div>

      {usuarioSelecionado && usuarioInfo && (
        <div className={styles.userCard}>
          <div className={styles.userInfo}>
            <h3>{usuarioInfo.nome}</h3>
            <p>{usuarioInfo.email}</p>
            <span className={styles.roleBadge}>{usuarioInfo.role}</span>
          </div>
        </div>
      )}

      {loading ? (
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Carregando permissões...</p>
        </div>
      ) : usuarioSelecionado ? (
        <>
          {/* linha de marcar todos por tipo (se quiser usar) */}
          <div className={styles.globalToggles}>
            <button
              type="button"
              onClick={() => handleToggleTodas("ler")}
              className={todasMarcadas("ler") ? styles.btnOn : styles.btnOff}
            >
              Marcar/Desmarcar todos: Visualizar
            </button>
            <button
              type="button"
              onClick={() => handleToggleTodas("criar")}
              className={todasMarcadas("criar") ? styles.btnOn : styles.btnOff}
            >
              Marcar/Desmarcar todos: Novo
            </button>
            <button
              type="button"
              onClick={() => handleToggleTodas("editar")}
              className={todasMarcadas("editar") ? styles.btnOn : styles.btnOff}
            >
              Marcar/Desmarcar todos: Editar
            </button>
            <button
              type="button"
              onClick={() => handleToggleTodas("deletar")}
              className={
                todasMarcadas("deletar") ? styles.btnOn : styles.btnOff
              }
            >
              Marcar/Desmarcar todos: Deletar
            </button>
          </div>

          <div className={styles.permissoesGrid}>
            {RECURSOS.map(
              ({ value: recurso, label, description, tipos, labels }) => {
                const permissao = permissoes[recurso] || {
                  criar: false,
                  ler: true,
                  editar: false,
                  deletar: false,
                };

                return (
                  <div key={recurso} className={styles.recursoCard}>
                    <div className={styles.recursoHeader}>
                      <h4 className={styles.recursoNome}>{label}</h4>
                      <p className={styles.recursoDesc}>{description}</p>
                    </div>

                    <div className={styles.checkboxGrid}>
                      {/* ✅ Só mostra o checkbox Total se o recurso tiver todos os tipos */}
                      {(!tipos || tipos.length === 4) && (
                        <label className={styles.checkboxLabel}>
                          <input
                            type="checkbox"
                            checked={todosTiposMarcadosNoRecurso(recurso)}
                            onChange={() =>
                              handleToggleTodosTiposRecurso(recurso)
                            }
                            className={styles.checkbox}
                            title="Marcar/Desmarcar todos os tipos deste recurso"
                          />
                          <span>Total</span>
                        </label>
                      )}

                      {/* ✅ Checkboxes dinâmicos conforme o campo 'tipos' */}
                      {(["criar", "ler", "editar", "deletar"] as const)
                        .filter((tipo) => !tipos || tipos.includes(tipo))
                        .map((tipo) => (
                          <label key={tipo} className={styles.checkboxLabel}>
                            <input
                              type="checkbox"
                              checked={permissao[tipo]}
                              onChange={() =>
                                handleTogglePermissao(recurso, tipo)
                              }
                              className={styles.checkbox}
                            />
                            <span>
                              {labels?.[tipo] ??
                                (tipo === "criar"
                                  ? "Novo"
                                  : tipo === "ler"
                                  ? "Visualizar"
                                  : tipo === "editar"
                                  ? "Editar"
                                  : "Deletar")}
                            </span>
                          </label>
                        ))}
                    </div>
                  </div>
                );
              }
            )}
          </div>

          <div className={styles.actions}>
            <Button onClick={handleSalvar} disabled={loadingSave} fullWidth>
              {loadingSave ? "Salvando..." : "💾 Salvar Permissões"}
            </Button>
          </div>
        </>
      ) : (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>🔐</div>
          <h3>Selecione um usuário</h3>
          <p>Escolha um usuário acima para configurar suas permissões</p>
        </div>
      )}

      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={closeToast}
          duration={3000}
        />
      )}
    </div>
  );
};
