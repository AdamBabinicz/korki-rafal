import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";

interface SEOProps {
  title: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
}

export function SEO({
  title,
  description,
  image = "/rafalp.avif", // Domyślne zdjęcie (np. Twoje)
  url = "https://mathmentor-app.onrender.com",
  type = "website",
}: SEOProps) {
  const { t, i18n } = useTranslation();

  const siteTitle = "MathMentor";
  const fullTitle = `${title} | ${siteTitle}`;
  const metaDescription =
    description ||
    t("hero.subtitle") ||
    "Profesjonalne korepetycje z matematyki.";
  const currentLang = i18n.language || "pl";

  return (
    <Helmet prioritizeSeoTags>
      {/* Podstawowe tagi */}
      <html lang={currentLang} />
      <title>{fullTitle}</title>
      <meta name="description" content={metaDescription} />

      {/* Open Graph / Facebook / LinkedIn */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={url} />
      <meta property="og:site_name" content={siteTitle} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={image} />
    </Helmet>
  );
}
