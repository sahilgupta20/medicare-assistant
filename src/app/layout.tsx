import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'MediCare Assistant - Medication Reminders for Seniors',
  description: 'Simple, accessible medication management designed specifically for seniors and their families.',
  keywords: ['medication', 'seniors', 'healthcare', 'accessibility', 'reminders'],
  authors: [{ name: 'Your Name' }],
  manifest: '/manifest.json',
  icons: {
    icon: '/icon-192.png',
    apple: '/icon-192.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'MediCare Assistant',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    siteName: 'MediCare Assistant',
    title: 'MediCare Assistant - Medication Reminders for Seniors',
    description: 'Simple, accessible medication management designed specifically for seniors and their families.',
  },
  twitter: {
    card: 'summary',
    title: 'MediCare Assistant - Medication Reminders for Seniors',
    description: 'Simple, accessible medication management designed specifically for seniors and their families.',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="theme-color" content="#e11d48" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="MediCare" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="icon" href="/icon-192.png" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className={`${inter.className} bg-gray-50 min-h-screen`}>
        <div className="min-h-screen flex flex-col">
          <main className="flex-1">
            {children}
          </main>
        </div>
        
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(registration) {
                      console.log('✅ SW registered successfully:', registration.scope);
                    })
                    .catch(function(error) {
                      console.log('❌ SW registration failed:', error);
                    });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  )
}