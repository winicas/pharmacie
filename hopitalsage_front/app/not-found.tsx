// app/not-found.tsx
import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <h2 className="text-3xl font-bold text-gray-800 mb-4">404 - Page Introuvable</h2>
      <Link 
        href="/" 
        className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-secondary transition-colors"
      >
        Retour à l'accueil
      </Link>
    </div>
  )
}