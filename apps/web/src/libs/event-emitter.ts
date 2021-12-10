export interface Subscriber {
  (...args: any[]): void
}

export class EventEmitter {
  private subscribers: { [event: string]: Subscriber[] } = {}

  public subscribe(event: string, subscriber: Subscriber) {
    if (!this.subscribers[event]) {
      this.subscribers[event] = []
    }
    this.subscribers[event].push(subscriber)
    return () => {
      this.unsubscribe(event, subscriber)
    }
  }

  public unsubscribe(event: string, subscriber: Subscriber) {
    if (this.subscribers[event]) {
      this.subscribers[event] = this.subscribers[event].filter(
        (s) => s !== subscriber
      )
    }
  }

  public emit(event: string, ...args: unknown[]) {
    if (this.subscribers[event]) {
      for (const subscriber of this.subscribers[event]) {
        setTimeout(() => {
          subscriber(...args)
        }, 0)
      }
    }
  }
}
