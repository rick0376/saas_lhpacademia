// app/dashboard/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { AlertaSemPermissao } from "@/components/ui/Alerta/AlertaSemPermissao";
import { KPICard } from "@/components/dashboard/KPICard/KPICard";
import { ChartCard } from "@/components/dashboard/ChartCard/ChartCard";
import { TopAlunosTable } from "@/components/dashboard/TopAlunosTable/TopAlunosTable";
import { AlunosInativosTable } from "@/components/dashboard/AlunosInativosTable/AlunosInativosTable";
import { Button } from "@/components/ui/Button/Button";
import styles from "./styles.module.scss";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/");
  }

  // Verificar permissão de acessar dashboard
  if (session.user.role !== "SUPERADMIN") {
    const permissao = await prisma.permissao.findUnique({
      where: {
        usuarioId_recurso: {
          usuarioId: session.user.id,
          recurso: "dashboard",
        },
      },
    });

    if (!permissao || !permissao.ler) {
      return (
        <div className={styles.container}>
          <AlertaSemPermissao />
          <div className={styles.semPermissao}>
            <h1>⛔ Acesso Negado</h1>
            <p>Você não tem permissão para acessar o dashboard.</p>
            <Link href="/dashboard">
              <Button variant="primary">Voltar para Home</Button>
            </Link>
          </div>
        </div>
      );
    }
  }

  const clienteWhere =
    session.user.role !== "SUPERADMIN" && session.user.clienteId
      ? { clienteId: session.user.clienteId }
      : {};

  // KPIs
  const totalAlunos = await prisma.aluno.count({
    where: { ...clienteWhere, ativo: true },
  });

  const primeiroDiaMes = new Date();
  primeiroDiaMes.setDate(1);
  primeiroDiaMes.setHours(0, 0, 0, 0);

  const novosAlunos = await prisma.aluno.count({
    where: {
      ...clienteWhere,
      createdAt: { gte: primeiroDiaMes },
    },
  });

  const treinosExecutados = await prisma.execucaoTreino.count({
    where: {
      aluno: clienteWhere,
      data: { gte: primeiroDiaMes },
    },
  });

  const dataInicio = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
  let alunos6Meses: any[] = [];

  if (session.user.role !== "SUPERADMIN" && session.user.clienteId) {
    alunos6Meses = await prisma.$queryRaw`
      SELECT 
        TO_CHAR("createdAt", 'YYYY-MM') as mes,
        COUNT(*) as total
      FROM "alunos"
      WHERE "createdAt" >= ${dataInicio}
        AND "clienteId" = ${session.user.clienteId}
      GROUP BY TO_CHAR("createdAt", 'YYYY-MM')
      ORDER BY mes ASC
    `;
  } else {
    alunos6Meses = await prisma.$queryRaw`
      SELECT 
        TO_CHAR("createdAt", 'YYYY-MM') as mes,
        COUNT(*) as total
      FROM "alunos"
      WHERE "createdAt" >= ${dataInicio}
      GROUP BY TO_CHAR("createdAt", 'YYYY-MM')
      ORDER BY mes ASC
    `;
  }

  // Top alunos
  const topAlunosData = await prisma.execucaoTreino.groupBy({
    by: ["alunoId"],
    where: {
      aluno: clienteWhere,
      data: {
        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
    },
    _count: { alunoId: true },
    orderBy: { _count: { alunoId: "desc" } },
    take: 10,
  });

  const topAlunos = await Promise.all(
    topAlunosData.map(async (aluno) => {
      const alunoData = await prisma.aluno.findUnique({
        where: { id: aluno.alunoId },
        select: { nome: true },
      });
      return {
        alunoId: aluno.alunoId,
        nome: alunoData?.nome || "Aluno não encontrado",
        _count: { alunoId: aluno._count.alunoId },
      };
    }),
  );

  // Alunos inativos
  const alunosInativosData = await prisma.aluno.findMany({
    where: {
      ...clienteWhere,
      ativo: true,
      NOT: {
        treinos: {
          some: {
            execucoes: {
              some: {
                data: {
                  gte: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
                },
              },
            },
          },
        },
      },
    },
    select: {
      id: true,
      nome: true,
      createdAt: true,
      _count: {
        select: {
          treinos: true,
        },
      },
    },
    take: 10,
  });

  const alunosInativos = alunosInativosData.map((aluno) => ({
    id: aluno.id,
    nome: aluno.nome,
    dataCadastro: aluno.createdAt,
    _count: { treinos: aluno._count.treinos },
  }));

  // Logs de login
  const logsData = await prisma.loginLog.findMany({
    where: {
      ...clienteWhere,
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const totalAcessos = logsData.length;
  const totalUsuarios = new Set(logsData.map((log) => log.email)).size;

  // Menu de acesso rápido
  const dashboardItems = [
    {
      id: "clientes",
      title: "Clientes",
      description: "Gerenciar clientes do sistema",
      icon: "🏢",
      href: "/dashboard/clientes",
      color: "#f59e0b",
      superAdminOnly: true,
    },
    {
      id: "planos",
      title: "Planos",
      description: "Gerenciar planos e limites do sistema",
      icon: "📦",
      href: "/dashboard/planos",
      color: "#0ea5e9",
      superAdminOnly: true,
    },
    {
      id: "usuarios",
      title: "Usuários",
      description: "Gerenciar usuários do sistema",
      icon: "👥",
      href: "/dashboard/usuarios",
      color: "#6366f1",
      recurso: "usuarios",
    },
    {
      id: "alunos",
      title: "Alunos",
      description: "Cadastro e acompanhamento de alunos",
      icon: "👤",
      href: "/dashboard/alunos",
      color: "#10b981",
      recurso: "alunos",
    },
    {
      id: "avaliacoes",
      title: "Avaliações",
      description: "Gerenciar avaliações de alunos",
      icon: "📊",
      href: "/dashboard/avaliacoes",
      color: "#60daf0ff",
      recurso: "avaliacoes",
    },
    {
      id: "exercicios",
      title: "Exercícios",
      description: "Biblioteca de exercícios",
      icon: "💪",
      href: "/dashboard/exercicios",
      color: "#ef4444",
      recurso: "exercicios",
    },
    {
      id: "grupos-treinos",
      title: "Grupos",
      description: "Organizar treinos por grupos",
      icon: "📁",
      href: "/dashboard/grupos-treinos",
      color: "#3b82f6",
      recurso: "grupos_treinos",
    },
    {
      id: "treinos",
      title: "Treinos",
      description: "Montagem de fichas de treino",
      icon: "📋",
      href: "/dashboard/treinos",
      color: "#8b5cf6",
      recurso: "treinos",
    },
    {
      id: "permissoes",
      title: "Permissões",
      description: "Configurar permissões de acesso",
      icon: "🔐",
      href: "/dashboard/permissoes",
      color: "#ec4899",
      recurso: "permissoes_gerenciar",
    },
    {
      id: "configuracoes",
      title: "Configurações",
      description: "Backup e configurações do sistema",
      icon: "⚙️",
      href: "/dashboard/configuracoes",
      color: "#64748b",
      recurso: "configuracoes",
    },
  ];

  // ✅ FILTRAR CARDS BASEADO EM PERMISSÕES
  const filteredItems = await Promise.all(
    dashboardItems.map(async (item) => {
      if (session.user.role === "SUPERADMIN") {
        return item;
      }

      if (item.superAdminOnly) {
        return null;
      }

      if (item.recurso) {
        const permissao = await prisma.permissao.findUnique({
          where: {
            usuarioId_recurso: {
              usuarioId: session.user.id,
              recurso: item.recurso,
            },
          },
        });

        return permissao?.ler ? item : null;
      }

      return item;
    }),
  );

  const filteredCardsItems = filteredItems.filter(Boolean);

  return (
    <div className={styles.container}>
      <AlertaSemPermissao />
      <div className={styles.header}>
        <h1 className={styles.title}>Olá, {session.user.name}! 👋</h1>
        <p className={styles.subtitle}>Bem-vindo ao painel de controle</p>
      </div>

      <DashboardStats />

      {/* KPI Cards */}
      <section className={styles.kpiSection}>
        <h2 className={styles.sectionTitle}>📊 Métricas Principais</h2>
        <div className={styles.kpiGrid}>
          <div className={styles.kpiCard}>
            <div
              className={styles.cardIcon}
              style={{
                background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)", // Cor do card
              }}
            >
              👥
            </div>
            <div className={styles.cardContent}>
              <span className={styles.cardValue}>{totalAlunos.toString()}</span>
              <span className={styles.cardLabel}> Alunos Ativos</span>
              <span className={styles.cardSubtext}>
                +{novosAlunos} novos no mês
              </span>
            </div>
          </div>

          <div className={styles.kpiCard}>
            <div
              className={styles.cardIcon}
              style={{
                background: "linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)", // Cor do card
              }}
            >
              💪
            </div>
            <div className={styles.cardContent}>
              <span className={styles.cardValue}>
                {treinosExecutados.toString()}
              </span>
              <span className={styles.cardLabel}> Treinos Realizados</span>
              <span className={styles.cardSubtext}>no mês atual</span>
            </div>
          </div>

          {/* Card de Logs de Login */}
          <div className={styles.kpiCard}>
            <div
              className={styles.cardIcon}
              style={{
                background: "linear-gradient(135deg, #ef4444 0%, #d97706 100%)", // Cor do card
              }}
            >
              🧾
            </div>
            <div className={styles.cardContent}>
              <span className={styles.cardValue}>{totalAcessos}</span>
              <span className={styles.cardLabel}> Total de Acessos </span>
              <span className={styles.cardSubtext}>
                {totalUsuarios} usuários únicos
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Gráficos */}
      <section className={styles.chartsSection}>
        <h2 className={styles.sectionTitle}>📈 Tendências de Alunos</h2>
        <div className={styles.chartsGrid}>
          <ChartCard
            title="Crescimento de Alunos (6 Meses)"
            data={alunos6Meses || []}
            type="bar"
            color="#3b82f6"
          />
        </div>
      </section>

      {/* Tabelas */}
      <section className={styles.tablesSection}>
        <h2 className={styles.sectionTitle}>📋 Ranking & Alertas</h2>
        <div className={styles.tablesGrid}>
          <TopAlunosTable alunos={topAlunos} />
          <AlunosInativosTable alunos={alunosInativos} />
        </div>
      </section>

      {/* Quick Access Menu */}
      <section className={styles.menuSection}>
        <h2 className={styles.sectionTitle}>Acesso Rápido</h2>
        <div className={styles.cardsGrid}>
          {filteredCardsItems.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className={styles.card}
              style={
                {
                  borderTopColor: item.color,
                } as React.CSSProperties
              }
              aria-label={`Acessar ${item.title}`}
            >
              <div
                className={styles.cardIcon}
                style={{ backgroundColor: item.color }}
              >
                {item.icon}
              </div>
              <h3 className={styles.cardTitle}>{item.title}</h3>
              <p className={styles.cardDescription}>{item.description}</p>
              <div className={styles.cardArrow} aria-hidden="true">
                →
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
