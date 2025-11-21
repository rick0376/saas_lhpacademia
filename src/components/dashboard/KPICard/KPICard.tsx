"use client";

import styles from "./styles.module.scss";

interface KPICardProps {
  title: string;
  value: string;
  change: string;
  icon: string;
  color: string;
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  change,
  icon,
  color,
}) => {
  return (
    <div className={styles.card}>
      <div className={styles.icon} style={{ backgroundColor: `${color}20` }}>
        <span style={{ color }}>{icon}</span>
      </div>
      <div className={styles.content}>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.value} style={{ color }}>
          {value}
        </p>
        <p className={styles.change}>{change}</p>
      </div>
    </div>
  );
};
