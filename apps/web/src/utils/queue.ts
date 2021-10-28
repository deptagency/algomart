export class Queue {
  active = 0
  resolvers: ((value: unknown) => void)[] = []

  constructor(private readonly concurrency = 5) {}

  async enqueue<TResult>(func: () => Promise<TResult>): Promise<TResult> {
    this.active += 1
    if (this.active > this.concurrency) {
      await new Promise((resolve) => {
        this.resolvers.push(resolve)
      })
    }

    try {
      return await func()
    } finally {
      this.active -= 1
      if (this.resolvers.length > 0) {
        const resolve = this.resolvers.shift()
        if (resolve) {
          resolve(null)
        }
      }
    }
  }
}
