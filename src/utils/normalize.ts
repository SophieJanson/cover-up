export const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .replace(/['’\.]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

export const isLooseMatch = (input: string, target: string) => {
  const a = normalizeText(input);
  const b = normalizeText(target);
  if (!a) return false;
  return a === b || b.includes(a) || a.includes(b);
};

export const splitSongs = (value: string) =>
  value
    .split(/[\n,;/]+/)
    .map((part) => part.trim())
    .filter(Boolean);
