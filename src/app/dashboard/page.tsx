import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import styles from "./styles.module.scss";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/");
  }

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
      id: "usuarios",
      title: "Usuários",
      description: "Gerenciar usuários do sistema",
      icon: "👥",
      href: "/dashboard/usuarios",
      color: "#6366f1",
    },
    {
      id: "alunos",
      title: "Alunos",
      description: "Cadastro e acompanhamento de alunos",
      icon: "👤",
      href: "/dashboard/alunos",
      color: "#10b981",
    },
    {
      id: "avaliacoes",
      title: "Avaliações",
      description: "Gerenciar avaliações de alunos",
      icon: "📊",
      href: "/dashboard/alunos",
      color: "#06b6d4",
      adminOnly: true,
    },
    {
      id: "exercicios",
      title: "Exercícios",
      description: "Biblioteca de exercícios",
      icon: "💪",
      href: "/dashboard/exercicios",
      color: "#ef4444",
    },
    {
      id: "treinos",
      title: "Treinos",
      description: "Montagem de fichas de treino",
      icon: "📋",
      href: "/dashboard/treinos",
      color: "#8b5cf6",
    },
    {
      id: "permissoes",
      title: "Permissões",
      description: "Configurar permissões de acesso",
      icon: "🔐",
      href: "/dashboard/permissoes",
      color: "#ec4899",
      adminOnly: true,
    },
  ];

  const filteredItems = dashboardItems.filter((item) => {
    if (item.superAdminOnly) {
      return (session.user as any).role === "SUPERADMIN";
    }
    if (item.adminOnly) {
      return (
        (session.user as any).role === "SUPERADMIN" ||
        (session.user as any).role === "ADMIN"
      );
    }
    return true;
  });

  return (
    <div className={styles.container}>
      {/* Welcome Section */}
      <div className={styles.header}>
        <h1 className={styles.title}>Olá, {session.user.name}! 👋</h1>
        <p className={styles.subtitle}>Bem-vindo ao painel de controle</p>
      </div>

      {/* Dashboard Stats */}
      <DashboardStats />

      {/* Quick Access Menu */}
      <section className={styles.menuSection}>
        <h2 className={styles.sectionTitle}>Acesso Rápido</h2>
        <div className={styles.cardsGrid}>
          {filteredItems.map((item) => (
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
