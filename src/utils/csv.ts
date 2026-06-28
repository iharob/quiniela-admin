// Minimal, dependency-free CSV helpers. Building a CSV on the client lets the
// admin pull contactable lists (e.g. participants who predicted but never paid)
// straight from data already loaded in the browser — no extra endpoint needed.

// Escape a single cell per RFC 4180: only fields containing a comma, quote, or
// newline need wrapping in double quotes, with inner quotes doubled.
function escapeCell(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
}

// Join a grid of already-stringified cells into CSV text. Rows are CRLF-separated
// as the spec recommends, which also keeps Excel happy.
export function toCsv(rows: readonly (readonly string[])[]): string {
  return rows.map((row) => row.map(escapeCell).join(',')).join('\r\n')
}

// Hand a CSV string to the browser as a file download, mirroring the blob trick
// used for the results PDF (ResultsPage). The leading UTF-8 BOM makes Excel read
// accented names correctly instead of mojibake.
export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob(['﻿', csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
