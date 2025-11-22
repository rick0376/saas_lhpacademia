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
  {
    value: "dashboard",
    label: "📊 Dashboard",
    description: "Acessar métricas e relatórios",
  },
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
    value: "alunos",
    label: "👤 Alunos",
    description: "Gerenciar cadastro de alunos",
  },
  {
    value: "avaliacoes",
    label: "📊 Avaliações",
    description: "Gerenciar avaliações de alunos",
  },
  {
    value: "exercicios",
    label: "💪 Exercícios",
    description: "Biblioteca de exercícios",
  },
  {
    value: "treinos",
    label: "📋 Treinos",
    description: "Criação e edição de treinos",
  },
  {
    value: "medidas",
    label: "📏 Medidas",
    description: "Registro de medidas corporais",
  },
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

  // ✅ CORREÇÃO: Adicionado dependência para recarregar quando o toggle muda
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

      // ✅ LÓGICA CORRETA DO FILTRO
      const usuariosFiltrados = mostrarTodos
        ? data.filter((u: Usuario) => u.ativo) // Todos ativos
        : data.filter(
            (u: Usuario) => u.ativo && (u.role === "ADMIN" || u.role === "USER")
          ); // Só ADMIN/USER

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

  // ✅ NOVO: Marcar/Desmarcar TODAS as permissões de um tipo
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

  // ✅ NOVO: Marcar/Desmarcar TODOS os tipos de UM recurso específico
  const handleToggleTodosTiposRecurso = (recurso: string) => {
    setPermissoes((prev) => {
      const permissaoAtual = prev[recurso] || {
        id: "",
        recurso,
        criar: false,
        ler: true,
        editar: false,
        deletar: false,
      };

      // Se algum estiver marcado, desmarca todos. Se nenhum estiver, marca todos.
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

  // ✅ NOVO: Verifica se todos os tipos de um recurso estão marcados
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
          editar: false,
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
    setToast({ ...toast, show: false });
  };

  // ✅ NOVO: Verifica se todos os itens de um tipo estão marcados
  const todasMarcadas = (tipo: "criar" | "ler" | "editar" | "deletar") => {
    return RECURSOS.every((r) => permissoes[r.value]?.[tipo]);
  };

  const usuarioInfo = usuarios.find((u) => u.id === usuarioSelecionado);

  return (
    <div className={styles.container}>
      {/* ✅ TOGGLE MOVIDO PARA O TOPO */}
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
          <div className={styles.permissoesGrid}>
            {RECURSOS.map(({ value: recurso, label, description }) => {
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
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={todosTiposMarcadosNoRecurso(recurso)}
                        onChange={() => handleToggleTodosTiposRecurso(recurso)}
                        className={styles.checkbox}
                        title="Marcar/Desmarcar todos os tipos deste recurso"
                      />
                      <span>Total</span>
                    </label>

                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={permissao.criar}
                        onChange={() => handleTogglePermissao(recurso, "criar")}
                        className={styles.checkbox}
                      />
                      <span>Novo</span>
                    </label>

                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={permissao.ler}
                        onChange={() => handleTogglePermissao(recurso, "ler")}
                        className={styles.checkbox}
                      />
                      <span>Visualizar</span>
                    </label>

                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={permissao.editar}
                        onChange={() =>
                          handleTogglePermissao(recurso, "editar")
                        }
                        className={styles.checkbox}
                      />
                      <span>Editar</span>
                    </label>

                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={permissao.deletar}
                        onChange={() =>
                          handleTogglePermissao(recurso, "deletar")
                        }
                        className={styles.checkbox}
                      />
                      <span>Deletar</span>
                    </label>
                  </div>
                </div>
              );
            })}
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

      {/* Toast para mensagens */}
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
