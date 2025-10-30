"use client";

import { ReactNode, useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import {
  User,
  LogOut,
  Settings,
  Activity,
  Home,
  Dumbbell,
  Ruler,
  Calendar,
  Menu,
} from "lucide-react";
import styles from "./layout.module.scss";
import nav from "./nav.module.scss";

type Props = {
  children: ReactNode;
};

export const AlunoLayout: React.FC<Props> = ({ children }) => {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const isAuthed = status === "authenticated";
  const menuRef = useRef<HTMLDivElement>(null);

  // Modal de confirmação de logout
  const [logoutOpen, setLogoutOpen] = useState(false);
  const openLogout = () => setLogoutOpen(true);
  const closeLogout = () => setLogoutOpen(false);
  const confirmLogout = () => {
    signOut({ callbackUrl: "/alunos/login" });
    localStorage.removeItem("alunoId");
  };

  // Menu dropdown state
  const [menuOpen, setMenuOpen] = useState(false);
  const toggleMenu = () => setMenuOpen(!menuOpen);

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  // Fecha menu/modal com ESC
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

  const isActive = (href: string) =>
    pathname === href || pathname?.startsWith(href + "/");

  // Nav links para aluno (dentro do dropdown menu)
  const navLinks = [
    { href: "/alunos/dashboard", label: "Dashboard", icon: <Home size={18} /> },
    { href: "/alunos/treinos", label: "Treinos", icon: <Dumbbell size={18} /> },
    { href: "/alunos/medidas", label: "Medidas", icon: <Ruler size={18} /> },
    {
      href: "/alunos/calendario",
      label: "Calendário",
      icon: <Calendar size={18} />,
    },
  ];

  const brandTitle = "LHP - Treino";

  const getBreadcrumb = () => {
    const parts = pathname.split("/").filter(Boolean);
    if (parts[0] === "aluno" && parts.length > 1) {
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
          href={isAuthed ? "/alunos/dashboard" : "/alunos/login"}
          className={styles.logoArea}
        >
          <div className={styles.logoContainer}>
            <Activity size={28} className={styles.logoIcon} />
          </div>
          <div className={styles.titleContainer}>
            <span className={styles.title}>{brandTitle}</span>
          </div>
        </Link>

        {/* Dropdown Menu */}
        {menuOpen && (
          <div className={styles.dropdownMenu} ref={menuRef}>
            <nav className={styles.dropdownNav}>
              {navLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`${styles.dropdownLink} ${
                    isActive(item.href) ? styles.dropdownLinkActive : ""
                  }`}
                  onClick={() => setMenuOpen(false)}
                >
                  <span className={styles.dropdownIcon}>{item.icon}</span>
                  <span className={styles.dropdownLabel}>{item.label}</span>
                </Link>
              ))}

              {/* ✅ DIVIDER */}
              <div className={styles.dropdownDivider}></div>

              {/* ✅ CONFIGURAÇÕES NO MENU MOBILE */}
              <Link
                href="/alunos/configuracoes"
                className={`${styles.dropdownLink} ${
                  isActive("/alunos/configuracoes")
                    ? styles.dropdownLinkActive
                    : ""
                }`}
                onClick={() => setMenuOpen(false)}
              >
                <span className={styles.dropdownIcon}>
                  <Settings size={18} />
                </span>
                <span className={styles.dropdownLabel}>Configurações</span>
              </Link>

              {/* ✅ LOGOUT NO MENU MOBILE */}
              <button
                className={`${styles.dropdownLink} ${styles.dropdownLogout}`}
                onClick={() => {
                  setMenuOpen(false);
                  openLogout();
                }}
              >
                <span className={styles.dropdownIcon}>
                  <LogOut size={18} />
                </span>
                <span className={styles.dropdownLabel}>Sair</span>
              </button>
            </nav>
          </div>
        )}

        {/* Right Area */}
        <div className={nav.rightArea}>
          {isAuthed && (
            <>
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
                  <span className={nav.userRole}>Aluno</span>
                </div>
              </div>

              {/* Actions */}
              <div className={nav.actions}>
                <Link
                  href="/alunos/configuracoes"
                  className={`${nav.actionBtn} ${nav.settingsBtn}`}
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

              {/* Menu Button */}
              <button
                className={styles.menuButton}
                onClick={toggleMenu}
                aria-expanded={menuOpen}
                aria-label="Abrir menu de navegação"
                title="Menu"
              >
                <Menu size={24} />
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );

  const Footer = (
    <footer className={styles.footer}>
      <div className={styles.footerContent}>
        <span>© {new Date().getFullYear()} — PCW - Treino</span>
        <span className={styles.dot} />
        <span className={styles.footerMuted}>Todos os direitos reservados</span>
      </div>
    </footer>
  );

  return (
    <>
      <div className={styles.wrapper}>
        {Header}
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
