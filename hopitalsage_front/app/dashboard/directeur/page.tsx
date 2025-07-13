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
  const [progress, setProgress] = useState<number>(0);
  const [afficherAlerte, setAfficherAlerte] = useState(false);

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
useEffect(() => {
  const timer = setTimeout(() => {
    setAfficherAlerte(true);
  }, 300000); // 5 minutes

  return () => clearTimeout(timer);
}, []);
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (syncLoading) {
      setProgress(0);
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return prev;
          return prev + Math.floor(Math.random() * 5) + 2;
        });
      }, 250);
    }

    return () => clearInterval(interval);
  }, [syncLoading]);

  const sync = async (direction: 'remote_to_local' | 'local_to_remote') => {
    const confirmationMessage =
      direction === 'remote_to_local'
        ? 'Confirmez-vous la synchronisation de Render vers Local ?'
        : 'Confirmez-vous la synchronisation de Local vers Render ?';

    const confirmed = window.confirm(confirmationMessage);
    if (!confirmed) return;

    setSyncLoading(true);
    setSyncLog(null);
    setProgress(0);

    try {
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ direction }),
      });

      const data = await res.json();
      setProgress(100);

      if (data.success) {
        setSyncLog(`✅ ${data.message || 'Synchronisation terminée avec succès.'}`);
      } else {
        setSyncLog(`❌ ${data.error || 'Erreur inconnue.'}`);
      }
    } catch (err) {
      setProgress(100);
      setSyncLog('❌ Erreur lors de la synchronisation.');
    } finally {
      setSyncLoading(false);
    }
  };

  if (loading) return <div>Chargement...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="bg-white p-6 rounded shadow space-y-8">
      <h2 className="text-2xl font-semibold text-emerald-600">
        Bienvenue sur votre espace pharmacie
      </h2>

      <div className="space-y-2">
        {afficherAlerte && (
  <h2 className="text-sm text-gray-600 italic text-right mb-4">
    🔔 Pensez à sauvegarder vos données chaque soir avant de fermer la pharmacie pour sécuriser vos ventes et recevoir les mises à jour. ⏳ Cette opération peut prendre entre 20 à 40 minutes, merci de patienter jusqu’à la fin.
  </h2>
)}
        <div className="flex gap-4">
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
            onClick={() => sync('remote_to_local')}
            disabled={syncLoading}
          >
            🔄 Enregistrer donnée Cloud vers ➝ Ton Ordinateur
          </button>
          <button
            className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
            onClick={() => sync('local_to_remote')}
            disabled={syncLoading}
          >
            🔼 Enregistrer donnée Ordinateur vers ➝ Cloud
          </button>
        </div>

        {(syncLoading || syncLog) && (
          <div className="space-y-2 mt-2">
            <div className="relative w-full h-6 rounded-full overflow-hidden bg-gray-200">
              <div
                className="absolute left-0 top-0 h-full transition-all duration-300 ease-out"
                style={{
                  width: `${progress}%`,
                  background: progress === 100 && syncLog?.startsWith('✅')
                    ? 'linear-gradient(to right, #00c851, #007e33)'
                    : progress === 100 && syncLog?.startsWith('❌')
                    ? 'linear-gradient(to right, #ff4444, #cc0000)'
                    : 'linear-gradient(to right, #00c6ff, #0072ff)',
                }}
              ></div>
              <div className="absolute w-full h-full flex items-center justify-center font-medium text-gray-800">
                {progress}%
              </div>
            </div>

            <div className="text-center text-sm text-gray-700 italic">
              {syncLoading ? 'Veuillez patienter...' : syncLog}
            </div>

            {progress === 100 && syncLog && (
              <div className="flex justify-center">
                <button
                  className="mt-2 px-4 py-1 text-sm bg-gray-300 rounded hover:bg-gray-400"
                  onClick={() => {
                    setSyncLog(null);
                    setProgress(0);
                  }}
                >
                  Fermer
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Chiffre d'affaires" value={`${stats.chiffre_affaire} Fc`} />
          <StatCard label="Bénéfice du jour" value={`${stats.benefice} Fc`} />
          <StatCard label="Total des ventes" value={`${stats.total_ventes} Fc`} />
          <StatCard label="Produit le plus vendu" value={stats.produit_plus_vendu} />
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-emerald-100 p-4 rounded-xl shadow-md">
      <p className="text-sm text-emerald-800 font-medium">{label}</p>
      <p className="text-xl font-bold text-emerald-900">{value}</p>
    </div>
  );
}
