'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import HeaderAdmin from '../HeaderAdmin' // ✅ Import du header

interface User {
  id: number
  username: string
  first_name: string
  last_name: string
  email: string
  photo: string | null
  role: string
}

export default function CreateFabricant() {
  const [nom, setNom] = useState('')
  const [pays, setPays] = useState('')
  const [success, setSuccess] = useState(false)
  const [userData, setUserData] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Récupération des données utilisateur depuis localStorage
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user')
      if (storedUser) {
        setUserData(JSON.parse(storedUser))
      }
    } catch (err) {
      console.error("Erreur lors de la lecture de l'utilisateur", err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Si pas d'utilisateur ou en cours de chargement
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p>Chargement...</p>
      </div>
    )
  }

  if (!userData) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-red-500">Impossible de charger les informations utilisateur</p>
      </div>
    )
  }

  // Gestion de la soumission du formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const accessToken = localStorage.getItem('accessToken')

    if (!accessToken) {
      console.error('Aucun token trouvé !')
      return
    }

    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/fabricants/`,
        {
          nom: nom,
          pays_origine: pays,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )

      setNom('')
      setPays('')
      setSuccess(true)
    } catch (error: any) {
      if (error.response && error.response.status === 401) {
        console.error('Non autorisé : Token invalide ou expiré')
      } else {
        console.error('Erreur de création fabricant', error)
      }
    }
  }

  return (
    <>
      {/* Header Admin */}
      <HeaderAdmin user={userData} />

      {/* Contenu principal */}
      <main className="p-6 bg-gray-100 min-h-screen">
        <div className="max-w-lg mx-auto bg-white p-6 rounded shadow">
          <h1 className="text-xl font-bold mb-4">Créer un fabricant</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Nom du fabricant"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              className="border p-2 w-full"
              required
            />
            <input
              type="text"
              placeholder="Pays d'origine"
              value={pays}
              onChange={(e) => setPays(e.target.value)}
              className="border p-2 w-full"
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
            >
              Enregistrer
            </button>
            {success && (
              <p className="text-green-500 mt-2">Fabricant créé avec succès !</p>
            )}
          </form>
        </div>
      </main>
    </>
  )
}