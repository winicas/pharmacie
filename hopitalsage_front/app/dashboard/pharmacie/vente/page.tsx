'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import PharmacieLayout from '@/app/dashboard/directeur/layout';
import generateAndDownloadPDF from '@/components/RecuVentePDF';

interface Client {
  id: number;
  nom_complet: string;
  telephone: string;
}

interface ProduitPharmacie {
  id: number;
  nom_medicament: string;
  prix_vente: number;
  quantite: number;
  code_barre: string;
}

interface LigneVente {
  produit: ProduitPharmacie | null;
  quantite: number;
  prix_unitaire: number;
  total: number;
}

export default function VentePage() {
  const [produits, setProduits] = useState<ProduitPharmacie[]>([]);
  const [pharmacieNom, setPharmacieNom] = useState<string | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [lignes, setLignes] = useState<LigneVente[]>([{ produit: null, quantite: 1, prix_unitaire: 0, total: 0 }]);
  const [searchTerm, setSearchTerm] = useState('');
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [pharmacieId, setPharmacieId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    setAccessToken(token);
  }, []);

  useEffect(() => {
    if (accessToken) {
      axios
        .get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/pharmacie/`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        .then((res) => {
          if (res.data.length > 0) {
            const pharmaId = res.data[0].id;
            setPharmacieId(pharmaId);
            setPharmacieNom(res.data[0].nom_pharmacie);
          } else {
            setError("Aucune pharmacie associée à cet utilisateur");
          }
        })
        .catch(() => setError("Erreur lors du chargement de la pharmacie"))
        .finally(() => setLoading(false));
    }
  }, [accessToken]);

  const loadProduits = (pharmacieId: number) => {
    axios
      .get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/produits-pharmacie/?pharmacie=${pharmacieId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      .then((res) => setProduits(res.data))
      .catch(() => setError("Erreur lors du chargement des produits"));
  };

  const loadClients = (pharmacieId: number) => {
    axios
      .get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/clients/?pharmacie=${pharmacieId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      .then((res) => setClients(res.data))
      .catch(console.error);
  };

  useEffect(() => {
    if (accessToken && pharmacieId) {
      loadProduits(pharmacieId);
      loadClients(pharmacieId);
    }
  }, [accessToken, pharmacieId]);

  const addLigne = () =>
    setLignes([...lignes, { produit: null, quantite: 1, prix_unitaire: 0, total: 0 }]);

  const removeLigne = (index: number) => {
    if (lignes.length > 1) {
      const copy = [...lignes];
      copy.splice(index, 1);
      setLignes(copy);
    }
  };

  const updateLigneProduit = (index: number, produitId: number) => {
    const produit = produits.find((p) => p.id === produitId);
    if (!produit) return;
    const copy = [...lignes];
    copy[index] = {
      produit,
      quantite: 1,
      prix_unitaire: produit.prix_vente,
      total: produit.prix_vente * 1,
    };
    setLignes(copy);
  };

  const updateLigneQuantite = (index: number, quantite: number) => {
    const ligne = lignes[index];
    if (ligne.produit) {
      const copy = [...lignes];
      copy[index].quantite = quantite;
      copy[index].total = quantite * ligne.prix_unitaire;
      setLignes(copy);
    }
  };

  const totalVente = lignes.reduce((s, l) => s + l.total, 0);

  const handleProformat = () => {
    if (!selectedClient) {
      alert("Veuillez sélectionner un client pour générer le proformat.");
      return;
    }

    const lignesValides = lignes.filter(
      (l) => l.produit !== null && l.quantite > 0 && l.prix_unitaire > 0
    );
    if (lignesValides.length === 0) {
      alert("Aucun médicament valide sélectionné.");
      return;
    }

    generateAndDownloadPDF({
      lignes: lignesValides,
      selectedClient,
      totalVente: lignesValides.reduce((s, l) => s + l.total, 0),
      pharmacie: {
        nom_pharm: 'COSMO PHARMA',
        ville_pharm: 'Kinshasa',
        commune_pharm: 'Bandalungwa',
        adresse_pharm: '24, Avenue Kasa-Vubu',
        rccm: 'CD/KIN/RCCM/123',
        idnat: 'IDNAT/456789',
        ni: 'NI/987654',
        telephone: '+243 812345678',
      },
      type: 'proformat',
    });
  };

  const handleSubmit = async () => {
    if (!accessToken || !pharmacieId) return;

    for (const ligne of lignes) {
      if (!ligne.produit) continue;
      if (!ligne.quantite || ligne.quantite <= 0 || ligne.prix_unitaire <= 0 || ligne.total <= 0) {
        alert(`Veuillez saisir correctement la quantité et le prix du médicament '${ligne.produit.nom_medicament}'`);
        return;
      }
    }

    const payload = {
      pharmacie: pharmacieId,
      client: selectedClient?.id || null,
      lignes: lignes
        .filter((l) => l.produit !== null)
        .map((l) => ({
          produit: l.produit!.id,
          quantite: l.quantite,
        })),
    };

    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/ventes/`, payload, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      alert('Vente enregistrée avec succès !');

      generateAndDownloadPDF({
        lignes,
        selectedClient,
        totalVente,
        pharmacie: {
          nom_pharm: 'COSMO PHARMA',
          ville_pharm: 'Kinshasa',
          commune_pharm: 'Bandalungwa',
          adresse_pharm: '24, Avenue Kasa-Vubu',
          rccm: 'CD/KIN/RCCM/123',
          idnat: 'IDNAT/456789',
          ni: 'NI/987654',
          telephone: '+243 812345678',
        }
      });

      loadProduits(pharmacieId);
      setLignes([{ produit: null, quantite: 1, prix_unitaire: 0, total: 0 }]);
      setSelectedClient(null);
      setClientSearchTerm('');
    } catch (err: any) {
      alert("Erreur : " + JSON.stringify(err.response?.data || err.message));
    }
  };

  if (loading)
    return <div className="p-6 text-center">Chargement...</div>;
  if (error)
    return <div className="p-6 text-red-500 text-center">{error}</div>;

  const filteredProduits = produits.filter((p) =>
    p.nom_medicament.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredClients = clients.filter((c) =>
    c.nom_complet.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
    c.telephone.includes(clientSearchTerm)
  );

  return (
    <PharmacieLayout>
      <div className="p-6 bg-white rounded-xl shadow-md space-y-6">
        <h1 className="text-2xl font-bold">Nouvelle Vente</h1>

        {/* Sélection du client */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-3">Client</h2>
          <input
            type="text"
            placeholder="Rechercher un client..."
            className="w-full p-3 border rounded-lg"
            value={clientSearchTerm}
            onChange={(e) => setClientSearchTerm(e.target.value)}
          />
          {selectedClient && (
            <div className="mt-2 p-3 bg-blue-50 rounded flex justify-between items-center">
              <div>
                <strong>{selectedClient.nom_complet}</strong>{' '}
                <span className="text-gray-600 ml-3">{selectedClient.telephone}</span>
              </div>
              <button
                className="text-red-500 hover:underline"
                onClick={() => {
                  setSelectedClient(null);
                  setClientSearchTerm('');
                }}
              >
                Changer
              </button>
            </div>
          )}
          {!selectedClient && clientSearchTerm && (
            <div className="bg-white border rounded shadow mt-1 max-h-40 overflow-y-auto">
              {filteredClients.map((client) => (
                <div
                  key={client.id}
                  className="p-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => {
                    setSelectedClient(client);
                    setClientSearchTerm('');
                  }}
                >
                  <div className="font-semibold">{client.nom_complet}</div>
                  <div className="text-sm text-gray-500">{client.telephone}</div>
                </div>
              ))}
              {filteredClients.length === 0 && (
                <div className="p-2 text-gray-500">Aucun client trouvé</div>
              )}
            </div>
          )}
        </div>

        {/* Recherche produit */}
        <input
          type="text"
          placeholder="Rechercher un médicament..."
          className="w-full p-3 border rounded-lg"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        {/* Liste de produits filtrés */}
        {searchTerm && (
          <div className="grid md:grid-cols-3 gap-3 max-h-60 overflow-y-auto">
            {filteredProduits.map((produit) => (
              <div
                key={produit.id}
                className="border p-3 rounded-lg hover:bg-gray-50 cursor-pointer"
                onClick={() => {
                  const dejaPris = lignes.some((l) => l.produit?.id === produit.id);
                  if (dejaPris) {
                    alert('Ce produit a déjà été sélectionné dans la commande.');
                    return;
                  }
                  const emptyIndex = lignes.findIndex((l) => l.produit === null);
                  if (emptyIndex >= 0) {
                    updateLigneProduit(emptyIndex, produit.id);
                  } else {
                    setLignes([
                      ...lignes,
                      {
                        produit,
                        quantite: 1,
                        prix_unitaire: produit.prix_vente,
                        total: produit.prix_vente * 1,
                      },
                    ]);
                  }
                }}
              >
                <div className="font-semibold">{produit.nom_medicament}</div>
                <div className="text-sm text-gray-600">Stock : {produit.quantite}</div>
                <div className="text-sm text-green-600 font-bold">{produit.prix_vente} Fc</div>
              </div>
            ))}
          </div>
        )}

        {/* Lignes de vente */}
        <div className="space-y-4">
          {lignes.map((ligne, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-3 items-center">
              <select
                className="p-2 border rounded"
                value={ligne.produit?.id || ''}
                onChange={(e) => updateLigneProduit(index, parseInt(e.target.value))}
              >
                <option value="">Choisir un produit</option>
                {produits.map((p) => (
                  <option key={p.id} value={p.id}>{p.nom_medicament}</option>
                ))}
              </select>
              <input
                type="number"
                min="1"
                className="p-2 border rounded"
                value={ligne.quantite}
                onChange={(e) => updateLigneQuantite(index, parseInt(e.target.value))}
              />
              <div>P.U : {Number(ligne.prix_unitaire || 0).toFixed(2)} Fc</div>
              <div>Total : {Number(ligne.total || 0).toFixed(2)} Fc</div>
              <button
                className="text-red-500 hover:underline"
                onClick={() => removeLigne(index)}
              >
                Supprimer
              </button>
            </div>
          ))}
          <button
            className="text-blue-500 hover:underline"
            onClick={addLigne}
          >
            + Ajouter une ligne
          </button>
        </div>

        {/* Total & Boutons */}
        <div className="flex justify-between items-center border-t pt-4">
          <div className="text-lg font-bold">
            Total: {Number(totalVente).toFixed(2)} Fc
          </div>
          <button
            className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2 px-4 rounded"
            onClick={handleProformat}
          >
            Proformat
          </button>
          <button
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            onClick={handleSubmit}
          >
            Enregistrer Vente
          </button>
        </div>
      </div>
    </PharmacieLayout>
  );
}