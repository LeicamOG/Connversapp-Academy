/**
 * Cryptographically secure random helpers.
 *
 * Uses the Web Crypto API (`crypto.getRandomValues`) which is available in
 * every modern browser. Never use `Math.random()` for anything
 * security-sensitive (passwords, secrets, tokens).
 */

const PASSWORD_ALPHABET =
    'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*';

/**
 * Generates a cryptographically-strong random password.
 *
 * Default length of 14 gives ~84 bits of entropy with the 64-char alphabet —
 * enough to resist offline brute force for a user-facing initial password
 * that should be rotated on first login.
 */
export function generateSecurePassword(length = 14): string {
    const values = new Uint32Array(length);
    crypto.getRandomValues(values);
    let out = '';
    for (let i = 0; i < length; i++) {
        out += PASSWORD_ALPHABET[values[i] % PASSWORD_ALPHABET.length];
    }
    return out;
}

/**
 * Generates a URL-safe random token encoded as base64url.
 *
 * 32 bytes = 256 bits of entropy, which is the standard for webhook secrets,
 * API keys, and session tokens.
 */
export function generateSecureToken(byteLength = 32): string {
    const bytes = new Uint8Array(byteLength);
    crypto.getRandomValues(bytes);
    // base64url encoding (no +, /, or = padding)
    let binary = '';
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}
