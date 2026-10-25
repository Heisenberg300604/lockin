import { PRODUCT, SITE_NAME, SITE_URL, TAGLINE, absoluteUrl } from "./site";

// Stable @ids let every page reference the same entities instead of redefining them.
export const ids = {
  website: `${SITE_URL}/#website`,
  app: `${SITE_URL}/#app`,
};

type Thing = Record<string, unknown>;

export const websiteNode: Thing = {
  "@type": "WebSite",
  "@id": ids.website,
  url: absoluteUrl("/"),
  name: SITE_NAME,
  alternateName: "LockIn habit tracker",
  description: PRODUCT.summary,
  inLanguage: "en",
  // TODO(owner): add `publisher` (Organization or Person) once you confirm the
  // public maker name and logo. Left out rather than guessed.
};

export const appNode: Thing = {
  "@type": "WebApplication",
  "@id": ids.app,
  name: SITE_NAME,
  url: absoluteUrl("/"),
  description: PRODUCT.summary,
  slogan: TAGLINE,
  applicationCategory: "LifestyleApplication",
  operatingSystem: "Any (web browser)",
  browserRequirements: "Requires JavaScript",
  featureList: [...PRODUCT.features],
  image: absoluteUrl("/opengraph-image"),
  isPartOf: { "@id": ids.website },
  // TODO(owner): add `offers` only once pricing is public (e.g. price "0" if it
  // is free). Google's SoftwareApplication rich result needs offers plus
  // ratings/reviews; none are invented here.
};

export function breadcrumbs(trail: { name: string; path: string }[]): Thing {
  return {
    "@type": "BreadcrumbList",
    itemListElement: trail.map((crumb, index) => ({ "@type": "ListItem", position: index + 1, name: crumb.name, item: absoluteUrl(crumb.path) })),
  };
}

// `<` is escaped so user-visible strings can never close the script element.
export function JsonLd({ graph }: { graph: Thing[] }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@graph": graph }).replace(/</g, "\\u003c") }} />;
}
