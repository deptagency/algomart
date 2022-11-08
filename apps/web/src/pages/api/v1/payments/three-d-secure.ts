import { IdSchema, Payment } from '@algomart/schemas'
import { Type } from '@sinclair/typebox'
import { NextApiResponse } from 'next'

import createHandler, {
  NextApiRequestApp,
  validateSchemaMiddleware,
} from '@/api-middlewares'
import { AppConfig } from '@/config'
import { getTokenFromCookie } from '@/services/api/auth-service'
import { apiFetcher } from '@/utils/react-query'
import { urlFor, urls } from '@/utils/urls'

const handler = createHandler()

enum Status {
  success = 'success',
  failed = 'failure',
}

const schema = Type.Object({
  status: Type.Enum(Status),
  paymentId: IdSchema,
})

handler.get(
  validateSchemaMiddleware('query', schema),
  async (request: NextApiRequestApp, response: NextApiResponse) => {
    // Non-prod fix to redirect 127.0.0.1 to localhost
    // This happens due to Circle not allowing localhost in the 3DS callback URLs
    const [host, port] = request.headers.host?.split(':') ?? []
    if (!AppConfig.isProduction && host === '127.0.0.1') {
      return response.redirect(`http://localhost:${port}${request.url}`)
    }

    const externalPaymentId = request.query.paymentId as string
    const status = request.query.status as string
    const payment = await apiFetcher()
      .get<Payment>(
        urlFor(urls.api.payments.payment, { paymentId: externalPaymentId }),
        {
          bearerToken: getTokenFromCookie(request, response),
        }
      )
      .then((p) => p)
      .catch(() => null)

    if (payment && status === Status.success) {
      // 3DS verification was successful, a webhook will be triggered for the payment to update its status eventually
      // the pending_transfer page will start searching for a transfer associated with the payment
      response.redirect('/payments/pending_transfer?paymentId=' + payment.id)
    } else if (payment) {
      // If 3DS failed, we don't want to show the failure page just yet.
      // basically, if a 3ds circle payment fails with the specific error: three_d_secure_not_supported,
      // the server will have been smart enough to submit a second circle payment, so we just want to
      // go back to polling the payment status (the transfer won't exist yet).
      // In this in-between state, the error is not currently recorded in the payment row, so there's no way
      // for us to differentiate it from a different type of 3ds failure, so we always redirect back to the
      // pending page.
      response.redirect('/payments/pending?paymentId=' + payment.id)
    } else {
      response.status(404).send('')
    }
  }
)

export default handler
