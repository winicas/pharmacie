
import '../styles/globals.css'; // Chemin relatif corrigé

export const metadata = {
  title: 'HopitalSage',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  )
}
