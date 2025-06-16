'use client';

import { useEffect, useState } from 'react';

interface LotProduitPharmacie {
  id: number;
  numero_lot: string;
  date_peremption: string;
  date_entree: string;
  quantite: number;
  prix_achat: string;
  prix_vente: string;
  nom_medicament: string;
}

export default function ListeLots({
  produitId,
  dateDebut,
  dateFin,
}: {
  produitId: number;
  dateDebut?: string;
  dateFin?: string;
}) {
  const [lots, setLots] = useState<LotProduitPharmacie[]>([]);
  const [editingLotId, setEditingLotId] = useState<number | null>(null);
  const [newDatePeremption, setNewDatePeremption] = useState('');

  useEffect(() => {
    if (!produitId) return;

    const token = localStorage.getItem('accessToken');

    let url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/lots/?produit=${produitId}`;
    if (dateDebut) url += `&date_debut=${dateDebut}`;
    if (dateFin) url += `&date_fin=${dateFin}`;

    fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => setLots(data))
      .catch((err) => console.error(err));
  }, [produitId, dateDebut, dateFin]);

  async function handleSaveDate(lotId: number) {
    if (!newDatePeremption) return alert('La date ne peut pas être vide');

    const token = localStorage.getItem('accessToken');

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/lots/${lotId}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ date_peremption: newDatePeremption }),
      });

      if (!res.ok) throw new Error('Erreur lors de la mise à jour');

      const updatedLot = await res.json();

      setLots(lots.map((lot) => (lot.id === lotId ? updatedLot : lot)));
      setEditingLotId(null);
      setNewDatePeremption('');
    } catch (error) {
      alert('Erreur lors de la mise à jour de la date');
      console.error(error);
    }
  }

  if (!produitId) return null;

  const nomMedicament = lots.length > 0 ? lots[0].nom_medicament : null;

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-2">Lots du médicament sélectionné</h2>
      {nomMedicament && (
        <p className="mb-4 text-green-700 font-semibold text-md">
          Médicament : {nomMedicament}
        </p>
      )}

      {lots.length === 0 ? (
        <p className="text-gray-500">Aucun lot trouvé pour ce produit.</p>
      ) : (
        <table className="w-full border text-sm">
          <thead>
            <tr className="bg-gray-200">
              <th className="p-2">Numéro Lot</th>
              <th className="p-2">Date Péremption</th>
              <th className="p-2">Quantité</th>
              <th className="p-2">Prix Achat</th>
              <th className="p-2">Prix Vente</th>
              <th className="p-2">Date d’entrée</th>
              <th className="p-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {lots.map((lot) => (
              <tr key={lot.id} className="border-t text-center">
                <td className="p-2">{lot.numero_lot || 'N/A'}</td>
                <td className="p-2">
                  {editingLotId === lot.id ? (
                    <input
                      type="date"
                      value={newDatePeremption}
                      onChange={(e) => setNewDatePeremption(e.target.value)}
                      className="border rounded p-1"
                    />
                  ) : (
                    lot.date_peremption
                  )}
                </td>
                <td className="p-2">{lot.quantite}</td>
                <td className="p-2">{lot.prix_achat}</td>
                <td className="p-2">{lot.prix_vente}</td>
                <td className="p-2">{new Date(lot.date_entree).toLocaleDateString()}</td>
                <td className="p-2">
                  {editingLotId === lot.id ? (
                    <>
                      <button
                        onClick={() => handleSaveDate(lot.id)}
                        className="mr-2 bg-green-500 text-white px-2 py-1 rounded"
                      >
                        Sauvegarder
                      </button>
                      <button
                        onClick={() => {
                          setEditingLotId(null);
                          setNewDatePeremption('');
                        }}
                        className="bg-gray-500 text-white px-2 py-1 rounded"
                      >
                        Annuler
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => {
                        setEditingLotId(lot.id);
                        setNewDatePeremption(lot.date_peremption);
                      }}
                      className="bg-blue-500 text-white px-2 py-1 rounded"
                    >
                      Modifier
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
