import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

const PREFIX = "enc:v1:";

function keyMaterial() {
  // TODO(phase-2): use a dedicated DATA_SOURCE_SECRET, rotated independently of NextAuth.
  const secret =
    process.env.DATA_SOURCE_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    "dev-only-do-not-use-in-production";
  return scryptSync(secret, "ai-business-doctor-ds", 32);
}

export function encryptSecret(plain: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", keyMaterial(), iv);
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}${Buffer.concat([iv, tag, encrypted]).toString("base64url")}`;
}

export function decryptSecret(payload: string) {
  if (!payload.startsWith(PREFIX)) return payload;
  const raw = Buffer.from(payload.slice(PREFIX.length), "base64url");
  const iv = raw.subarray(0, 12);
  const tag = raw.subarray(12, 28);
  const data = raw.subarray(28);
  const decipher = createDecipheriv("aes-256-gcm", keyMaterial(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}

export function sealConfig(config: Record<string, unknown>) {
  return encryptSecret(JSON.stringify(config));
}

export function readConfig(configJson: string | null | undefined): Record<string, unknown> {
  if (!configJson) return {};
  try {
    return JSON.parse(decryptSecret(configJson)) as Record<string, unknown>;
  } catch {
    return {};
  }
}
