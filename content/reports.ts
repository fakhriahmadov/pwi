/**
 * REPORTS — PDF files go in /public/reports, then list them here.
 * gated: true = visitors leave their email before the download link appears.
 */
export type Report = { title: string; file: string; date: string; pages?: number; gated: boolean };
export const reports: Report[] = [];
