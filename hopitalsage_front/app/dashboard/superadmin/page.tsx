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

  const addThirtyDays = (dateStr?: string): string => {
    const date = dateStr ? new Date(dateStr) : new Date();
    date.setDate(date.getDate() + 30);
    return date.toISOString().split('T')[0];
  };

  const handleAdd30Days = (id: number, currentDate?: string) => {
    const newDate = addThirtyDays(currentDate);
    handleDateChange(id, newDate);
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
          prev.map((p) =>
            p.id === id ? { ...p, is_active: !isActive } : p
          )
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

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="bg-white dark:bg-zinc-900 rounded-xl shadow-lg p-4"
          >
            <h2 className="text-2xl font-bold text-[#007BFF] mb-4">
              Pharmacies Enregistrées
            </h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Commune</TableHead>
                  <TableHead>Adresse</TableHead>
                  <TableHead>Téléphone</TableHead>
                  <TableHead>Expiration</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentPharmacies.length > 0 ? (
                  currentPharmacies.map((pharmacie) => {
                    const expired = isExpired(pharmacie.date_expiration);
                    return (
                      <TableRow
                        key={pharmacie.id}
                        className={expired ? 'bg-red-100 dark:bg-red-900' : ''}
                      >
                        <TableCell>{pharmacie.nom_pharm}</TableCell>
                        <TableCell>{pharmacie.commune_pharm}</TableCell>
                        <TableCell>{pharmacie.adresse_pharm}</TableCell>
                        <TableCell>{pharmacie.telephone}</TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-2">
                            <input
                              type="date"
                              value={pharmacie.date_expiration?.split('T')[0] || ''}
                              onChange={(e) =>
                                handleDateChange(pharmacie.id, e.target.value)
                              }
                              className="border rounded px-2 py-1 text-sm"
                            />
                            <button
                              onClick={() =>
                                handleAdd30Days(pharmacie.id, pharmacie.date_expiration)
                              }
                              className="text-xs text-blue-600 underline"
                            >
                              Ajouter 30 jours
                            </button>
                          </div>
                        </TableCell>
                        <TableCell className="space-y-1 space-x-1">
                          <button
                            onClick={() =>
                              handleToggleActivation(pharmacie.id, pharmacie.is_active)
                            }
                            className={`inline-block py-1 px-2 rounded-md ${
                              pharmacie.is_active
                                ? 'bg-gray-500 hover:bg-gray-700'
                                : 'bg-green-600 hover:bg-green-800'
                            } text-white`}
                          >
                            {pharmacie.is_active ? 'Désactiver' : 'Activer'}
                          </button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">
                      Aucune pharmacie trouvée
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            <div className="flex justify-center mt-4 space-x-2">
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => paginate(i + 1)}
                  className={`px-3 py-1 rounded ${
                    currentPage === i + 1
                      ? 'bg-[#007BFF] text-white'
                      : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
