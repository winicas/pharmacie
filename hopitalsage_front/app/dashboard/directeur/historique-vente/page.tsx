'use client';

import { useEffect, useState } from 'react';

interface VenteLigne {
  produit: string;
  quantite: number;
  prix_unitaire: string;
  total: string;
}

interface Vente {
  id: number;
  date_vente: string;
  utilisateur: string | null;
  client: string | null;
  montant_total: string;
  lignes: VenteLigne[];
}

export default function HistoriqueVentes() {
  const [ventes, setVentes] = useState<Vente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');

  const fetchVentes = () => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    let url = 'http://localhost:8000/api/historique-ventes/';
    const params = new URLSearchParams();

    if (dateDebut) params.append('date_debut', dateDebut);
    if (dateFin) params.append('date_fin', dateFin);

    if (params.toString()) url += `?${params.toString()}`;

    setLoading(true);
    fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Erreur lors du chargement');
        return res.json();
      })
      .then((data) => {
        setVentes(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError('Erreur de chargement');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchVentes();
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Historique des Ventes</h2>

      <div className="flex items-center gap-4 mb-4">
        <div>
          <label className="text-sm text-gray-600">Date début</label>
          <input
            type="date"
            value={dateDebut}
            onChange={(e) => setDateDebut(e.target.value)}
            className="border px-2 py-1 rounded"
          />
        </div>
        <div>
          <label className="text-sm text-gray-600">Date fin</label>
          <input
            type="date"
            value={dateFin}
            onChange={(e) => setDateFin(e.target.value)}
            className="border px-2 py-1 rounded"
          />
        </div>
        <button
          onClick={fetchVentes}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Rechercher
        </button>
      </div>

      {loading && <p className="text-gray-600">Chargement...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {ventes.length === 0 && !loading && <p>Aucune vente trouvée.</p>}

      {ventes.map((vente) => (
        <div key={vente.id} className="bg-white shadow rounded-lg p-4 mb-6">
          <div className="mb-2 text-sm text-gray-500">
            <p><strong>Vente le :</strong> {new Date(vente.date_vente).toLocaleString()}</p>
            {vente.utilisateur && <p><strong>Utilisateur :</strong> {vente.utilisateur}</p>}
            {vente.client && <p><strong>Client :</strong> {vente.client}</p>}
            <p><strong>Montant total :</strong> {vente.montant_total} Fc</p>
          </div>

          <table className="w-full text-sm table-auto border mt-2">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 text-left">Produit</th>
                <th className="p-2 text-left">Quantité</th>
                <th className="p-2 text-left">Prix unitaire</th>
                <th className="p-2 text-left">Total</th>
              </tr>
            </thead>
            <tbody>
              {vente.lignes.map((ligne, index) => (
                <tr key={index} className="border-t">
                  <td className="p-2">{ligne.produit}</td>
                  <td className="p-2">{ligne.quantite}</td>
                  <td className="p-2">{ligne.prix_unitaire} Fc</td>
                  <td className="p-2">{ligne.total} Fc</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
