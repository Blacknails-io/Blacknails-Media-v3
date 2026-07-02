import crypto from 'crypto';
import { IPasswordHasher } from '../../../application/ports/out/IPasswordHasher.js';

export class PasswordHasher implements IPasswordHasher {
  private readonly iterations = 10000;
  private readonly keyLength = 64;
  private readonly digest = 'sha512';

  public async hash(password: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const salt = crypto.randomBytes(16).toString('hex');
      crypto.pbkdf2(password, salt, this.iterations, this.keyLength, this.digest, (err, derivedKey) => {
        if (err) return reject(err);
        resolve(`${salt}:${derivedKey.toString('hex')}`);
      });
    });
  }

  public async compare(password: string, hash: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const parts = hash.split(':');
      const salt = parts[0];
      const key = parts[1];

      if (!salt || !key) {
        return resolve(false);
      }

      crypto.pbkdf2(password, salt, this.iterations, this.keyLength, this.digest, (err, derivedKey) => {
        if (err) return reject(err);
        resolve(derivedKey.toString('hex') === key);
      });
    });
  }
}
