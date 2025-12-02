import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "@/components/Providers";
import "./globals.scss";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  // Se você usar o arquivo opengraph-image.png na pasta app,
  // NÃO precisa colocar metadataBase nem openGraph.images aqui.
  // O Next.js gera isso sozinho!

  title: {
    default: "Academia Pro - Gestão Inteligente",
    template: "%s | Academia Pro",
  },
  description: "Sistema completo para gestão de academias e personal trainers.",

  openGraph: {
    title: "Academia Pro",
    description: "Controle alunos, treinos e avaliações em um só lugar.",
    siteName: "Academia Pro",
    locale: "pt_BR",
    type: "website",
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
