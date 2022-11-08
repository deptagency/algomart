import { stringify } from 'csv-stringify'
import _ from 'lodash'
import { getOutputFilename } from './utils.js'
import { toArray } from '@directus/shared/utils'

export class Report {
  constructor(key, schema) {
    this.results = []
    this.error = false
    this.error_messages = []
    this.processed = 0
    this.key = key
    this.schema = schema
  }
}

export async function processReportResults(
  report,
  file,
  fileService,
  importService
) {
  try {
    const Stream = require('stream')
    let s = new Stream.Readable()
    stringify(
      report.results,
      {
        header: true,
      },
      async function (err, output) {
        if (err) {
          throw err
        } else {
          s.push(output)
          s.push(null)

          console.log('processReportResults: UPLOADING RESULTS...')
          const fileKey = await fileService.uploadOne(s, {
            title: 'IMPORT RESULTS',
            type: 'text/csv',
            filename_download: getOutputFilename(file.filename_download),
            storage: toArray(process.env.STORAGE_LOCATIONS)[0],
          })
          console.log('processReportResults: created file: ', fileKey)

          console.log('processReportResults: FINAL UPDATE...')
          await importService.updateOne(report.key, {
            import_results: report.results,
            status: 'imported',
            has_errors: report.error,
            distinct_errors: JSON.stringify(report.error_messages),
            results_file: fileKey,
            num_processed: report.processed,
          })
        }
      }
    )
  } catch (error) {
    throw new Error(error.message)
  }
}

export function reportError(report, error_message, row) {
  console.log('ERROR REPORTED: ', error_message)
  report.error = true
  if (!_.includes(report.error_messages, error_message)) {
    report.error_messages.push(error_message)
  }
  report.results.push({
    ...row,
    IMPORT_RESULT: `IMPORT ERROR: ${error_message}`,
  })
}
