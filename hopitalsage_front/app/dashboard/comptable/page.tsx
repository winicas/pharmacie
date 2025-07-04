'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import HeaderDirecteur from '@/components/HeaderDirecteur';
import SidebarDirecteur from '@/components/SidebarDirecteur';

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

export default function RequisitionPage() {
  const [produits, setProduits] = useState<ProduitFabricant[]>([]);
  const [requisitions, setRequisitions] = useState<Requisition[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [customNom, setCustomNom] = useState('');
  const [messageErreur, setMessageErreur] = useState('');
  const [pharmacieId, setPharmacieId] = useState<number | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [pharmacie, setPharmacie] = useState<Pharmacie | null>(null);

  const accessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  const API = process.env.NEXT_PUBLIC_API_BASE_URL;

  // Redirection si token invalide
  const handle401 = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    alert('Votre session a expiré. Veuillez vous reconnecter.');
    window.location.href = '/login';
  };

  useEffect(() => {
    const fetchUserAndPharmacie = async () => {
      if (!accessToken) return handle401();

      try {
        const userRes = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/user/me/`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        setUser(userRes.data);

        const pharmRes = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/pharmacie/`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (pharmRes.data.length > 0) {
          setPharmacie(pharmRes.data[0]);
          setPharmacieId(pharmRes.data[0].id);
        }
      } catch (error: any) {
        if (error.response?.status === 401) handle401();
        else console.error('Erreur de chargement des données :', error);
      }
    };

    fetchUserAndPharmacie();
  }, [accessToken]);

  useEffect(() => {
  const fetchProduits = async () => {
    if (!accessToken || searchTerm.trim().length < 2) {
      setProduits([]);
      return;
    }

    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/produits-fabricants/?search=${searchTerm}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setProduits(res.data);
    } catch (error: any) {
      if (error.response?.status === 401) handle401();
      else console.error("Erreur recherche produits :", error);
    }
  };

  const timer = setTimeout(() => {
    fetchProduits();
  }, 400); // délai de 400ms après arrêt de frappe

  return () => clearTimeout(timer);
}, [searchTerm]);



  const chargerRequisitions = async () => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/requisitions/?pharmacie=${pharmacieId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setRequisitions(res.data);
    } catch (error: any) {
      if (error.response?.status === 401) handle401();
      else console.error('Erreur chargement des réquisitions :', error);
    }
  };

  const ajouterRequisition = async (produit: any) => {
    const nom = produit.nom;

    if (!produit.id && !nom.trim()) {
      setMessageErreur("Veuillez entrer un nom ou choisir un produit.");
      return;
    }

    const payload = {
      pharmacie: pharmacieId,
      ...(produit.id ? { produit_fabricant: produit.id } : { nom_personnalise: nom }),
    };

    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/requisitions/`, payload, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      await chargerRequisitions();
      setCustomNom('');
      setMessageErreur('');
    } catch (error: any) {
      if (error.response?.status === 401) handle401();
      else setMessageErreur(error.response?.data?.detail || "Erreur inconnue.");
    }
  };

  const supprimerRequisition = async (id: number) => {
    if (!accessToken) return handle401();

    if (confirm("Supprimer cette réquisition ?")) {
      try {
        await axios.delete(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/requisitions/${id}/`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        setRequisitions(prev => prev.filter(r => r.id !== id));
      } catch (error: any) {
        if (error.response?.status === 401) handle401();
        else {
          console.error("Erreur suppression individuelle :", error);
          alert("Échec de la suppression.");
        }
      }
    }
  };

  const incrementerDemande = async (id: number) => {
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/requisitions/${id}/incrementer/`, null, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      await chargerRequisitions();
    } catch (error: any) {
      if (error.response?.status === 401) handle401();
      else console.error("Erreur lors de l'incrément :", error);
    }
  };

  const nettoyerRequisitions = () => {
    if (confirm("Êtes-vous sûr de vouloir nettoyer l’écran ?")) {
      setRequisitions([]);
    }
  };

  const filteredProduits = searchTerm.trim()
    ? produits.filter((p) =>
        p.nom.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  return (
    <div className="flex min-h-screen">
      <SidebarDirecteur />
      <div className="flex-1 flex flex-col">
        {user && pharmacie && <HeaderDirecteur user={user} pharmacie={pharmacie} />}

        <main className="min-h-screen bg-gray-100 p-8">
          <h1 className="text-3xl font-bold text-blue-700 mb-6">Réquisition de Médicaments</h1>

          {messageErreur && (
            <div className="mb-4 text-red-600 bg-red-100 p-3 rounded">
              ⚠️ {messageErreur}
            </div>
          )}

          <div className="mb-6">
            <button
              onClick={nettoyerRequisitions}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
            >
              🧹 Nettoyer l’écran
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Formulaire */}
            <div>
              <input
                className="w-full p-3 border rounded mb-4"
                type="text"
                placeholder="🔍 Rechercher un médicament..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />

             {filteredProduits.length > 0 && (
  <div className="grid grid-cols-1 gap-4 mb-6">
    {filteredProduits.slice(0, 10).map((p) => (
      <div
        key={p.id}
        className="flex flex-col bg-blue-50 border border-blue-200 p-3 rounded hover:bg-blue-100 cursor-pointer"
        onClick={() => ajouterRequisition(p)}
      >
        <span className="font-bold text-gray-800">{p.nom}</span>
        <span className="text-sm text-gray-600">Fabricant : {p.fabricant_nom || "Non spécifié"}</span>
      </div>
    ))}
  </div>
)}

              <input
                className="w-full p-3 border rounded mb-2"
                type="text"
                placeholder="📎 Saisir manuellement un médicament"
                value={customNom}
                onChange={(e) => setCustomNom(e.target.value)}
              />
              <button
                onClick={() => ajouterRequisition({ nom: customNom })}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded w-full"
              >
                ➕ Ajouter la réquisition
              </button>
            </div>

            {/* Liste */}
            <div>
              <h2 className="text-xl font-semibold mb-4 text-gray-700">📋 Liste des réquisitions</h2>

              {requisitions.length === 0 ? (
                <p className="text-gray-600">Aucune réquisition enregistrée.</p>
              ) : (
                requisitions
                  .sort((a, b) => b.nombre_demandes - a.nombre_demandes)
                  .map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center justify-between bg-white shadow p-4 rounded border mb-3 hover:bg-gray-50"
                    >
                      <div>
                        <p className="font-semibold text-lg">
                          {r.nom_produit || r.nom_personnalise}
                          {r.fabricant_nom ? ` (${r.fabricant_nom})` : ''}
                        </p>
                        <p className="text-gray-500">Demandes : {r.nombre_demandes}</p>
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => incrementerDemande(r.id)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Encore"
                        >
                          🔁
                        </button>
                        <button
                          onClick={() => supprimerRequisition(r.id)}
                          className="text-red-600 hover:text-red-800"
                          title="Supprimer"
                        >
                          ❌
                        </button>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
