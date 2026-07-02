import { AppEvent } from '@blacknails/shared';

export interface IEventRepository {
  save(event: AppEvent): Promise<void>;
  getUnpublished(): Promise<AppEvent[]>;
  markAsPublished(eventId: string): Promise<void>;
}
