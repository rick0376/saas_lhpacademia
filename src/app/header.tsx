export default function RootHead() {
  const baseUrl = "https://lhpsystems.com.br"; // Coloque aqui a URL base real do site
  const imageUrl = baseUrl + "/imagens/logo.png";

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
      <meta property="og:image" content={imageUrl} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={baseUrl} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="LHPSYSTEMS Academia Pro" />
      <meta
        name="twitter:description"
        content="Gestão fácil e eficiente para academias. Controle completo de alunos, planos, medidas e muito mais."
      />
      <meta name="twitter:image" content={imageUrl} />
    </>
  );
}
