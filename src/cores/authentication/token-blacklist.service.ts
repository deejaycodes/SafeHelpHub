import { Injectable } from '@nestjs/common';

@Injectable()
export class TokenBlacklistService {
  private blacklisted = new Set<string>();

  add(token: string): void {
    this.blacklisted.add(token);
  }

  isBlacklisted(token: string): boolean {
    return this.blacklisted.has(token);
  }
}
