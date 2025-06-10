'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import HeaderDirecteur from '@/components/HeaderDirecteur';
import SidebarDirecteur from '@/components/SidebarDirecteur';

interface ProduitPharmacie {
  id: number;
  nom_medicament: string;
  prix_vente: number;
  quantite: number;
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

interface Pharmacie {
  id: number;
  nom_pharm: string;
  adresse_pharm: string;
  telephone: string | null;
}

// ✅ Typage correct de params
type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function OrdonnancePatientPage({ params }: PageProps) {
  const { id } = await params; // ✅ Await sur params

  const [produits, setProduits] = useState<ProduitPharmacie[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduit, setSelectedProduit] = useState<ProduitPharmacie | null>(null);
  const [dosage, setDosage] = useState('');
  const [dureeTraitement, setDureeTraitement] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [pharmacieId, setPharmacieId] = useState<number | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [pharmacie, setPharmacie] = useState<Pharmacie | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    setAccessToken(token);
  }, []);

  // Charger les données utilisateur et produits
  useEffect(() => {
    if (accessToken) {
      // Récupère la pharmacie de l'utilisateur
      axios
        .get('http://localhost:8000/api/pharmacie/', {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        .then((res) => {
          const pharmaId = res.data[0]?.id;
          setPharmacieId(pharmaId);
          // Charge les produits de la pharmacie
          loadProduits(pharmaId);
        })
        .catch(() => setError("Erreur lors du chargement de la pharmacie"));
    }
  }, [accessToken]);

  const loadProduits = (pharmacieId: number) => {
    axios
      .get(`http://localhost:8000/api/produits-pharmacie/?pharmacie=${pharmacieId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      .then((res) => {
        setProduits(res.data);
        setLoading(false);
      })
      .catch(() => {
        setError("Erreur lors du chargement des produits");
        setLoading(false);
      });
  };

  const filteredProduits = produits.filter((p) =>
    p.nom_medicament.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async () => {
    if (!accessToken || !selectedProduit || !dosage || !dureeTraitement) {
      alert("Tous les champs sont obligatoires");
      return;
    }

    const payload = {
      medicament: selectedProduit.id,
      dosage,
      duree_traitement: dureeTraitement,
    };

    try {
      await axios.post(
        `http://localhost:8000/api/clients/${id}/ordonnance/`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      alert("Ordonnance enregistrée !");
      setSelectedProduit(null);
      setDosage('');
      setDureeTraitement('');
    } catch (err: any) {
      console.error("Erreur lors de l'enregistrement", err);
      alert("Erreur lors de l'enregistrement de l'ordonnance.");
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <SidebarDirecteur />

      {/* Contenu principal */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        {user && pharmacie && <HeaderDirecteur user={user} pharmacie={pharmacie} />}

        {/* Page Content */}
        <main className="p-6">
          {loading ? (
            <div className="text-center py-10 text-blue-500">Chargement des produits...</div>
          ) : error ? (
            <div className="text-center py-10 text-red-500">{error}</div>
          ) : (
            <>
              <h1 className="text-2xl font-bold mb-6">Créer une ordonnance</h1>

              {/* Barre de recherche de produit */}
              <div className="mb-6 bg-white p-6 rounded-lg shadow">
                <label className="block text-sm font-medium text-gray-700 mb-2">Médicament</label>
                <input
                  type="text"
                  placeholder="Rechercher un médicament..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />

                {/* Liste de résultats */}
                {searchTerm && filteredProduits.length > 0 && (
                  <ul className="mt-2 border rounded-md overflow-hidden bg-white shadow-md">
                    {filteredProduits.map((produit) => (
                      <li
                        key={produit.id}
                        onClick={() => setSelectedProduit(produit)}
                        className="cursor-pointer px-4 py-2 hover:bg-blue-50 border-b last:border-b-0"
                      >
                        <strong>{produit.nom_medicament}</strong> – Stock: {produit.quantite} unités
                      </li>
                    ))}
                  </ul>
                )}

                {/* Aucun résultat */}
                {searchTerm && filteredProduits.length === 0 && (
                  <div className="mt-2 p-2 text-gray-500">Aucun produit trouvé.</div>
                )}

                {/* Médicament sélectionné */}
                {selectedProduit && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                    <strong>Sélectionné :</strong> {selectedProduit.nom_medicament} – Stock: {selectedProduit.quantite}
                  </div>
                )}
              </div>

              {/* Formulaire dosage / durée */}
              {selectedProduit && (
                <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow space-y-4 max-w-xl mx-auto">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dosage</label>
                    <input
                      type="text"
                      value={dosage}
                      onChange={(e) => setDosage(e.target.value)}
                      className="w-full p-3 border rounded-lg"
                      placeholder="ex: 1 comprimé par jour"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Durée du traitement</label>
                    <input
                      type="text"
                      value={dureeTraitement}
                      onChange={(e) => setDureeTraitement(e.target.value)}
                      className="w-full p-3 border rounded-lg"
                      placeholder="ex: 5 jours"
                    />
                  </div>

                  <button
                    type="submit"
                    className="mt-4 w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition"
                  >
                    Enregistrer l’ordonnance
                  </button>
                </form>
              )}

              {!selectedProduit && (
                <div className="text-center text-gray-500 mt-4">
                  Sélectionnez un médicament ci-dessus pour continuer.
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}