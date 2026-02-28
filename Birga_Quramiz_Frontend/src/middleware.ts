import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const host = request.headers.get('host');

    // Define exactly what the primary domain is.
    const PRIMARY_DOMAIN = 'birga-quramiz.uz';

    // If the user visits the wrong domain, redirect them
    if (host === 'birgaquramiz.uz' || host === 'www.birgaquramiz.uz') {
        return NextResponse.redirect(`https://${PRIMARY_DOMAIN}${request.nextUrl.pathname}${request.nextUrl.search}`, 301);
    }

    // Continue normally for birga-quramiz.uz or localhost/run.app
    return NextResponse.next();
}

export const config = {
    // Run middleware on all paths except internal next/static and images
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};
