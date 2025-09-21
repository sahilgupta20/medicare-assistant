import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MediCare Assistant - Medication Reminders for Seniors",
  description:
    "Simple, accessible medication management designed specifically for seniors and their families.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1"
        />
        <meta name="theme-color" content="#e11d48" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="MediCare" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="icon" href="/icon-192.png" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body
        className={`${inter.className} bg-gray-50 min-h-screen`}
        suppressHydrationWarning={true}
      >
        <AuthProvider>
          <div className="min-h-screen flex flex-col">
            <main className="flex-1">{children}</main>
          </div>
        </AuthProvider>

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
              
              // DEBUG: Add session checker
              window.checkAuth = function() {
                const cookies = document.cookie;
                const hasNextAuth = cookies.includes('next-auth');
                const hasSessionToken = cookies.includes('session-token');
                console.log('🔍 NextAuth cookies found:', hasNextAuth);
                console.log('🔍 Session token found:', hasSessionToken);
                console.log('🔍 All cookies:', cookies);
                return hasNextAuth || hasSessionToken;
              };
              
              console.log('🔧 Debug function added: window.checkAuth()');
            `,
          }}
        />
      </body>
    </html>
  );
}
