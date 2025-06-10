'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Stats {
  chiffre_affaire: string;
  benefice: string;
  total_ventes: string;
  produit_plus_vendu: string;
}

interface Client {
  id: number;
  nom_complet: string;
  prenom: string;
  telephone: string;
  rendez_vous: string | null;
}

export default function DashboardPharmacie() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        // Récupération des statistiques
        const statsRes = await fetch('https://pharmacie-hefk.onrender.com/api/statistiques-du-jour/', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!statsRes.ok) throw new Error(`Erreur stats: ${statsRes.status}`);
        const statsData = await statsRes.json();
        setStats(statsData);

        // Récupération des clients avec RDV
        const clientsRes = await fetch('https://pharmacie-hefk.onrender.com/api/clients-avec-rendezvous/', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!clientsRes.ok) throw new Error(`Erreur clients: ${clientsRes.status}`);
        const clientsData: Client[] = await clientsRes.json();

        // Tri par date de rendez-vous croissante
        clientsData.sort((a, b) => {
          const dateA = a.rendez_vous ? new Date(a.rendez_vous).getTime() : Infinity;
          const dateB = b.rendez_vous ? new Date(b.rendez_vous).getTime() : Infinity;
          return dateA - dateB;
        });

        setClients(clientsData);
      } catch (err) {
        console.error('Erreur lors du chargement:', err);
        setError('Impossible de charger les données.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  if (loading) return <div>Chargement...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  // Fonction pour obtenir la couleur en fonction de la date
  const getColor = (dateStr: string | null): string => {
    if (!dateStr) return ''; // Pas de rendez-vous → pas de couleur

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0); // Aujourd'hui à minuit

    const rdvDate = new Date(dateStr);
    rdvDate.setHours(0, 0, 0, 0); // RDV à minuit aussi

    const diffDays = Math.floor(
      (rdvDate.getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays < 0) return 'bg-green-100'; // RDV passé
    if (diffDays === 0) return 'bg-red-300'; // Aujourd’hui
    if (diffDays === 1) return 'bg-orange-300'; // Demain
    if (diffDays === 2) return 'bg-yellow-300'; // Dans 2 jours

    return 'bg-green-50'; // Pour tous les autres jours futurs
  };

  // Message dynamique pour le RDV
  const getRdvMessage = (dateStr: string | null): string => {
    if (!dateStr) return '';

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const rdvDate = new Date(dateStr);
    rdvDate.setHours(0, 0, 0, 0);

    const diffDays = Math.floor(
      (rdvDate.getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays < 0) return 'RDV passé';
    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return "Demain";
    if (diffDays === 2) return "Dans 2 jours";

    return `Dans ${diffDays} jours`;
  };

  return (
    <div className="bg-white dark:bg-zinc-800 p-6 rounded shadow space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-emerald-600">
          Bienvenue sur votre espace pharmacie
        </h2>
        <p className="text-gray-700 dark:text-gray-200">
          Ici vous pouvez gérer vos produits, commandes, alertes, etc.
        </p>
      </div>

      {/* Statistiques */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Chiffre d'affaires" value={`${stats.chiffre_affaire} Fc`} />
          <StatCard label="Bénéfice du jour" value={`${stats.benefice} Fc`} />
          <StatCard label="Total des ventes" value={`${stats.total_ventes} Fc`} />
          <StatCard label="Produit le plus vendu" value={stats.produit_plus_vendu} />
        </div>
      )}

      {/* Liste des clients avec RDV */}
      <div>
        <h3 className="text-xl font-semibold text-emerald-700 mb-4">Liste des clients avec rendez-vous</h3>
        {clients.length === 0 ? (
          <p className="text-gray-500">Aucun client enregistré.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {clients.map(client => {
              const colorClass = getColor(client.rendez_vous);
              const message = getRdvMessage(client.rendez_vous);

              return (
                <div
                  key={client.id}
                  className={`p-4 border rounded shadow-sm bg-gray-50 dark:bg-gray-700 ${colorClass}`}
                >
                  <p className="font-semibold text-gray-800 dark:text-gray-100">
                    {client.nom_complet}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">📞 {client.telephone}</p>
                  {client.rendez_vous ? (
                    <>
                      <p className="text-xs italic text-gray-700 dark:text-gray-400">
                        Rendez-vous: {new Date(client.rendez_vous).toLocaleDateString()}
                      </p>
                      <span className="text-xs mt-1 inline-block px-2 py-1 rounded-full bg-opacity-70 bg-black text-white">
                        {message}
                      </span>
                    </>
                  ) : (
                    <p className="text-xs text-gray-500">Pas de rendez-vous</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// Composant pour afficher une carte de statistique
function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-emerald-100 dark:bg-emerald-700 p-4 rounded-xl shadow-md">
      <p className="text-sm text-emerald-800 dark:text-emerald-100 font-medium">{label}</p>
      <p className="text-xl font-bold text-emerald-900 dark:text-white">{value}</p>
    </div>
  );
}