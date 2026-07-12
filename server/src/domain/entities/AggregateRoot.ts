import { AppEvent } from '@blacknails/shared';

export abstract class AggregateRoot {
  private domainEvents: AppEvent[] = [];

  protected addDomainEvent(event: AppEvent): void {
    this.domainEvents.push(event);
  }

  public recordDomainEvent(event: AppEvent): void {
    this.addDomainEvent(event);
  }

  public getDomainEvents(): AppEvent[] {
    return [...this.domainEvents];
  }

  public clearDomainEvents(): void {
    this.domainEvents = [];
  }
}
