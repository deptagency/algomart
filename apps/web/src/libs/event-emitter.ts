export interface Subscriber {
  (...args: any[]): void
}

export class EventEmitter {
  private _subscribers: { [event: string]: Subscriber[] } = {}

  public subscribe(event: string, function_: Subscriber) {
    if (!this._subscribers[event]) {
      this._subscribers[event] = []
    }
    this._subscribers[event].push(function_)
    return () => {
      this.unsubscribe(event, function_)
    }
  }

  public unsubscribe(event: string, function_: Subscriber) {
    if (this._subscribers[event]) {
      this._subscribers[event] = this._subscribers[event].filter(
        (subscriber) => subscriber !== function_
      )
    }
  }

  public emit(event: string, ...args: unknown[]) {
    if (this._subscribers[event]) {
      for (const subscriber of this._subscribers[event]) {
        setTimeout(() => {
          subscriber(...args)
        }, 0)
      }
    }
  }
}
