/** 列表等场景的发布日期：2025.11.27 */
export function formatPubDateDots(date: Date): string {
  return date.toISOString().slice(0, 10).replaceAll('-', '.');
}
