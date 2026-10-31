import ExcelJS from "exceljs";
import { parseCsv } from "./indexes";
import { REGIONS } from "./regions";

/** Reads the first data sheet of an .xlsx (a sheet named "Data" if present) or a CSV into rows of text. */
export async function readTable(buf: Buffer, filename: string): Promise<string[][]> {
  if (/\.xlsx$/i.test(filename)) {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buf as unknown as ArrayBuffer);
    const ws = wb.getWorksheet("Data") ?? wb.worksheets.find((w) => w.actualRowCount > 1) ?? wb.worksheets[0];
    if (!ws) return [];
    const width = ws.actualColumnCount || ws.columnCount;
    const rows: string[][] = [];
    ws.eachRow({ includeEmpty: false }, (row) => {
      const out: string[] = [];
      for (let c = 1; c <= width; c++) {
        const cell = row.getCell(c);
        const v = cell.value as unknown;
        let s = "";
        if (v == null) s = "";
        else if (typeof v === "number") s = String(v);
        else if (v instanceof Date) s = String(v.getUTCFullYear());
        else if (typeof v === "object" && v && "result" in (v as object)) s = String((v as { result: unknown }).result ?? "");
        else if (typeof v === "object" && v && "richText" in (v as object)) s = (v as { richText: { text: string }[] }).richText.map((r) => r.text).join("");
        else s = cell.text ?? String(v);
        out.push(s.trim());
      }
      if (out.some(Boolean)) rows.push(out);
    });
    return rows;
  }
  if (/\.xls$/i.test(filename)) throw new Error("OLD_EXCEL");
  return parseCsv(buf.toString("utf8"));
}

export const SUGGESTED_TAGS = [
  ["family-business", "Wealth comes mainly from a family-owned company"],
  ["self-made", "Built the fortune in their own lifetime"],
  ["inherited", "Fortune mainly inherited"],
  ["first-generation", "Founder generation"],
  ["second-generation", "Children of the founder"],
  ["third-generation-plus", "Grandchildren of the founder or later"],
  ["female-founder", "Fortune founded by a woman"],
  ["listed-company", "Main asset is a publicly listed company"],
  ["private-company", "Main asset is a privately held company"],
];

/** Builds the Excel template: instructions, a Data sheet with checks and dropdowns, and reference lists. */
export async function buildTemplate(): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Private Wealth Institute";
  const ink = { argb: "FF0A0A0A" }, paper = { argb: "FFF6F2EA" }, red = { argb: "FFC42F33" };

  const how = wb.addWorksheet("How to use", { properties: { tabColor: red } });
  how.columns = [{ width: 4 }, { width: 110 }];
  const lines: [string, boolean?][] = [
    ["Private Wealth Institute — index data template", true],
    [""],
    ["1. Fill in the “Data” sheet: one row per fortune per year. Delete the three grey example rows first.", false],
    ["2. Required: year, country and net worth in euros (billions, e.g. 12.4 means €12.4 billion).", false],
    ["   If your figures are in € millions or in euros, that's fine — you can choose the unit when uploading.", false],
    ["3. Optional: name (never shown publicly), industry, birth year (sets Gen X / Gen Y / Gen Z automatically), gender, region, tags.", false],
    ["4. Region is filled in from the country automatically. Only fill it in to override.", false],
    ["5. Tags: write any themes, separated by semicolons — e.g.  family-business; second-generation.  See the “Lists” sheet for suggestions.", false],
    ["   You can also add your own Yes/No columns (e.g. “Family business?”) — the upload lets you turn them into tags.", false],
    ["6. Upload in Admin → Research → Data. Uploading a year that already exists replaces that year.", false],
    ["7. Several years can go in one file, or one file per year.", false],
  ];
  lines.forEach(([t, bold], i) => { const c = how.getCell(i + 2, 2); c.value = t; c.font = { name: "Arial", size: bold ? 16 : 11, bold: !!bold, color: ink }; c.alignment = { wrapText: true, vertical: "top" }; });

  const data = wb.addWorksheet("Data", { views: [{ state: "frozen", ySplit: 1 }] });
  const cols = [
    ["year", 8], ["name", 28], ["country", 18], ["industry", 22], ["net_worth_eur_bn", 18], ["birth_year", 12], ["gender", 10], ["region", 20], ["tags", 44],
  ] as const;
  data.columns = cols.map(([header, width]) => ({ header, key: header, width }));
  const head = data.getRow(1);
  head.font = { name: "Arial", bold: true, color: { argb: "FFFFFFFF" } };
  head.fill = { type: "pattern", pattern: "solid", fgColor: ink };
  head.height = 22;
  [
    [2025, "Example Person A (delete)", "Spain", "Retail", 12.4, 1958, "female", "", "family-business; second-generation"],
    [2025, "Example Person B (delete)", "Singapore", "Technology", 3.1, 1999, "male", "", "self-made"],
    [2024, "Example Person A (delete)", "Spain", "Retail", 11.2, 1958, "female", "", "family-business; second-generation"],
  ].forEach((r) => { const row = data.addRow(r); row.font = { name: "Arial", italic: true, color: { argb: "FF8C877F" } }; });
  for (let r = 2; r <= 5000; r++) {
    data.getCell(`A${r}`).dataValidation = { type: "whole", operator: "between", formulae: [1900, 2100], allowBlank: true, showErrorMessage: true, errorTitle: "Year", error: "Enter a year such as 2025." };
    data.getCell(`E${r}`).dataValidation = { type: "decimal", operator: "greaterThanOrEqual", formulae: [0], allowBlank: true, showErrorMessage: true, errorTitle: "Net worth", error: "Enter a number in € billions, e.g. 12.4" };
    data.getCell(`F${r}`).dataValidation = { type: "whole", operator: "between", formulae: [1880, 2025], allowBlank: true, showErrorMessage: true, errorTitle: "Birth year", error: "Enter a year such as 1972, or leave empty." };
    data.getCell(`G${r}`).dataValidation = { type: "list", formulae: ['"female,male"'], allowBlank: true };
    data.getCell(`H${r}`).dataValidation = { type: "list", formulae: [`Lists!$A$2:$A$${REGIONS.length + 1}`], allowBlank: true };
    data.getCell(`E${r}`).numFmt = "0.0";
  }

  const lists = wb.addWorksheet("Lists");
  lists.columns = [{ header: "Regions", width: 24 }, { header: "", width: 3 }, { header: "Generations (from birth year)", width: 34 }, { header: "", width: 3 }, { header: "Suggested tags", width: 26 }, { header: "Meaning", width: 52 }];
  lists.getRow(1).font = { name: "Arial", bold: true };
  lists.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: paper };
  REGIONS.forEach((r, i) => (lists.getCell(i + 2, 1).value = r));
  [["Silent Generation", "born 1945 or earlier"], ["Baby Boomers", "1946–1964"], ["Gen X", "1965–1980"], ["Gen Y (Millennials)", "1981–1996"], ["Gen Z", "1997–2012"]]
    .forEach(([g, y], i) => (lists.getCell(i + 2, 3).value = `${g} — ${y}`));
  SUGGESTED_TAGS.forEach(([t, m], i) => { lists.getCell(i + 2, 5).value = t; lists.getCell(i + 2, 6).value = m; });

  return Buffer.from(await wb.xlsx.writeBuffer());
}
