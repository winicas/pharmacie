'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';


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

  useEffect(() => {
    if (!accessToken) return;

    axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/user/me/`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    }).then(res => setUser(res.data));

    axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/pharmacie/`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    }).then(res => {
      if (res.data.length > 0) {
        setPharmacie(res.data[0]);
        setPharmacieId(res.data[0].id);
      }
    });
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken || !pharmacieId) return;

    axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/produits-fabricants/`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    }).then(res => setProduits(res.data));

    chargerRequisitions();
  }, [accessToken, pharmacieId]);

  const chargerRequisitions = () => {
    axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/requisitions/?pharmacie=${pharmacieId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    }).then(res => setRequisitions(res.data));
  };

  const ajouterRequisition = (produit: any) => {
    const nom = produit.nom;

    if (!produit.id && !nom.trim()) {
      setMessageErreur("Veuillez entrer un nom ou choisir un produit.");
      return;
    }

    const payload = {
      pharmacie: pharmacieId,
      ...(produit.id ? { produit_fabricant: produit.id } : { nom_personnalise: nom }),
    };

    axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/requisitions/`, payload, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then(() => {
        chargerRequisitions();
        setCustomNom('');
        setMessageErreur('');
      })
      .catch(error => {
        const errMsg = error.response?.data?.detail || "Erreur inconnue.";
        setMessageErreur(errMsg);
      });
  };

  const supprimerRequisition = async (id: number) => {
    if (!accessToken) return;

    if (confirm("Supprimer cette réquisition ?")) {
      try {
        await axios.delete(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/requisitions/${id}/`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        setRequisitions(prev => prev.filter(r => r.id !== id));
      } catch (error) {
        console.error("Erreur suppression individuelle :", error);
        alert("Échec de la suppression.");
      }
    }
  };

  const incrementerDemande = async (id: number) => {
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/requisitions/${id}/incrementer/`, null, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      chargerRequisitions();
    } catch (error) {
      console.error("Erreur lors de l'incrément :", error);
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
   
      <div className="flex-1 flex flex-col">
       

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
                    <button
                      key={p.id}
                      onClick={() => ajouterRequisition(p)}
                      className="p-3 bg-blue-100 hover:bg-blue-200 rounded text-left shadow"
                    >
                      <p className="font-semibold">{p.nom}</p>
                      <p className="text-sm text-gray-600">Fabricant : {p.fabricant_nom}</p>
                    </button>
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
                          🗑️
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
