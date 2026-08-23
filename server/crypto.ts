import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: string,
  keylen: number
) => Promise<Buffer>;

const KEY_LENGTH = 64;
const SALT_BYTES = 16;

/**
 * Hashes a password as `<hash>.<salt>`, both hex — 161 characters total.
 *
 * This shape is load-bearing. Anything that writes a password (registration,
 * password change, the seed script, a manual SQL fix) must produce exactly it,
 * or `comparePasswords` fails and the user simply cannot log in, with no error
 * to explain why.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES).toString("hex");
  const buf = await scryptAsync(password, salt, KEY_LENGTH);
  return `${buf.toString("hex")}.${salt}`;
}

/**
 * Constant-time comparison of a supplied password against a stored hash.
 *
 * Returns false for anything malformed rather than throwing. The previous
 * copies of this function called timingSafeEqual directly, which throws when
 * the buffers differ in length — so a truncated or non-scrypt value in the
 * password column crashed the request instead of failing the login.
 */
export async function comparePasswords(
  supplied: string,
  stored: string | null | undefined
): Promise<boolean> {
  if (!stored) return false;

  const [hashed, salt] = stored.split(".");
  if (!hashed || !salt) return false;

  let hashedBuf: Buffer;
  try {
    hashedBuf = Buffer.from(hashed, "hex");
  } catch {
    return false;
  }
  if (hashedBuf.length !== KEY_LENGTH) return false;

  const suppliedBuf = await scryptAsync(supplied, salt, KEY_LENGTH);
  return timingSafeEqual(hashedBuf, suppliedBuf);
}
