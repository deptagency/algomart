import { NextRequest, NextResponse } from 'next/server'

import { urls } from './utils/urls'

const ACCESS_CODE = 'AlgoFan2022'

export function middleware(request: NextRequest) {
  if (
    request.nextUrl.pathname.startsWith('/_next/') ||
    request.nextUrl.pathname === '/api/config' ||
    request.nextUrl.pathname === '/api/flush-cache-custom' ||
    request.nextUrl.pathname === urls.betaAccess ||
    process.env.NODE_ENV === 'development'
  ) {
    // Ignore internal Next.js routes, /beta-access, /api/config, and development
    return
  }

  if (request.cookies.get('algoFanSettings') !== ACCESS_CODE) {
    const betaAccessPath = `/${request.nextUrl.locale}${urls.betaAccess}`
    const redirect = encodeURIComponent(
      request.nextUrl.pathname + request.nextUrl.search
    )
    const url = new URL(betaAccessPath, request.nextUrl.origin)
    url.searchParams.set('redirect', redirect)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}
