import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher(['/sign-in(.*)', '/sign-up(.*)']);

// Check if we have a valid key (not placeholder or empty)
const hasValidKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.includes('PLACEHOLDER');

export default hasValidKey 
  ? clerkMiddleware(async (auth, request) => {
      if (!isPublicRoute(request)) {
        await auth.protect();
      }
    })
  : () => {
      // Mock middleware if keys are missing so the dev server doesn't crash
      console.warn('Clerk keys are placeholders! Bypassing authentication.');
      return NextResponse.next();
    };

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
