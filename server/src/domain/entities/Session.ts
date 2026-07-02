import { randomUUID } from 'crypto';
import { AggregateRoot } from './AggregateRoot.js';

export interface SessionProps {
  token?: string;
  userId: string;
  expiresAt: string;
}

export class Session extends AggregateRoot {
  public readonly token: string;
  public readonly userId: string;
  public readonly expiresAt: string;

  constructor(props: SessionProps) {
    super();
    this.token = props.token || randomUUID();
    this.userId = props.userId;
    this.expiresAt = props.expiresAt;
  }

  public isExpired(): boolean {
    return new Date().getTime() > new Date(this.expiresAt).getTime();
  }
}
