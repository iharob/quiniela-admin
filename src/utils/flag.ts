// Turn a 2-letter ISO country code (as carried by the results payload, e.g.
// "mx", "ar") into its Unicode flag emoji by mapping each letter to its
// regional-indicator symbol. This avoids hosting the per-country flag images
// the PDF embeds. Codes that aren't two ASCII letters (or unknown teams) get
// no flag — the caller still shows the team name.
export function flagEmoji(country: string): string {
  const code = country.trim().toUpperCase()
  if (!/^[A-Z]{2}$/.test(code)) return ''
  const base = 0x1f1e6 // regional indicator 'A'
  const a = base + (code.charCodeAt(0) - 65)
  const b = base + (code.charCodeAt(1) - 65)
  return String.fromCodePoint(a, b)
}
