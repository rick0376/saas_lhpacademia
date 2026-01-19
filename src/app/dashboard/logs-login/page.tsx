//app/dashboard/logs-login/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import styles from "./styles.module.scss";

type Log = {
  id: string;
  email: string;
  role: string;
  ip?: string | null;
  userAgent?: string | null;
  createdAt: string;
  cliente?: { nome: string } | null;
};

type Cliente = {
  id: string;
  nome: string;
};

export default function LogsLoginPage() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;

  const [logs, setLogs] = useState<Log[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [clienteId, setClienteId] = useState("all");
  const [loading, setLoading] = useState(true);

  // carregar clientes (somente superadmin)
  useEffect(() => {
    if (role === "SUPERADMIN") {
      fetch("/api/clientes")
        .then((r) => r.json())
        .then(setClientes);
    }
  }, [role]);

  // carregar logs
  useEffect(() => {
    setLoading(true);
    const qs = role === "SUPERADMIN" ? `?clienteId=${clienteId}` : "";
    fetch(`/api/logs-login${qs}`)
      .then((r) => r.json())
      .then(setLogs)
      .finally(() => setLoading(false));
  }, [clienteId, role]);

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <h1 className={styles.title}>🧾 Logs de Login</h1>

        {role === "SUPERADMIN" && (
          <div className={styles.filterBar}>
            <label>Academia</label>
            <select
              value={clienteId}
              onChange={(e) => setClienteId(e.target.value)}
            >
              <option value="all">Todas</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </div>
        )}

        {loading ? (
          <p>Carregando logs...</p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Email</th>
                  <th>Perfil</th>
                  <th>Academia</th>
                  <th>IP</th>
                  <th>Navegador</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id}>
                    <td>{new Date(l.createdAt).toLocaleString("pt-BR")}</td>
                    <td>{l.email}</td>
                    <td>{l.role}</td>
                    <td>{l.cliente?.nome || "-"}</td>
                    <td>{l.ip || "-"}</td>
                    <td className={styles.ua}>{l.userAgent || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
