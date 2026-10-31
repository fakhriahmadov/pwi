const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

function parts(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return { y, m, d, dow: new Date(Date.UTC(y, m - 1, d)).getUTCDay() };
}
export const longDate = (iso: string) => { const p = parts(iso); return `${p.d} ${MONTHS[p.m - 1]} ${p.y}`; };
export const monthYear = (iso: string) => { const p = parts(iso); return `${MONTHS[p.m - 1]} ${p.y}`; };
export const dayOfMonth = (iso: string) => String(parts(iso).d);
export const weekday = (iso: string) => DAYS[parts(iso).dow];
export const year = (iso: string) => String(parts(iso).y);
