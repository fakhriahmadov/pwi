export const site = {
  name: "Private Wealth Institute",
  tagline:
    "Research and commentary on how private wealth is created, kept and passed on — across industries, countries and generations.",
  readers: "The leading source for large business owners",
  email: "info@privatewealth.institute",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://www.privatewealth.institute",
  // Fill these in; empty values are hidden on the site.
  address: "",
  pressEmail: "",
  linkedin: "",
  instagram: "",
};

export const nav = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/insights", label: "Insights" },
  { href: "/research", label: "Research" },
  { href: "/events", label: "Events" },
  { href: "/contact", label: "Contact" },
];
