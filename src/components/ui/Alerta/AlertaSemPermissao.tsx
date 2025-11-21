"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import styles from "./styles.module.scss";

export const AlertaSemPermissao = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [show, setShow] = useState(false);

  useEffect(() => {
    const erro = searchParams.get("erro");
    if (erro === "sem-permissao") {
      setShow(true);
      // Remove o parâmetro da URL após mostrar o alerta
      const timer = setTimeout(() => {
        router.replace("/dashboard");
      }, 5000); // Esconde automaticamente após 5 segundos

      return () => clearTimeout(timer);
    }
  }, [searchParams, router]);

  if (!show) return null;

  return (
    <div className={styles.alertaContainer}>
      <div className={styles.alerta}>
        <div className={styles.icon}>🔐</div>
        <div className={styles.content}>
          <h3>Acesso Negado</h3>
          <p>Você não tem permissão para acessar esta funcionalidade.</p>
          <p className={styles.small}>
            Entre em contato com o administrador para solicitar acesso.
          </p>
        </div>
        <button
          onClick={() => setShow(false)}
          className={styles.closeButton}
          aria-label="Fechar"
        >
          ✕
        </button>
      </div>
    </div>
  );
};
