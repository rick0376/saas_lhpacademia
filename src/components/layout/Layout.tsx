"use client";

import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  User,
  LogOut,
  Settings,
  Home,
  Users,
  Dumbbell,
  ClipboardList,
  Building2,
  Activity,
  Ruler,
  Calendar, // Novo: para calendário aluno
  FileText, // Novo: para avaliações
} from "lucide-react";
import styles from "./styles.module.scss";
import nav from "./nav.module.scss";

type Props = {
  children: ReactNode;
};

type Role = "USER" | "PERSONAL" | "ALUNO" | "ADMIN" | "SUPERADMIN"; // Adicionado "ALUNO"

export const Layout: React.FC<Props> = ({ children }) => {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const isAuthed = status === "authenticated";
  const role: Role = ((session as any)?.user?.role as Role) || "USER";

  // Estado do menu lateral
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const burgerRef = useRef<HTMLButtonElement | null>(null);

  // Modal de confirmação de logout
  const [logoutOpen, setLogoutOpen] = useState(false);
  const openLogout = () => {
    setMenuOpen(false);
    setLogoutOpen(true);
  };
  const closeLogout = () => setLogoutOpen(false);
  const confirmLogout = () => {
    const callbackUrl = role === "ALUNO" ? "/aluno/login" : "/"; // Incremento: PCW redirect
    signOut({ callbackUrl });
  };

  // Fecha menu ao trocar de rota
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Fecha com ESC
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        setLogoutOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Clique-fora fecha menu
  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (menuRef.current?.contains(t)) return;
      if (burgerRef.current?.contains(t)) return;
      setMenuOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [menuOpen]);

  const isActive = (href: string) =>
    pathname === href || pathname?.startsWith(href + "/");

  const can = {
    manageUsers: role === "ADMIN" || role === "SUPERADMIN",
    superOnly: role === "SUPERADMIN",
    personal: role === "PERSONAL" || role === "ADMIN" || role === "SUPERADMIN",
    aluno: role === "ALUNO", // Novo: para PCW
  };

  const groupedNav = useMemo(() => {
    if (can.aluno) {
      // Nav específico para ALUNO (PCW: foco em views pessoais)
      return [
        {
          group: "Meu Portal",
          items: [
            {
              href: "/aluno/dashboard",
              label: "Dashboard",
              icon: <Home size={18} />,
            },
            {
              href: "/aluno/treinos",
              label: "Treinos",
              icon: <Dumbbell size={18} />,
            },
            {
              href: "/aluno/treinos/[id]",
              label: "Detalhes Treino",
              icon: <ClipboardList size={18} />,
            }, // Dinâmico, mas link base
            {
              href: "/aluno/avaliacoes",
              label: "Avaliações",
              icon: <FileText size={18} />,
            },
            {
              href: "/aluno/medidas",
              label: "Medidas",
              icon: <Ruler size={18} />,
            },
            {
              href: "/aluno/calendario",
              label: "Calendário",
              icon: <Calendar size={18} />,
            },
          ],
        },
      ];
    }

    // Nav original para outros roles (admin/personal/super)
    return [
      {
        group: "Início",
        items: [
          { href: "/dashboard", label: "Dashboard", icon: <Home size={18} /> },
        ],
      },
      {
        group: "Gestão de Alunos",
        items: can.personal
          ? [
              {
                href: "/dashboard/alunos",
                label: "Alunos",
                icon: <Users size={18} />,
              },
              {
                href: "/dashboard/medidas",
                label: "Medidas",
                icon: <Ruler size={18} />,
              },
            ]
          : [],
      },
      {
        group: "Treinos",
        items: can.personal
          ? [
              {
                href: "/dashboard/treinos",
                label: "Treinos",
                icon: <ClipboardList size={18} />,
              },
              {
                href: "/dashboard/exercicios",
                label: "Exercícios",
                icon: <Dumbbell size={18} />,
              },
            ]
          : [],
      },
      {
        group: "Cadastros",
        items: [
          ...(can.superOnly
            ? [
                {
                  href: "/dashboard/clientes",
                  label: "Clientes",
                  icon: <Building2 size={18} />,
                },
              ]
            : []),
          ...(can.manageUsers
            ? [
                {
                  href: "/dashboard/usuarios",
                  label: "Usuários",
                  icon: <User size={18} />,
                },
              ]
            : []),
        ],
      },
    ].filter((g) => g.items.length > 0);
  }, [can.personal, can.manageUsers, can.superOnly, can.aluno]); // Adicionado can.aluno

  const brandTitle = can.aluno ? "LHP - Meu Treino" : "Academia Pro"; // Incremento: Título PCW para aluno
  const brandSub = can.aluno ? "Portal do Aluno" : "Sistema de Gestão";

  // Breadcrumb simples no header (incremento para navegação clara no PCW)
  const getBreadcrumb = () => {
    const parts = pathname.split("/").filter(Boolean);
    if (parts[0] === "aluno") {
      return parts.slice(1).map((part, i) => (
        <span key={i} className={styles.breadcrumbItem}>
          <Link
            href={`/${parts.slice(0, i + 2).join("/")}`}
            className={styles.breadcrumbLink}
          >
            {part.charAt(0).toUpperCase() + part.slice(1)}
          </Link>
          {i < parts.length - 1 && (
            <span className={styles.breadcrumbSeparator}> / </span>
          )}
        </span>
      ));
    }
    return <span className={styles.breadcrumbDefault}>Dashboard</span>;
  };

  const Header = (
    <header className={styles.header}>
      <div className={styles.headerContent}>
        {/* Logo */}
        <Link
          href={
            isAuthed && can.aluno
              ? "/aluno/dashboard"
              : isAuthed
              ? "/dashboard"
              : "/"
          }
          className={styles.logoArea}
        >
          <div className={styles.logoContainer}>
            <Activity size={28} className={styles.logoIcon} />
          </div>
          <div className={styles.titleContainer}>
            <span className={styles.title}>{brandTitle}</span>
            <span className={styles.subtitle}>{brandSub}</span>
          </div>
        </Link>

        {/* Breadcrumb (novo para PCW) */}
        <nav className={styles.breadcrumbNav}>{getBreadcrumb()}</nav>

        {/* Right Area */}
        <div className={nav.rightArea}>
          {isAuthed && (
            <>
              {/* Botão de Menu */}
              <button
                ref={burgerRef}
                className={nav.menuButton}
                onClick={() => setMenuOpen((v) => !v)}
                title="Menu"
              >
                <Menu size={20} />
                <span className={nav.menuButtonText}>Menu</span>
              </button>

              {/* User Chip */}
              <div className={nav.userChip}>
                <span className={nav.userAvatar}>
                  {(session?.user?.name || session?.user?.email || "?")
                    .toString()
                    .slice(0, 1)
                    .toUpperCase()}
                </span>
                <div className={nav.userInfo}>
                  <span className={nav.userName}>
                    {session?.user?.name || session?.user?.email}
                  </span>
                  <span className={nav.userRole}>
                    {role === "ALUNO" && "Aluno"} // Incremento: Role aluno
                    {role === "SUPERADMIN" && "Super Admin"}
                    {role === "ADMIN" && "Admin"}
                    {role === "PERSONAL" && "Personal"}
                    {role === "USER" && "Usuário"}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className={nav.actions}>
                <Link
                  href={
                    can.aluno
                      ? "/aluno/configuracoes"
                      : "/dashboard/configuracoes"
                  } // Incremento: Path PCW
                  className={nav.actionBtn}
                  title="Configurações"
                >
                  <Settings size={18} />
                </Link>

                <button
                  className={`${nav.actionBtn} ${nav.logoutBtn}`}
                  onClick={openLogout}
                  title="Sair"
                >
                  <LogOut size={18} />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );

  const Sidebar = isAuthed && (
    <>
      {/* Menu Lateral */}
      <aside
        ref={menuRef}
        className={`${styles.sidebar} ${menuOpen ? styles.sidebarOpen : ""}`}
      >
        <div className={styles.sidebarHeader}>
          <h3 className={styles.sidebarTitle}>Menu de Navegação</h3>
          <button
            className={styles.sidebarClose}
            onClick={() => setMenuOpen(false)}
            aria-label="Fechar menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className={styles.sidebarNav}>
          {groupedNav.map(({ group, items }) => (
            <div key={group} className={styles.navGroup}>
              <div className={styles.navGroupTitle}>{group}</div>
              {items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`${styles.navItem} ${
                    isActive(item.href) ? styles.navItemActive : ""
                  }`}
                  onClick={() => setMenuOpen(false)}
                >
                  <span className={styles.navItemIcon}>{item.icon}</span>
                  <span className={styles.navItemLabel}>{item.label}</span>
                </Link>
              ))}
            </div>
          ))}

          <div className={styles.navDivider} />

          <div className={styles.navGroup}>
            <Link
              href={
                can.aluno ? "/aluno/configuracoes" : "/dashboard/configuracoes"
              }
              className={`${styles.navItem} ${
                isActive(
                  can.aluno
                    ? "/aluno/configuracoes"
                    : "/dashboard/configuracoes"
                )
                  ? styles.navItemActive
                  : ""
              }`}
              onClick={() => setMenuOpen(false)}
            >
              <span className={styles.navItemIcon}>
                <Settings size={18} />
              </span>
              <span className={styles.navItemLabel}>Configurações</span>
            </Link>

            <button className={styles.navItemLogout} onClick={openLogout}>
              <span className={styles.navItemIcon}>
                <LogOut size={18} />
              </span>
              <span className={styles.navItemLabel}>Sair</span>
            </button>
          </div>
        </nav>
      </aside>

      {/* Overlay */}
      {menuOpen && (
        <div className={styles.overlay} onClick={() => setMenuOpen(false)} />
      )}
    </>
  );

  const Footer = (
    <footer className={styles.footer}>
      <div className={styles.footerContent}>
        <span>
          © {new Date().getFullYear()} — {brandTitle}
        </span>
        <span className={styles.dot} />
        <span className={styles.footerMuted}>Todos os direitos reservados</span>
      </div>
    </footer>
  );

  return (
    <>
      <div className={styles.wrapper}>
        {Header}
        {Sidebar}
        <main className={styles.main}>{children}</main>
        {Footer}
      </div>

      {/* Modal de Logout */}
      {logoutOpen && (
        <div
          className={styles.modalOverlay}
          onClick={closeLogout}
          role="dialog"
          aria-modal="true"
        >
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalIcon}>
              <LogOut size={22} />
            </div>
            <h3 className={styles.modalTitle}>Sair da conta?</h3>
            <p className={styles.modalText}>
              Você tem certeza que deseja encerrar a sessão agora?
            </p>
            <div className={styles.modalActions}>
              <button className={styles.ghostBtn} onClick={closeLogout}>
                Cancelar
              </button>
              <button className={styles.dangerBtn} onClick={confirmLogout}>
                Sair
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
