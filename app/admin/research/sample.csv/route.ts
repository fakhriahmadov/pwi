/** Template showing the expected columns. The rows are fictional examples. */
export function GET() {
  const csv = [
    "year,name,country,industry,net_worth_eur_bn,birth_year,gender,tags",
    '2025,Example Person A,Spain,Retail,12.4,1958,female,"family-business; self-made"',
    '2025,Example Person B,Singapore,Technology,3.1,1999,male,"self-made"',
    '2025,Example Family C,Germany,Manufacturing,8.7,1972,,"family-business; second-generation"',
  ].join("\n");
  return new Response(csv, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": 'attachment; filename="pwi-index-data-template.csv"' } });
}
