import { HeadContent, Scripts, createRootRouteWithContext } from '@tanstack/react-router'
import type { QueryClient } from '@tanstack/react-query'

import Header from '../components/Header'
import { Footer } from '../components/layout/Footer'

import '../styles/variables.css'
import '../styles/globals.css'

// Define the router context interface
export interface RouterContext {
  queryClient: QueryClient
}

import { NotFound } from '../components/NotFound'

export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: "Ansyar's Portfolio",
      },
    ],
    links: [],
  }),

  shellComponent: RootDocument,
  notFoundComponent: NotFound,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
        {/* Preconnect to font origins to speed up connection establishment */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* Load font stylesheet with display swap for non-blocking render */}
        <link 
          href="https://fonts.googleapis.com/css2?family=Ubuntu+Mono:wght@400;700&display=swap" 
          rel="stylesheet" 
        />
      </head>
      {/* suppressHydrationWarning prevents console errors from browser extensions (like Grammarly) 
          that inject attributes into the DOM before React hydrates */}
      <body suppressHydrationWarning>
        <div className="flex min-h-screen flex-col">
          <Header />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
        </div>
        <Scripts />
      </body>
    </html>
  )
}
