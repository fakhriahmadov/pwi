import { buildTemplate } from "@/lib/sheets";

export async function GET() {
  const buf = await buildTemplate();
  return new Response(new Uint8Array(buf), {
    headers: {
      "content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "content-disposition": 'attachment; filename="PWI-index-data-template.xlsx"',
    },
  });
}
