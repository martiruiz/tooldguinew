import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Tools · Agència Guinew',
  description: 'Plataforma interna de l\'Agència Guinew',
  icons: {
    icon: '/favicon.png',
    apple: '/favicon.png',
    shortcut: '/favicon.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ca">
      <body>
        {children}
      </body>
    </html>
  )
}
