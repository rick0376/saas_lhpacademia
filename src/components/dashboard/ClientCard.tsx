import React from "react";
import Link from "next/link";
import styles from "./styles.module.scss";

interface ClientCardProps {
  id: string;
  nome: string;
  logo?: string;
}

export const ClientCard: React.FC<ClientCardProps> = ({ id, nome, logo }) => {
  return (
    <Link href={`/login/${id}`} className={styles.card}>
      <div className={styles.cardContent}>
        {logo ? (
          <img src={logo} alt={nome} className={styles.logo} />
        ) : (
          <div className={styles.logoPlaceholder}>
            {nome.charAt(0).toUpperCase()}
          </div>
        )}
        <h3 className={styles.nome}>{nome}</h3>
      </div>
    </Link>
  );
};
