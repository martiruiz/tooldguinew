import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'GUINEW TOOLS · Agència Guinew',
  description: 'Plataforma interna de l\'Agència Guinew',
  icons: {
    icon: '/logo-guinew.png',
    apple: '/logo-guinew.png',
    shortcut: '/logo-guinew.png',
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
