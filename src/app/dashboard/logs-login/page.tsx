import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import styles from "./styles.module.scss";

export default async function LogsLoginPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/");

  const usuario = await prisma.usuario.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true, clienteId: true },
  });
  if (!usuario) redirect("/");

  if (usuario.role !== "SUPERADMIN") {
    const p = await prisma.permissao.findUnique({
      where: {
        usuarioId_recurso: { usuarioId: usuario.id, recurso: "logs_login" },
      },
    });
    if (!p?.ler) redirect("/dashboard?erro=sem-permissao");
  }

  const where =
    usuario.role === "SUPERADMIN"
      ? {}
      : { clienteId: usuario.clienteId as string };

  const logs = await prisma.loginLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <h1 className={styles.title}>🧾 Logs de Login</h1>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Data</th>
                <th>Email</th>
                <th>Role</th>
                <th>IP</th>
                <th>User-Agent</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id}>
                  <td>{new Date(l.createdAt).toLocaleString("pt-BR")}</td>
                  <td>{l.email}</td>
                  <td>{l.role}</td>
                  <td>{l.ip || "-"}</td>
                  <td className={styles.ua}>{l.userAgent || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
