import { NextApiRequest, NextApiResponse } from 'next'

export default function notFoundHandler(
  request: NextApiRequest,
  response: NextApiResponse
) {
  response.status(404).json({
    statusCode: 404,
    error: 'Not Found',
    message: `${request.method} ${request.url} was not found`,
  })
}
