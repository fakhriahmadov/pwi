/** Line icons for the investor area (24px grid, 1.6 stroke, currentColor). */
const PATHS: Record<string, React.ReactNode> = {
  building: <><path d="M4 21V5l8-3v19M12 8h8v13M2 21h20" /><path d="M7 8h2M7 12h2M7 16h2M15 12h2M15 16h2" /></>,
  renovate: <><path d="M14.5 5.5l4 4L9 19H5v-4z" /><path d="M12.5 7.5l4 4M3 21h18" /></>,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8" /></>,
  coins: <><ellipse cx="9" cy="7" rx="6" ry="2.5" /><path d="M3 7v4c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5V7" /><path d="M9 16.5c-3.3 0-6-1.1-6-2.5v-3M15 11.5c3.3 0 6 1.1 6 2.5v4c0 1.4-2.7 2.5-6 2.5s-6-1.1-6-2.5v-1" /></>,
  exit: <><path d="M14 4h6v16h-6" /><path d="M3 12h12M11 8l4 4-4 4" /></>,
  sliders: <><path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0" /><circle cx="16" cy="6" r="2" /><circle cx="10" cy="12" r="2" /><circle cx="18" cy="18" r="2" /></>,
  scenarios: <><path d="M3 20h18" /><path d="M4 16l5-5 4 3 7-8" /><path d="M4 18l5-3 4 1 7-4" strokeDasharray="2 3" /></>,
  chart: <><path d="M3 21h18" /><rect x="5" y="12" width="3" height="9" /><rect x="10.5" y="8" width="3" height="13" /><rect x="16" y="4" width="3" height="17" /></>,
  document: <><path d="M6 2h9l5 5v15H6z" /><path d="M14 2v6h6M9 13h8M9 17h6" /></>,
  shield: <><path d="M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5z" /><path d="M8.5 12l2.5 2.5 4.5-5" /></>,
  people: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" /><circle cx="17" cy="9" r="2.5" /><path d="M16.5 14c2.9 0 5 1.9 5 5" /></>,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  key: <><circle cx="8" cy="15" r="4.5" /><path d="M11.2 11.8L20 3M16 7l3 3M14 9l2 2" /></>,
};

export function InvestorIcon({ name, size = 24 }: { name: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {PATHS[name] ?? PATHS.chart}
    </svg>
  );
}
