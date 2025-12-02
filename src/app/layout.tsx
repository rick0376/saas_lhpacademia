import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "@/components/Providers";
import "./globals.scss";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  // 👇 ISSO AQUI É O SEGREDO PARA O VERCEL/WHATSAPP 👇
  // Troque pelo seu link REAL da Vercel (sem a barra no final)
  metadataBase: new URL("https://nome-do-seu-projeto.vercel.app"),

  title: {
    default: "Academia Pro - Gestão Inteligente",
    template: "%s | Academia Pro",
  },
  description: "Sistema completo para gestão de academias e personal trainers.",

  openGraph: {
    title: "Academia Pro",
    description: "Controle alunos, treinos e avaliações em um só lugar.",
    url: "/", // Agora pode ser relativo, pois temos o metadataBase
    siteName: "Academia Pro",
    locale: "pt_BR",
    type: "website",
    images: [
      {
        url: "/og-image.png", // O Next vai juntar com o metadataBase automaticamente
        width: 1200,
        height: 630,
      },
    ],
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
