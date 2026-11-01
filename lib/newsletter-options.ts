/** Newsletter choices, shared by the sign-up box (browser) and the server. */
export const FREQUENCIES = [
  { id: "weekly", label: "Weekly", hint: "Every Monday" },
  { id: "monthly", label: "Monthly", hint: "First of the month" },
  { id: "quarterly", label: "Quarterly", hint: "Four times a year" },
  { id: "annually", label: "Annually", hint: "Mid-December" },
] as const;
export type Frequency = (typeof FREQUENCIES)[number]["id"];

export const TOPICS = [
  { id: "insights", label: "Insights & research", hint: "New articles and index updates" },
  { id: "events", label: "Upcoming events", hint: "Dates, programmes and how to register" },
] as const;
export type Topic = (typeof TOPICS)[number]["id"];

export const frequencyLabel = (f: string) => FREQUENCIES.find((x) => x.id === f)?.label ?? f;
export const topicLabel = (t: string) => TOPICS.find((x) => x.id === t)?.label ?? t;
