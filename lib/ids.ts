import { randomBytes } from "crypto";

export function prefixedId(prefix: string) {
  return `${prefix}_${randomBytes(8).toString("hex")}`;
}

export function makeSlug(name: string) {
  const latin = name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 36);
  const suffix = randomBytes(3).toString("hex");
  return `${latin || "org"}-${suffix}`;
}
