'use client'
import HeaderDirecteur from '@/components/HeaderDirecteur';
import SidebarDirecteur from '@/components/SidebarDirecteur';
import { useState } from 'react'
import axios from 'axios'
import { useRouter } from 'next/navigation'
interface Pharmacie {
  id: number;
  nom_pharm: string;
  adresse_pharm: string;
  telephone: string | null;
}

interface ProduitFabricant {
  id: number;
  nom: string;
  fabricant: number;
  fabricant_nom: string;
}

interface Requisition {
  id: number;
  produit_fabricant: number | null;
  nom_personnalise: string;
  nombre_demandes: number;
  nom_produit?: string;
  fabricant_nom?: string;
}

interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  profile_picture: string | null;
  role: string;
  pharmacie: number;
}
export default function CreerClient() {
  const [clientData, setClientData] = useState({
    nom_complet: '',
    telephone: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null);
  const [pharmacie, setPharmacie] = useState<Pharmacie | null>(null);
  

  const validate = () => {
    const newErrors: Record<string, string> = {}
    const phoneRegex = /^[0-9\s+\-().]{8,15}$/
    
    if (!clientData.nom_complet.trim()) {
      newErrors.nom_complet = 'Le nom complet est requis'
    }
    
    if (!clientData.telephone) {
      newErrors.telephone = 'Le téléphone est requis'
    } else if (!phoneRegex.test(clientData.telephone)) {
      newErrors.telephone = 'Format invalide (8-15 chiffres)'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation frontend
    if (!validate()) return
    
    // Nettoyage du numéro de téléphone
    const normalizedPhone = clientData.telephone.replace(/\D/g, '')
    const dataToSend = {
      ...clientData,
      telephone: normalizedPhone
    }
    
    try {
      const response = await axios.post('https://pharmacie-hefk.onrender.com/api/clients/', 
        dataToSend,
        {
          headers: { 
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
            'Content-Type': 'application/json'
          }
        }
      )
      
      alert('Client créé avec succès !')
      router.push(`/dashboard/pharmacie/vente`)
      
    } catch (error: any) {
      console.error('Erreur:', error.response?.data)
      
      // Gestion des erreurs bacckend
      if (error.response?.status === 400) {
        const backendErrors: Record<string, string[]> = error.response.data
        
        // Conversion des erreurs backend en format d'affichage
        const formattedErrors: Record<string, string> = {}
        Object.entries(backendErrors).forEach(([key, messages]) => {
          formattedErrors[key] = messages.join(', ')
        })
        
        setErrors(formattedErrors)
      } else {
        alert(`Erreur: ${error.response?.data?.detail || 'Erreur inconnue'}`)
      }
    }
  }

  return (
    <div className="flex min-h-screen">
    <SidebarDirecteur />

    <div className="flex-1 flex flex-col">
       {user && pharmacie && <HeaderDirecteur user={user} pharmacie={pharmacie} />}
      
      <main className="min-h-screen bg-gray-100 p-8">
      <h2 className="text-2xl font-bold mb-4">Créer un client</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block mb-2">Nom complet</label>
          <input
            type="text"
            value={clientData.nom_complet}
            onChange={(e) => setClientData({...clientData, nom_complet: e.target.value})}
            className={`w-full p-2 border rounded ${errors.nom_complet ? 'border-red-500' : ''}`}
            required
          />
          {errors.nom_complet && (
            <p className="text-red-500 text-sm mt-1">{errors.nom_complet}</p>
          )}
        </div>
        
        <div className="mb-4">
          <label className="block mb-2">Téléphone</label>
          <input
            type="tel"
            value={clientData.telephone}
            onChange={(e) => setClientData({...clientData, telephone: e.target.value})}
            className={`w-full p-2 border rounded ${errors.telephone ? 'border-red-500' : ''}`}
            required
            placeholder="Ex: 0612345678"
          />
          {errors.telephone && (
            <p className="text-red-500 text-sm mt-1">{errors.telephone}</p>
          )}
        </div>

        <button
          type="submit"
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Créer le client
        </button>
      </form>
     </main>
    </div>
  </div>
);
}