'use client';

import { useEffect, useState } from 'react';
import SidebarAdmin from '@/components/SidebarAdmin';
import HeaderAdmin from '@/components/HeaderAdmin';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { motion } from 'framer-motion';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface Pharmacie {
  id: number;
  nom_pharm: string;
  ville_pharm: string;
  commune_pharm: string;
  adresse_pharm: string;
  ni: string;
  telephone: string;
  logo?: string;
  is_active: boolean;
  date_expiration?: string;
}

const ITEMS_PER_PAGE = 5;

const SuperAdminDashboard = () => {
  const [pharmacies, setPharmacies] = useState<Pharmacie[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{
    fullName: string;
    profilePictureUrl?: string;
    role: string;
  } | null>(null);

  const [syncLoading, setSyncLoading] = useState(false);
  const [syncLog, setSyncLog] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser({
        fullName: `${parsedUser.first_name} ${parsedUser.last_name}`,
        profilePictureUrl: parsedUser.profile_picture,
        role: parsedUser.role,
      });
    }

    const fetchPharmacies = async () => {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) return;

      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/pharmacies/`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
        });

        const data = await response.json();
        setPharmacies(Array.isArray(data) ? data : []);
      } catch (error) {
        toast.error('Erreur de chargement des pharmacies');
        setPharmacies([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPharmacies();
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

  const handleDateChange = async (id: number, newDate: string) => {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/pharmacies/${id}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ date_expiration: newDate }),
      });

      if (response.ok) {
        toast.success('Date mise à jour');
        setPharmacies((prev) =>
          prev.map((p) => (p.id === id ? { ...p, date_expiration: newDate } : p))
        );
      } else {
        toast.error('Erreur lors de la mise à jour de la date');
      }
    } catch (error) {
      toast.error('Erreur réseau');
    }
  };

  const handleAdd30Days = (id: number, currentDate?: string) => {
    const newDate = addThirtyDays(currentDate);
    handleDateChange(id, newDate);
  };

  const addThirtyDays = (dateStr?: string): string => {
    const date = dateStr ? new Date(dateStr) : new Date();
    date.setDate(date.getDate() + 30);
    return date.toISOString().split('T')[0];
  };

  const handleToggleActivation = async (id: number, isActive: boolean) => {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/pharmacies/${id}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ is_active: !isActive }),
      });

      if (response.ok) {
        toast.success(`Pharmacie ${!isActive ? 'activée' : 'désactivée'}`);
        setPharmacies((prev) =>
          prev.map((p) => (p.id === id ? { ...p, is_active: !isActive } : p))
        );
      } else {
        toast.error('Erreur lors de la mise à jour');
      }
    } catch (error) {
      toast.error('Erreur réseau');
    }
  };

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentPharmacies = pharmacies.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  const totalPages = Math.ceil(pharmacies.length / ITEMS_PER_PAGE);

  const paginate = (page: number) => setCurrentPage(page);

  const isExpired = (dateStr?: string): boolean => {
    if (!dateStr) return false;
    return new Date(dateStr) < new Date();
  };

  if (loading || !user) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#007BFF]"
        ></motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row min-h-screen bg-gray-100 dark:bg-zinc-950">
      <ToastContainer />
      <SidebarAdmin userRole={user.role} />
      <div className="flex-1 flex flex-col">
        <HeaderAdmin
          userFullName={user.fullName}
          profilePictureUrl={user.profilePictureUrl}
          role={user.role}
        />
        <main className="p-4 sm:p-6 space-y-6">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-3xl font-bold text-center text-[#007BFF] mb-6"
          >
            Tableau de Bord SuperAdmin
          </motion.h1>

          {/* Boutons de synchronisation */}
          <div className="space-y-2 bg-white dark:bg-zinc-900 rounded-xl shadow-lg p-4">
            <h2 className="text-lg font-semibold">Synchronisation des données</h2>
            <div className="flex gap-4">
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
                onClick={() => sync('remote_to_local')}
                disabled={syncLoading}
              >
                🔄 Cloud vers Local
              </button>
              <button
                className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
                onClick={() => sync('local_to_remote')}
                disabled={syncLoading}
              >
                🔼 Local vers Cloud
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
              </div>
            )}
          </div>

          {/* Liste des pharmacies */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="bg-white dark:bg-zinc-900 rounded-xl shadow-lg p-4"
          >
            <h2 className="text-2xl font-bold text-[#007BFF] mb-4">
              Pharmacies Enregistrées
            </h2>
            {/* Table ... (reste inchangé) */}
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
