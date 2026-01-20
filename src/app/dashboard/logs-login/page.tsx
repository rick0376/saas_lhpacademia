//app/dashboard/logs-login/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import styles from "./styles.module.scss";

// ✅ ADICIONADOS (PDF/WHATS)
import { jsPDF } from "jspdf";
import { FileText } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";

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

  const [totalUsuarios, setTotalUsuarios] = useState(0);
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [totalAcessos, setTotalAcessos] = useState(0);

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

    // Cálculo das datas padrão
    const hoje = new Date();
    const umDiaAntes = new Date(hoje);
    umDiaAntes.setDate(hoje.getDate() - 1); // Um dia antes do dia atual

    // Definir os valores padrão de data
    const defaultFrom = `${umDiaAntes.getFullYear()}-${(umDiaAntes.getMonth() + 1).toString().padStart(2, "0")}-${umDiaAntes.getDate().toString().padStart(2, "0")}`;
    const defaultTo = `${hoje.getFullYear()}-${(hoje.getMonth() + 1).toString().padStart(2, "0")}-${hoje.getDate().toString().padStart(2, "0")}`;

    setFrom(defaultFrom);
    setTo(defaultTo);

    const params = new URLSearchParams();

    if (role === "SUPERADMIN") params.set("clienteId", clienteId);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (roleFilter && roleFilter !== "all") params.set("role", roleFilter); // Filtra por role

    const qs = params.toString() ? `?${params.toString()}` : "";
    fetch(`/api/logs-login${qs}`)
      .then((r) => r.json())
      .then((data) => {
        setLogs(data);

        // Contar os usuários únicos
        const uniqueUsers = new Set(data.map((log: Log) => log.email));
        setTotalUsuarios(uniqueUsers.size); // Contagem de usuários únicos

        // Contar o total de acessos
        setTotalAcessos(data.length); // Contagem do total de acessos
      })
      .finally(() => setLoading(false));
  }, [clienteId, role, from, to, roleFilter]);

  // ✅ ADICIONADOS (PDF)
  const gerarPdfLogs = async () => {
    if (logs.length === 0) return;

    const nomeCliente =
      (session?.user as any)?.cliente ||
      (session?.user as any)?.name ||
      "Academia Pro";

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 10;
    let y = 50;

    const getLogoBase64 = async () => {
      try {
        const origin =
          typeof window !== "undefined" ? window.location.origin : "";
        const resp = await fetch(`${origin}/imagens/logo.png`, {
          cache: "no-store",
        });
        if (!resp.ok) return "";
        const blob = await resp.blob();
        return await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () =>
            resolve(typeof reader.result === "string" ? reader.result : "");
          reader.onerror = () => resolve("");
          reader.readAsDataURL(blob);
        });
      } catch {
        return "";
      }
    };

    const logoDataUri = await getLogoBase64();

    const printHeader = () => {
      doc.setFillColor(25, 35, 55);
      doc.rect(0, 0, pageWidth, 40, "F");
      doc.setFillColor(218, 165, 32);
      doc.rect(0, 35, pageWidth, 5, "F");

      if (logoDataUri) {
        try {
          doc.addImage(logoDataUri, "PNG", 10, 7, 18, 18);
        } catch {}
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(255, 255, 255);
      doc.text("LOGS DE LOGIN", pageWidth / 2, 18, { align: "center" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      const periodo = `${from ? `De: ${from}` : "De: -"}  ${
        to ? `Até: ${to}` : "Até: -"
      }`;
      doc.text(periodo, pageWidth / 2, 28, { align: "center" });
    };

    const printFooter = () => {
      const totalPages = doc.getNumberOfPages();
      const footerY = pageHeight - 10;

      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);

        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.5);
        doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);

        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);

        doc.text(nomeCliente, margin, footerY);
        doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin, footerY, {
          align: "right",
        });
      }
    };

    const printTableHeader = () => {
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.setFont("helvetica", "bold");
      doc.text("DATA", margin, y);
      doc.text("EMAIL", 55, y);
      doc.text("PERFIL", 125, y);
      doc.text("USUÁRIO", 150, y);
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, y + 2, pageWidth - margin, y + 2);
      y += 8;
    };

    const checkPageBreak = (heightNeeded: number) => {
      if (y + heightNeeded > pageHeight - 20) {
        doc.addPage();
        y = 50;
        printHeader();
        printTableHeader();
      }
    };

    printHeader();
    printTableHeader();

    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);

    logs.forEach((l) => {
      checkPageBreak(10);

      const dataStr = new Date(l.createdAt).toLocaleString("pt-BR");
      const email = doc.splitTextToSize(l.email || "-", 65);
      const perfil = l.role || "-";
      const usuarioNome = doc.splitTextToSize(l.usuario?.nome || "-", 45);

      doc.text(dataStr, margin, y);
      doc.text(email, 55, y);
      doc.text(perfil, 125, y);
      doc.text(usuarioNome, 150, y);

      const height = Math.max(email.length * 5, usuarioNome.length * 5, 6);

      doc.setDrawColor(245, 245, 245);
      doc.line(margin, y + height, pageWidth - margin, y + height);

      y += height + 4;
    });

    printFooter();

    const suffix = `${from || "inicio"}-${to || "hoje"}`.replaceAll("/", "-");
    doc.save(`logs-login-${suffix}.pdf`);
  };

  // ✅ ADICIONADOS (WHATS)
  const enviarWhatsAppLogs = () => {
    if (logs.length === 0) return;

    const nomeCliente =
      (session?.user as any)?.cliente ||
      (session?.user as any)?.name ||
      "Academia Pro";

    let texto = `🧾 *LOGS DE LOGIN*\n`;
    texto += `${from ? `De: ${from}` : "De: -"} | ${
      to ? `Até: ${to}` : "Até: -"
    }\n\n`;

    logs.slice(0, 80).forEach((l) => {
      const dataStr = new Date(l.createdAt).toLocaleString("pt-BR");
      const usuarioNome = l.usuario?.nome || "-";
      const academia = l.cliente?.nome || "Academia Pro";
      texto += `▪️ ${dataStr} | ${l.email} | ${l.role} | ${usuarioNome} | ${academia}\n`;
    });

    if (logs.length > 80) {
      texto += `\n... +${logs.length - 80} registros (limite do WhatsApp)\n`;
    }

    texto += `\n------------------------------\n`;
    texto += `📌 *${nomeCliente}*`;

    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(
      texto,
    )}`;
    window.open(url, "_blank");
  };

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <h1 className={styles.title}>🧾 Logs de Login</h1>

        <h1 className={styles.contador}>
          Acessos: {totalUsuarios} usuários / {totalAcessos} acessos
        </h1>

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

          {/* Filtro de Tipo de Usuário */}
          <label>Tipo</label>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="all">Todos</option>
            <option value="SUPERADMIN">SUPERADMIN</option>
            <option value="ADMIN">ADMIN</option>
            <option value="USUARIO">USUARIO</option>
            <option value="ALUNO">ALUNO</option>
          </select>

          {/* Filtro de Data */}
          <div className={styles.dateFilter}>
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

          {/* Botões PDF e WhatsApp */}
          <div className={styles.actionButtons}>
            <button
              onClick={gerarPdfLogs}
              className={styles.actionBtn}
              disabled={logs.length === 0 || loading}
              title="Baixar PDF"
            >
              <FileText className={styles.iconBtn} />
              PDF
            </button>

            <button
              onClick={enviarWhatsAppLogs}
              className={styles.actionBtn}
              disabled={logs.length === 0 || loading}
              title="Enviar WhatsApp"
            >
              <FaWhatsapp className={styles.iconBtn} />
              Whats
            </button>
          </div>
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
