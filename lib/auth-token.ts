import crypto from "crypto";

const SECRET = process.env.AUTH_SECRET || "super-secret-change-this";
const SESSION_DURATION = 1000 * 60 * 60 * 8; // 8 HOURS

/* =========================
   CREATE SIGNED TOKEN
========================= */
export function createSignedToken(payload: object) {
  const data = JSON.stringify(payload);

  const signature = crypto
    .createHmac("sha256", SECRET)
    .update(data)
    .digest("hex");

  const token =
    Buffer.from(data).toString("base64") + "." + signature;

  return token;
}

/* =========================
   VERIFY SIGNED TOKEN
========================= */
export function verifySignedToken(token: string) {
  try {
    const [encoded, signature] = token.split(".");

    if (!encoded || !signature) return null;

    const data = Buffer.from(encoded, "base64").toString();

    const expectedSignature = crypto
      .createHmac("sha256", SECRET)
      .update(data)
      .digest("hex");

    if (signature !== expectedSignature) {
      return null;
    }

    const payload = JSON.parse(data);

    /* =========================
       SESSION EXPIRY CHECK
    ========================= */

    if (!payload.time) return null;

    if (Date.now() - payload.time > SESSION_DURATION) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
