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
  rccm: string;
  idnat: string;
  ni: string;
  telephone: string;
  logo?: string;
  is_active: boolean;
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

  const handleDelete = async (id: number, name: string) => {
    const confirmDelete = confirm(`Voulez-vous vraiment supprimer "${name}" ?`);
    if (!confirmDelete) return;

    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) return;

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/pharmacies/${id}/`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        toast.success(`Pharmacie "${name}" supprimée`);
        setPharmacies((prev) => prev.filter((p) => p.id !== id));
      } else {
        toast.error('Échec de la suppression');
      }
    } catch (error) {
      toast.error('Erreur réseau lors de la suppression');
    }
  };

  const handleToggleActivation = async (id: number, isActive: boolean) => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) return;

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

  const paginate = (page: number) => {
    setCurrentPage(page);
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
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6"
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="card shadow-lg border-0 p-6 bg-white dark:bg-zinc-800 rounded-xl"
            >
              <h5 className="text-xl font-bold text-[#007BFF]">
                Créer Pharmacie
              </h5>
              <p className="text-gray-600 dark:text-gray-300">
                Ajoutez une nouvelle pharmacie au système.
              </p>
              <a
                href="/dashboard/superadmin/create_pharmacie"
                className="block mt-4 py-2 px-4 rounded-md bg-[#007BFF] text-white hover:bg-[#0056b3] transition-colors"
              >
                Créer Pharmacie
              </a>
            </motion.div>
          </motion.div>

          {/* Liste */}
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
                  <TableHead>RCCM</TableHead>
                  <TableHead>IDNAT</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentPharmacies.length > 0 ? (
                  currentPharmacies.map((pharmacie) => (
                    <TableRow key={pharmacie.id}>
                      <TableCell>{pharmacie.nom_pharm}</TableCell>
                      <TableCell>{pharmacie.commune_pharm}</TableCell>
                      <TableCell>{pharmacie.adresse_pharm}</TableCell>
                      <TableCell>{pharmacie.telephone}</TableCell>
                      <TableCell>{pharmacie.rccm}</TableCell>
                      <TableCell>{pharmacie.idnat}</TableCell>
                      <TableCell className="space-y-1 space-x-1">
                        <a
                          href={`/dashboard/superadmin/edit-pharmacie/${pharmacie.id}`}
                          className="inline-block py-1 px-2 rounded-md bg-[#FFC107] text-white hover:bg-[#e0a800]"
                        >
                          Modifier
                        </a>
                        <button
                          onClick={() => handleDelete(pharmacie.id, pharmacie.nom_pharm)}
                          className="inline-block py-1 px-2 rounded-md bg-[#DC3545] text-white hover:bg-[#bd2130]"
                        >
                          Supprimer
                        </button>
                        <button
                          onClick={() => handleToggleActivation(pharmacie.id, pharmacie.is_active)}
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
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">
                      Aucune pharmacie trouvée
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            {/* Pagination */}
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
