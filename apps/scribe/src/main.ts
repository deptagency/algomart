import { ToadScheduler, SimpleIntervalJob, Task } from 'toad-scheduler'

const scheduler = new ToadScheduler()

const task = new Task('simple task', () => {
  console.log('hello world')
})
const job = new SimpleIntervalJob({ seconds: 5 }, task)

scheduler.addSimpleIntervalJob(job)

// ...when stopping your app
//scheduler.stop()
