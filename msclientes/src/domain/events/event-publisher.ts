import { EventEmitter2 } from 'eventemitter2';
import { DomainEvent } from './customer-events';

export interface IEventPublisher {
  publish(event: DomainEvent): void;
  subscribe(eventName: string, handler: (event: DomainEvent) => void): void;
}

export class EventPublisher implements IEventPublisher {
  private emitter: EventEmitter2;

  constructor() {
    this.emitter = new EventEmitter2({
      wildcard: true,
      delimiter: '.',
      newListener: false,
      maxListeners: 100,
    });
  }

  publish(event: DomainEvent): void {
    this.emitter.emit(event.eventName, event);
    this.emitter.emit('*', event);
  }

  subscribe(eventName: string, handler: (event: DomainEvent) => void): void {
    this.emitter.on(eventName, handler);
  }

  unsubscribe(eventName: string, handler: (event: DomainEvent) => void): void {
    this.emitter.off(eventName, handler);
  }
}
