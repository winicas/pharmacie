'use client';

import { useRouter } from 'next/navigation'; 
import { useEffect, useState } from 'react';
import axios from 'axios';
import PharmacieLayout from '@/app/dashboard/directeur/layout';
import { MoreVertical } from 'lucide-react';

interface Medicament {
  id: number;
  nom_medicament: string;
  quantite: number;
  prix_achat: number;
  marge_beneficiaire: number;
  date_peremption: string;
}

const ListeMedicamentsPage = () => {
  const [medicaments, setMedicaments] = useState<Medicament[]>([]);
  const [menuOuvertId, setMenuOuvertId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState(''); // état pour la recherche
  const router = useRouter();

  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

  useEffect(() => {
    if (token) {
      axios.get('http://localhost:8000/api/produits-pharmacie/', {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(res => setMedicaments(res.data))
      .catch(err => console.error('Erreur de chargement:', err));
    }
  }, [token]);

  const toggleMenu = (id: number) => {
    setMenuOuvertId(prev => (prev === id ? null : id));
  };

  // Filtrer les médicaments selon la recherche (insensible à la casse)
  const medicamentsFiltres = medicaments.filter(med =>
    med.nom_medicament.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <PharmacieLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Liste des Médicaments</h1>

        {/* Barre de recherche */}
        <input
          type="text"
          placeholder="Rechercher un médicament..."
          className="mb-4 p-2 border border-gray-300 rounded w-full max-w-sm"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />

        <div className="overflow-x-auto">
          <table className="min-w-full table-auto border border-gray-200 shadow-md rounded-lg">
            <thead className="bg-emerald-600 text-white">
              <tr>
                <th className="p-3 text-left">Nom</th>
                <th className="p-3 text-left">Quantité</th>
                <th className="p-3 text-left">Prix d'Achat</th>
                <th className="p-3 text-left">Prix de Vente</th>
                <th className="p-3 text-left">Date de Péremption</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {medicamentsFiltres.map((med) => {
                const prixVente = (med.prix_achat * (1 + med.marge_beneficiaire / 100)).toFixed(2);
                return (
                  <tr key={med.id} className="border-b hover:bg-gray-50 relative">
                    <td className="p-3">{med.nom_medicament}</td>
                    <td className="p-3">{med.quantite}</td>
                    <td className="p-3">{med.prix_achat} Fc</td>
                    <td className="p-3">{prixVente} Fc</td>
                    <td className="p-3">{new Date(med.date_peremption).toLocaleDateString()}</td>
                    <td className="p-3">
                      <button onClick={() => toggleMenu(med.id)} className="hover:text-emerald-600">
                        <MoreVertical size={20} />
                      </button>
                      {menuOuvertId === med.id && (
                        <div className="absolute z-10 mt-2 bg-white border rounded shadow-md p-2 w-32">
                         <button
                          onClick={() => router.push(`/dashboard/pharmacie/nouvel-medicament-pharmacie/${med.id}`)}
                          className="block w-full text-left px-2 py-1 hover:bg-emerald-100 rounded"
                        >
                          Modifier
                        </button>
                          {/* D’autres options possibles ici */}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {medicamentsFiltres.length === 0 && (
            <p className="text-gray-600 mt-4">Aucun médicament trouvé.</p>
          )}
        </div>
      </div>
    </PharmacieLayout>
  );
};

export default ListeMedicamentsPage;
