import type { MetadataRoute } from "next";
import { site } from "@/content/site";

// AI answer engines and their search crawlers are welcome: they can only quote what they can read.
const AI_BOTS = ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-SearchBot", "Claude-User", "anthropic-ai", "PerplexityBot", "Perplexity-User", "Google-Extended", "Applebot-Extended", "Bingbot", "DuckAssistBot", "Meta-ExternalAgent", "MistralAI-User", "cohere-ai", "Amazonbot"];
const closed = ["/admin", "/api/", "/tickets/", "/account", "/signin", "/newsletter/preferences", "/investors"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: closed }, { userAgent: AI_BOTS, allow: ["/", "/llms.txt"], disallow: closed }],
    sitemap: `${site.url}/sitemap.xml`,
  };
}
