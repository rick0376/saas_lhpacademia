import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "@/components/Providers";
import "./globals.scss";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  // 1. Título da aba e da prévia
  title: {
    default: "Academia Pro - Gestão Inteligente",
    template: "%s | Academia Pro", // Isso faz páginas internas ficarem tipo "Alunos | Academia Pro"
  },

  // 2. Slogan / Descrição que aparece no WhatsApp
  description:
    "Transforme a gestão da sua academia. Controle alunos, treinos e avaliações em um só lugar com máxima eficiência.",

  // 3. Configuração do Card (Facebook, WhatsApp, LinkedIn)
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "https://saas-lhpacademia.vercel.app/", // ⚠️ IMPORTANTE: Coloque o link real do seu site aqui
    siteName: "Academia Pro",
    title: "Academia Pro - O Sistema Completo de Gestão",
    description:
      "Gerencie alunos, monte treinos e acompanhe evoluções. Simples, rápido e profissional.",
    images: [
      {
        url: "/og-image.png", // O Next busca esse arquivo na pasta /public
        width: 1200,
        height: 630,
        alt: "Painel do Academia Pro",
      },
    ],
  },

  // 4. Configuração para Twitter/X
  twitter: {
    card: "summary_large_image",
    title: "Academia Pro",
    description:
      "Sistema completo para gestão de academias e personal trainers.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
