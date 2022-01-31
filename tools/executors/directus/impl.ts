import { ExecutorContext } from '@nrwl/devkit'
import { spawn } from 'node:child_process'
import { join } from 'node:path'

interface DirectusExecutorOptions {
  action:
    | 'start'
    | 'init'
    | 'database'
    | 'users'
    | 'roles'
    | 'count'
    | 'bootstrap'
    | 'schema'
  args: string[]
}

async function runAction(
  options: DirectusExecutorOptions,
  context: ExecutorContext
) {
  return new Promise((resolve, reject) => {
    const directus = spawn(
      'npx',
      ['directus', options.action, ...options.args],
      {
        cwd: join(
          context.cwd,
          context.workspace.projects[context.projectName].root
        ),
        stdio: 'inherit',
      }
    )

    process.on('SIGTERM', () => {
      console.log('sigterm')
      directus.kill()
      process.exit(128 + 15)
    })

    process.on('exit', (code) => {
      console.log('exit')
      process.exit(code)
    })

    directus.on('error', (error) => {
      reject(error)
    })

    directus.on('exit', (code) => {
      if (code !== 0) {
        reject(code)
      }

      resolve(true)
    })
  })
}

export default async function directusExecutor(
  options: DirectusExecutorOptions,
  context: ExecutorContext
) {
  await runAction(options, context)
}
