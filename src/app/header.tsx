export default function RootHead() {
  return (
    <>
      <title>LHPSYSTEMS Academia Pro</title>
      <meta
        name="description"
        content="LHPSYSTEMS Academia Pro - A solução completa para gestão de academias, controle de alunos, planos, medidas e muito mais."
      />

      {/* Open Graph */}
      <meta property="og:title" content="LHPSYSTEMS Academia Pro" />
      <meta
        property="og:description"
        content="Gestão fácil e eficiente para academias. Controle completo de alunos, planos, medidas e muito mais."
      />
      <meta property="og:image" content="/imagens/logo.png" />
      <meta property="og:type" content="website" />
      <meta property="og:url" content="https://lhpsystems.com.br/" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="LHPSYSTEMS Academia Pro" />
      <meta
        name="twitter:description"
        content="Gestão fácil e eficiente para academias. Controle completo de alunos, planos, medidas e muito mais."
      />
      <meta name="twitter:image" content="/imagens/logo.png" />
    </>
  );
}
