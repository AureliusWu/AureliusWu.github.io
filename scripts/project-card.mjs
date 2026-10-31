// Shared by the synchronizer and its offline regression tests.
export function updateCardVersion(card, version, repo) {
  if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(version)) {
    throw new Error(`index version is not semantic: ${repo}`);
  }
  const pattern = /<span\b([^>]*\bclass="[^"]*\btype\b[^"]*"[^>]*)>[\s\S]*?<\/span>/i;
  if (!pattern.test(card)) throw new Error(`index type span not found: ${repo}`);
  return card.replace(pattern, (_all, attrs) => `<span${attrs}>v${version}</span>`);
}
