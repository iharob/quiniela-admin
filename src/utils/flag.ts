// Turn a country/team code (as carried by the results payload) into its Unicode
// flag emoji, avoiding the per-country flag images the PDF embeds. The common
// case is a 2-letter ISO code (e.g. "mx", "ar"), mapped to its regional-
// indicator pair. The UK home nations are special: the data carries them as
// 3-letter FIFA codes (World Cup: "SCO", "ENG") or ISO-3166-2 subdivision codes
// (Euro: "GB-SCT", "GB-ENG") — neither is a 2-letter ISO code, so they get the
// dedicated subdivision flag emoji instead. Anything unrecognised yields no
// flag — the caller still shows the team name.

// 🏴 (U+1F3F4) followed by a tag sequence of the lowercased ISO-3166-2
// subdivision id and the cancel tag (U+E007F) — the encoding Unicode uses for
// the England/Scotland/Wales flags.
function subdivisionFlag(id: string): string {
  const TAG_BASE = 0xe0000
  return String.fromCodePoint(
    0x1f3f4,
    ...[...id].map((c) => TAG_BASE + c.charCodeAt(0)),
    0xe007f,
  )
}

const SUBDIVISION_FLAGS: Readonly<Record<string, string>> = {
  SCO: subdivisionFlag('gbsct'),
  'GB-SCT': subdivisionFlag('gbsct'),
  ENG: subdivisionFlag('gbeng'),
  'GB-ENG': subdivisionFlag('gbeng'),
  WAL: subdivisionFlag('gbwls'),
  'GB-WLS': subdivisionFlag('gbwls'),
}

export function flagEmoji(country: string): string {
  const code = country.trim().toUpperCase()
  if (/^[A-Z]{2}$/.test(code)) {
    const base = 0x1f1e6 // regional indicator 'A'
    const a = base + (code.charCodeAt(0) - 65)
    const b = base + (code.charCodeAt(1) - 65)
    return String.fromCodePoint(a, b)
  }
  return SUBDIVISION_FLAGS[code] ?? ''
}
