"use client";

import { useEffect, useRef } from "react";
import Chart from "chart.js/auto";
import styles from "./styles.module.scss";

interface ChartCardProps {
  title: string;
  data: any[];
  type: "line" | "bar";
  color: string;
}

export const ChartCard: React.FC<ChartCardProps> = ({
  title,
  data,
  type,
  color,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current || !data || data.length === 0) return;

    // Destruir gráfico anterior se existir
    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    // Preparar dados
    const labels = data.map((item) => {
      const [ano, mes] = item.mes.split("-");
      const mesNome = new Date(Number(ano), Number(mes) - 1).toLocaleDateString(
        "pt-BR",
        { month: "short" }
      );
      return mesNome.charAt(0).toUpperCase() + mesNome.slice(1);
    });

    const valores = data.map((item) => Number(item.total));

    // Criar gráfico
    chartRef.current = new Chart(ctx, {
      type: type,
      data: {
        labels: labels,
        datasets: [
          {
            label: title,
            data: valores,
            backgroundColor: type === "bar" ? `${color}80` : `${color}20`,
            borderColor: color,
            borderWidth: 2,
            tension: 0.4,
            fill: type === "line",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                return `${context.dataset.label}: ${context.parsed.y} alunos`;
              },
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1,
            },
          },
        },
      },
    });

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, [data, type, color, title]);

  return (
    <div className={styles.card}>
      <h3 className={styles.title}>{title}</h3>
      <div className={styles.canvasContainer}>
        <canvas ref={canvasRef} className={styles.canvas}></canvas>
      </div>
    </div>
  );
};
