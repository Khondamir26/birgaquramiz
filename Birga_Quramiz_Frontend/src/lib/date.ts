export const UZ_MONTHS = [
  "yanvar","fevral","mart","aprel","may","iyun",
  "iyul","avgust","sentabr","oktabr","noyabr","dekabr",
];

export function formatUzDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getDate()} ${UZ_MONTHS[d.getMonth()]}`;
}
