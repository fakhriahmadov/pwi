/** A small chart-like drawing for the story header, one per theme: fortunes climb in steps, new companies curve upwards, failures fall. Decorative only. */
export function StoryArt({ topic }: { topic: string }) {
  const grid = [0, 1, 2, 3].map((i) => <line key={i} x1="0" x2="320" y1={20 + i * 40} y2={20 + i * 40} className="art-grid" />);
  let shape: React.ReactNode;
  if (topic === "bankruptcies") {
    const pts = "0,34 40,30 80,42 120,38 160,62 200,58 240,96 280,118 320,146";
    shape = <><polyline points={`${pts} 320,160 0,160`} className="art-fill art-fill-red" /><polyline points={pts} className="art-line art-red" /><circle cx="320" cy="146" r="5" className="art-dot art-dot-red" /></>;
  } else if (topic === "unicorns") {
    const pts = "0,150 40,148 80,144 120,138 160,128 200,112 240,88 280,54 320,14";
    shape = <><polyline points={`${pts} 320,160 0,160`} className="art-fill" /><polyline points={pts} className="art-line" /><line x1="0" x2="320" y1="40" y2="40" className="art-mark" /><circle cx="320" cy="14" r="5" className="art-dot" /></>;
  } else {
    const bars = [44, 58, 66, 80, 92, 110, 124, 146];
    shape = <>{bars.map((h, i) => <rect key={i} x={i * 40 + 6} y={160 - h} width="28" height={h} className={i === bars.length - 1 ? "art-bar art-bar-hi" : "art-bar"} />)}</>;
  }
  return <svg className="story-art" viewBox="0 0 320 160" aria-hidden="true">{grid}{shape}</svg>;
}
