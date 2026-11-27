import { site } from "@/content/site";

/** Structured data (schema.org JSON-LD) that search engines and AI answer engines read to understand and cite the site. */
export const abs = (p: string) => `${site.url.replace(/\/$/, "")}${p.startsWith("/") ? p : `/${p}`}`;

export const orgId = abs("/#organization");
export const organizationLd = () => ({
  "@context": "https://schema.org",
  "@type": "ResearchOrganization",
  "@id": orgId,
  name: site.name,
  url: abs("/"),
  logo: abs("/icon.png"),
  email: site.email,
  description: site.tagline,
  knowsAbout: ["private wealth", "billionaires", "family business", "succession", "family offices", "unicorns", "wealth indexes", "intergenerational wealth transfer"],
  sameAs: [site.linkedin, site.instagram, site.x, site.youtube, site.facebook].filter(Boolean),
});
export const websiteLd = () => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": abs("/#website"),
  name: site.name,
  url: abs("/"),
  inLanguage: "en-GB",
  publisher: { "@id": orgId },
});
export const breadcrumbLd = (items: [string, string][]) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map(([name, path], i) => ({ "@type": "ListItem", position: i + 1, name, item: abs(path) })),
});

/** Renders one or more JSON-LD objects. `<` is escaped so text can never close the script tag. */
export function JsonLd({ data }: { data: object | object[] }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
