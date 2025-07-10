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

  const [syncLoading, setSyncLoading] = useState(false);
  const [syncLog, setSyncLog] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        const statsRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/statistiques-du-jour/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!statsRes.ok) throw new Error(`Erreur stats: ${statsRes.status}`);
        const statsData = await statsRes.json();
        setStats(statsData);

        const clientsRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/clients-avec-rendezvous/`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!clientsRes.ok) throw new Error(`Erreur clients: ${clientsRes.status}`);
        const clientsData: Client[] = await clientsRes.json();

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

  const sync = async (direction: 'remote_to_local' | 'local_to_remote') => {
    const confirmationMessage =
      direction === 'remote_to_local'
        ? 'Confirmez-vous la synchronisation de Render vers Local ?'
        : 'Confirmez-vous la synchronisation de Local vers Render ?';

    const confirmed = window.confirm(confirmationMessage);
    if (!confirmed) return;

    setSyncLoading(true);
    setSyncLog(null);
    try {
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ direction }),
      });

      const data = await res.json();
      if (data.success) {
        setSyncLog(data.stdout || '✅ Synchronisation terminée avec succès.');
      } else {
        setSyncLog(`❌ Échec : ${data.error}`);
      }
    } catch (err) {
      setSyncLog('❌ Erreur lors de la synchronisation.');
    } finally {
      setSyncLoading(false);
    }
  };

  if (loading) return <div>Chargement...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  const getColor = (dateStr: string | null): string => {
    if (!dateStr) return '';
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const rdvDate = new Date(dateStr);
    rdvDate.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((rdvDate.getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return 'bg-green-100';
    if (diffDays === 0) return 'bg-red-300';
    if (diffDays === 1) return 'bg-orange-300';
    if (diffDays === 2) return 'bg-yellow-300';
    return 'bg-green-50';
  };

  const getRdvMessage = (dateStr: string | null): string => {
    if (!dateStr) return '';
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const rdvDate = new Date(dateStr);
    rdvDate.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((rdvDate.getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24));
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

      {/* Boutons de synchronisation */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
          Synchronisation des données
        </h3>
        <div className="flex gap-4">
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            onClick={() => sync('remote_to_local')}
            disabled={syncLoading}
          >
            🔄 Render ➝ Local
          </button>

          <button
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
            onClick={() => sync('local_to_remote')}
            disabled={syncLoading}
          >
            🔼 Local ➝ Render
          </button>
        </div>

        {syncLoading && <p className="text-yellow-500">⏳ Synchronisation en cours...</p>}
        {syncLog && (
          <pre className="bg-gray-100 text-sm p-3 rounded overflow-x-auto max-h-64 dark:bg-zinc-700 text-gray-800 dark:text-gray-100">
            {syncLog}
          </pre>
        )}
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
