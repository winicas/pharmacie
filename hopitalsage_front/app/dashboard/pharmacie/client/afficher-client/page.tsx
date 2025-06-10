'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import PharmacieLayout from '@/app/dashboard/directeur/layout';
import { ChevronDown } from 'lucide-react';

interface Client {
  id: number;
  nom_complet: string;
  telephone: string;
  score_fidelite: number;
  dernier_achat: string | null;
  total_depense: number;
  created_at: string;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    setAccessToken(token);
  }, []);

  useEffect(() => {
    if (accessToken) {
      fetchClients();
    }
  }, [accessToken]);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:8000/api/clients/', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setClients(response.data);
    } catch (err: any) {
      console.error("Erreur lors de la récupération des clients :", err);
      setError("Impossible de charger les clients.");
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = clients.filter((client) =>
    client.nom_complet.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.telephone.includes(searchTerm)
  );

  return (
    <PharmacieLayout>
      <div className="w-full p-4">
        <h1 className="text-2xl font-semibold text-gray-800 mb-4">📋 Liste des Clients</h1>

        <div className="relative max-w-md mb-6">
          <input
            type="text"
            placeholder="🔍 Rechercher par nom ou téléphone"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 pl-10 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <svg
            className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {loading ? (
          <p className="text-center text-blue-500">Chargement des clients...</p>
        ) : error ? (
          <p className="text-center text-red-500">{error}</p>
        ) : (
          <div className="overflow-x-auto rounded-xl shadow bg-white">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-blue-50">
                <tr>
                  {['Nom', 'Téléphone', 'Score', 'Dernier achat', 'Dépense', ''].map((header, i) => (
                    <th
                      key={i}
                      className="py-3 px-4 text-left text-sm font-semibold text-gray-600"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredClients.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50 transition duration-150">
                    <td className="px-4 py-3">{client.nom_complet}</td>
                    <td className="px-4 py-3">{client.telephone}</td>
                    <td className="px-4 py-3">{client.score_fidelite}</td>
                    <td className="px-4 py-3">{client.dernier_achat ? new Date(client.dernier_achat).toLocaleDateString() : 'Jamais'}</td>
                    <td className="px-4 py-3">{client.total_depense} Fc</td>
                    <td className="px-4 py-3 text-right">
                      <DropdownMenu clientId={client.id} router={router} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredClients.length === 0 && (
              <div className="p-4 text-center text-gray-500">Aucun client trouvé.</div>
            )}
          </div>
        )}
      </div>
    </PharmacieLayout>
  );
}

function DropdownMenu({ clientId, router }: { clientId: number; router: any }) {
  const [isOpen, setIsOpen] = useState(false);

  const handleNavigation = (path: string) => {
    router.push(`/dashboard/pharmacie/client/${clientId}/${path}`);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="p-2 hover:bg-gray-100 rounded-full transition"
      >
        <ChevronDown size={20} />
      </button>

      {isOpen && (
        <>
          <div
            className="absolute right-0 z-50 mt-2 w-44 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none animate-fadeIn"
          >
            <div className="py-1 text-sm text-gray-700">
              <button
                onClick={() => handleNavigation('examen')}
                className="w-full text-left px-4 py-2 hover:bg-blue-50"
              >
                🩺 Examen
              </button>
              <button
                onClick={() => handleNavigation('ordonnance')}
                className="w-full text-left px-4 py-2 hover:bg-blue-50"
              >
                💊 Ordonnance
              </button>
              <button
                onClick={() => handleNavigation('rendez-vous')}
                className="w-full text-left px-4 py-2 hover:bg-blue-50"
              >
                📅 Rendez-vous
              </button>

              <button
                onClick={() => handleNavigation('dossier-medical')}
                className="w-full text-left px-4 py-2 hover:bg-blue-50"
              >
                📁 Dossier
              </button>
            </div>
          </div>
          <div className="fixed inset-0 z-0" onClick={() => setIsOpen(false)}></div>
        </>
      )}
    </div>
  );
}
