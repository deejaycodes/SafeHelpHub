import * as crypto from 'crypto';

const algorithm = 'aes-256-ctr';
const secretKey = crypto.createHash('sha256').update(String(process.env.ENCRYPTION_KEY || 'mysecretkey')).digest('base64').substr(0, 32); // Ensure 32-byte key
const iv = Buffer.alloc(16, 0);  // Initialization vector must be 16 bytes

export function encrypt(text: string): string {
  const cipher = crypto.createCipheriv(algorithm, secretKey, iv);
  const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
  return encrypted.toString('hex');
}

export function decrypt(text: string): string {
  const decipher = crypto.createDecipheriv(algorithm, secretKey, iv);
  const decrypted = Buffer.concat([decipher.update(Buffer.from(text, 'hex')), decipher.final()]);
  return decrypted.toString();
}
