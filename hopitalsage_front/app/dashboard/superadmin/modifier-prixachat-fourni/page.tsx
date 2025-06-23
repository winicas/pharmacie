'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'

interface Fabricant {
  id: number
  nom: string
}

interface Produit {
  id: number
  nom: string
  prix_achat: number
  devise: string
  nombre_plaquettes_par_boite: number
}

interface Message {
  text: string
  type: 'success' | 'error'
}

const Page = () => {
  const [fabricants, setFabricants] = useState<Fabricant[]>([])
  const [produits, setProduits] = useState<Produit[]>([])
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [modifications, setModifications] = useState<Record<number, { prix_achat?: number; nombre_plaquettes_par_boite?: number }>>({})
  const [fabricantSelectionne, setFabricantSelectionne] = useState<string | null>(null)
  const [message, setMessage] = useState<Message | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  const itemsPerPage = 5

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    setAccessToken(token)

    if (token) {
      fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/fabricants/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
        .then(res => res.json())
        .then(data => setFabricants(data))
        .catch(err => console.error('Erreur chargement fabricants', err))
    }
  }, [])

  const chargerProduits = (fabricantId: string, page = 1) => {
    if (!accessToken) return

    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/produits/${fabricantId}/?page=${page}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    })
      .then(res => res.json())
      .then(data => {
        setProduits(data.results || [])
        setCurrentPage(page)
        setModifications({})
      })
      .catch(err => console.error('Erreur chargement produits', err))
  }

  const handleInputChange = (produitId: number, field: 'prix_achat' | 'nombre_plaquettes_par_boite', value: number) => {
    setModifications(prev => ({
      ...prev,
      [produitId]: {
        ...prev[produitId],
        [field]: value
      }
    }))
  }

  const sauvegarderPrix = () => {
    if (!accessToken) return

    Object.entries(modifications).forEach(([produitId, updates]) => {
      const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/produit/${produitId}/modifier/`

      fetch(url, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })
        .then(res => {
          if (!res.ok) throw new Error(`Erreur ${res.status}`)
          return res.json()
        })
        .then(() => {
          const produit = produits.find(p => p.id === parseInt(produitId))

          const messages: string[] = []

          if (updates.prix_achat !== undefined) {
            messages.push(
              `Prix d'achat : <b>${produit?.prix_achat} ${produit?.devise}</b> → <b>${updates.prix_achat} ${produit?.devise}</b>`
            )
          }

          if (updates.nombre_plaquettes_par_boite !== undefined) {
            messages.push(
              `Nombre de plaquettes par boîte : <b>${produit?.nombre_plaquettes_par_boite}</b> → <b>${updates.nombre_plaquettes_par_boite}</b>`
            )
          }

          setMessage({
            text: `✅ Le produit <b>"${produit?.nom}"</b> a été mis à jour :<br />${messages.join('<br />')}`,
            type: 'success'
          })

          setTimeout(() => setMessage(null), 8000)
        })
        .catch(err => {
          console.error(`Erreur mise à jour produit ${produitId}:`, err)
          setMessage({
            text: `❌ Erreur lors de la mise à jour du produit <b>${produitId}</b>.`,
            type: 'error'
          })
          setTimeout(() => setMessage(null), 8000)
        })
    })

    if (fabricantSelectionne) {
      setTimeout(() => chargerProduits(fabricantSelectionne, currentPage), 1000)
    }
  }

  const goToNextPage = () => {
    if (fabricantSelectionne) {
      chargerProduits(fabricantSelectionne, currentPage + 1)
    }
  }

  const goToPrevPage = () => {
    if (currentPage > 1 && fabricantSelectionne) {
      chargerProduits(fabricantSelectionne, currentPage - 1)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <Link href="/dashboard/superadmin" className="text-blue-600 hover:underline font-medium">
            ← Retour à l'accueil
          </Link>
          <h1 className="text-xl font-bold">Modifier les prix d'achat</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Message global */}
        {message && (
          <div
            className={`mb-6 p-3 rounded border ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800 border-green-200'
                : 'bg-red-50 text-red-800 border-red-200'
            }`}
            dangerouslySetInnerHTML={{ __html: message.text }}
          />
        )}

        {/* Sélection fabricant */}
        <div className="mb-6">
          <label htmlFor="fabricant-select" className="block font-medium mb-2">
            Sélectionner un fabricant :
          </label>
          <select
            id="fabricant-select"
            onChange={(e) => {
              const id = e.target.value
              setFabricantSelectionne(id)
              chargerProduits(id)
            }}
            className="w-full border border-gray-300 rounded px-3 py-2"
          >
            <option value="">Sélectionner un fabricant</option>
            {fabricants.map((fab) => (
              <option key={fab.id} value={fab.id}>
                {fab.nom}
              </option>
            ))}
          </select>
        </div>

        {/* Liste des produits */}
        <div className="space-y-4">
          {produits.length === 0 ? (
            <p className="text-gray-500 italic">Aucun produit trouvé.</p>
          ) : (
            produits.map((produit) => (
              <div key={produit.id} className="bg-white p-4 rounded shadow hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-lg">{produit.nom}</h3>

                <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600">Prix actuel</label>
                    <input
                      type="number"
                      step="0.01"
                      defaultValue={produit.prix_achat}
                      onChange={(e) => handleInputChange(produit.id, 'prix_achat', parseFloat(e.target.value))}
                      className="border w-full px-3 py-2 rounded mt-1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-600">Plaquettes par boîte</label>
                    <input
                      type="number"
                      min="1"
                      defaultValue={produit.nombre_plaquettes_par_boite}
                      onChange={(e) => handleInputChange(produit.id, 'nombre_plaquettes_par_boite', parseInt(e.target.value))}
                      className="border w-full px-3 py-2 rounded mt-1"
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {produits.length > 0 && (
          <div className="mt-6 flex justify-between items-center">
            <button
              onClick={goToPrevPage}
              disabled={currentPage === 1}
              className={`px-4 py-2 rounded ${
                currentPage === 1
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              Précédent
            </button>
            <span className="text-gray-600">Page {currentPage}</span>
            <button
              onClick={goToNextPage}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
            >
              Suivant
            </button>
          </div>
        )}

        {/* Sauvegarder */}
        {produits.length > 0 && (
          <div className="mt-6">
            <button
              onClick={sauvegarderPrix}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded"
            >
              Sauvegarder les modifications
            </button>
          </div>
        )}
      </main>
    </div>
  )
}

export default Page