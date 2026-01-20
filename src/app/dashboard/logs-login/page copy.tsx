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
  usuario?: { nome: string } | null;
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

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

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
    const params = new URLSearchParams();

    if (role === "SUPERADMIN") params.set("clienteId", clienteId);
    if (from) params.set("from", from);
    if (to) params.set("to", to);

    const qs = params.toString() ? `?${params.toString()}` : "";
    fetch(`/api/logs-login${qs}`)
      .then((r) => r.json())
      .then(setLogs)
      .finally(() => setLoading(false));
  }, [clienteId, role]);

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <h1 className={styles.title}>🧾 Logs de Login</h1>

        <div className={styles.filterBar}>
          {role === "SUPERADMIN" && (
            <>
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
            </>
          )}

          <label>De</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />

          <label>Até</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>

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
                  <th>Usuário</th>
                  <th>Academia</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id}>
                    <td>{new Date(l.createdAt).toLocaleString("pt-BR")}</td>
                    <td>{l.email}</td>
                    <td>{l.role}</td>
                    <td>{l.usuario?.nome || "-"}</td>
                    <td>{l.cliente?.nome || "Academia Pro"}</td>
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
