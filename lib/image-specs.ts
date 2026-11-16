/** What each kind of image slot needs, and how the site crops it on each device. Shared by the admin and the pages. */
export type ImageSpec = { label: string; rec: [number, number]; min: [number, number]; ratio: string; fit: "cover" | "contain"; frames: [string, string][]; round?: boolean; note: string };

export const IMAGE_SPECS = {
  venue: { label: "Venue photo", rec: [2400, 1600], min: [1600, 1067], ratio: "3:2 landscape", fit: "cover", frames: [["Desktop", "8 / 7"], ["Tablet", "16 / 10"], ["Phone", "16 / 10"]], note: "Beside the venue details on desktop, full width above them on tablets and phones." },
  card: { label: "Events page card photo", rec: [1600, 1200], min: [1000, 750], ratio: "4:3 landscape", fit: "cover", frames: [["Desktop", "4 / 3"], ["Tablet", "16 / 7"], ["Phone", "16 / 10"]], note: "The photo on this event’s card on the Events page. Without one, the venue photo is used." },
  portrait: { label: "Speaker portrait", rec: [800, 800], min: [400, 400], ratio: "1:1 square", fit: "cover", round: true, frames: [["All devices", "1 / 1"]], note: "A small circle next to the name. Keep the face in the middle." },
  previous: { label: "Previous-speaker portrait", rec: [1200, 1500], min: [800, 1000], ratio: "4:5 portrait", fit: "cover", frames: [["All devices", "4 / 5"]], note: "Four in a row on desktop, two on phones. Head and shoulders, face in the upper third." },
  logo: { label: "Partner logo", rec: [1200, 720], min: [600, 360], ratio: "wide, about 5:3", fit: "contain", frames: [["Desktop", "5 / 3"], ["Phone", "3 / 2"]], note: "Transparent PNG or SVG export, logo filling the width, no extra white border." },
  cover: { label: "Article cover", rec: [2400, 1029], min: [1600, 686], ratio: "21:9 wide", fit: "cover", frames: [["Article page", "21 / 9"], ["Cards", "4 / 3"], ["Phone", "16 / 10"]], note: "Used on the article page and, cropped, on cards." },
  team: { label: "Portrait", rec: [1200, 1500], min: [600, 750], ratio: "4:5 portrait", fit: "cover", frames: [["All devices", "4 / 5"]], note: "Head and shoulders, face in the upper third." },
} satisfies Record<string, ImageSpec>;
export type ImageSpecKey = keyof typeof IMAGE_SPECS;

export const recText = (s: ImageSpec) => `Recommended ${s.rec[0]} × ${s.rec[1]} px · ${s.ratio} · at least ${s.min[0]} × ${s.min[1]} px`;

/** Images can carry a focus point after "#": "/media/abc#40,45" = keep 40% across, 45% down in view when cropped. */
export function splitFocus(url?: string | null): { src: string; fx: number; fy: number } {
  const [src, f] = String(url || "").split("#");
  const m = /^(\d{1,3}),(\d{1,3})$/.exec(f || "");
  const clamp = (n: number) => Math.max(0, Math.min(100, n));
  return { src, fx: m ? clamp(Number(m[1])) : 50, fy: m ? clamp(Number(m[2])) : 50 };
}
/** CSS for a cropped background image that keeps its focus point in view. */
export function bgStyle(url?: string | null, fit: "cover" | "contain" = "cover"): React.CSSProperties | undefined {
  if (!url) return undefined;
  const { src, fx, fy } = splitFocus(url);
  return { backgroundImage: `url(${src})`, backgroundSize: fit, backgroundPosition: `${fx}% ${fy}%`, backgroundRepeat: "no-repeat" };
}
