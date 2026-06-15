import { auth } from '@/auth'

export default auth((req) => {
  const isAuthed = !!req.auth && !req.auth.error
  const { pathname } = req.nextUrl

  const isLoginPage = pathname === '/'
  const isAuthApi = pathname.startsWith('/api/auth')
  const isApiRoute = pathname.startsWith('/api') || pathname.startsWith('/trpc')

  if (!isAuthed && !isLoginPage && !isAuthApi) {
    if (isApiRoute) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: {
          'content-type': 'application/json',
        },
      })
    }

    return Response.redirect(new URL('/', req.nextUrl))
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
