'use client'

import { useEffect, useState } from 'react'
import PharmacieLayout from '@/app/dashboard/directeur/layout'
import Image from 'next/image'

interface Lot {
  id: number
  numero_lot: string
  nom_medicament: string
  date_peremption: string
  quantite: number
}

function addDays(days: number) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString().split('T')[0]
}

export default function PageLotsExpire() {
  const [lots, setLots] = useState<Lot[]>([])
  const [periode, setPeriode] = useState<number>(60) // 2 mois par défaut

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    const dateMax = addDays(periode)

    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/lots/?date_max=${dateMax}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => setLots(data))
      .catch((err) => console.error('Erreur lors du chargement des lots', err))
  }, [periode])

  const getUrgencyColor = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = Math.floor((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (diff <= 7) return 'border-red-500'
    if (diff <= 30) return 'border-orange-400'
    return 'border-yellow-300'
  }

  return (
    <PharmacieLayout>
      <div className="p-6">
        <h1 className="text-3xl font-extrabold text-red-700 mb-6 flex items-center gap-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="animate-pulse h-8 w-8 text-red-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 9v2m0 4h.01M4.93 4.93l14.14 14.14M12 12c4.418 0 8 3.582 8 8s-3.582 8-8 8-8-3.582-8-8 3.582-8 8-8z" />
          </svg>
          Produits proches de péremption
        </h1>

        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setPeriode(7)}
            className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold px-4 py-2 rounded shadow"
          >
            Dans une semaine
          </button>
          <button
            onClick={() => setPeriode(30)}
            className="bg-orange-400 hover:bg-orange-500 text-black font-semibold px-4 py-2 rounded shadow"
          >
            Dans un mois
          </button>
          <button
            onClick={() => setPeriode(60)}
            className="bg-red-500 hover:bg-red-600 text-white font-semibold px-4 py-2 rounded shadow"
          >
            Dans deux mois
          </button>
        </div>

        {lots.length === 0 ? (
          <div className="text-gray-600 text-center mt-16">
            <Image
              src="/warning.png"
              alt="No products"
              width={120}
              height={120}
              className="mx-auto mb-4 opacity-60"
            />
            <p className="text-lg">Aucun médicament proche de péremption.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lots.map((lot) => (
              <div
                key={lot.id}
                className={`border-4 ${getUrgencyColor(lot.date_peremption)} rounded-xl p-4 shadow-lg bg-white hover:scale-[1.01] transition duration-200`}
              >
                <h2 className="text-lg font-bold text-gray-800 mb-2">{lot.nom_medicament}</h2>
                <p className="text-sm text-gray-600 mb-1">
                  <span className="font-semibold">Lot :</span> {lot.numero_lot}
                </p>
                <p className="text-sm text-gray-600 mb-1">
                  <span className="font-semibold">Quantité :</span> {lot.quantite}
                </p>
                <p className="text-sm font-semibold text-red-700">
                  <span className="mr-1">🕒 Péremption :</span>
                  {new Date(lot.date_peremption).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </PharmacieLayout>
  )
}
