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
}

const SuperAdminDashboard = () => {
  const [pharmacies, setPharmacies] = useState<Pharmacie[]>([]);
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
      if (!accessToken) {
        console.error('Aucun token trouvé !');
        return;
      }

      try {
        const response = await fetch('http://localhost:8000/api/pharmacies/', { // ← Ajout du slash final
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (response.status === 401) {
          console.error('Non autorisé : Token invalide ou expiré');
          return;
        }

        const data = await response.json();
        // Protection si la réponse ne contient pas le tableau attendu
        setPharmacies(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Erreur de chargement des pharmacies :', error);
        setPharmacies([]); // Réinitialiser à un tableau vide
      } finally {
        setLoading(false);
      }
    };

    fetchPharmacies();
  }, []);

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
      {/* Sidebar */}
      <SidebarAdmin userRole={user.role} />

      {/* Contenu Principal */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <HeaderAdmin
          userFullName={user.fullName}
          profilePictureUrl={user.profilePictureUrl}
          role={user.role}
        />

        {/* Section Principale */}
        <main className="p-4 sm:p-6 space-y-6">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-3xl font-bold text-center text-[#007BFF] mb-6"
          >
            Tableau de Bord SuperAdmin
          </motion.h1>

          {/* Boutons d'actions */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6"
          >
            {/* Bouton Créer Pharmacie */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="card shadow-lg border-0 p-6 bg-white dark:bg-zinc-800 rounded-xl overflow-hidden"
            >
              <h5 className="card-title text-xl font-bold text-[#007BFF]">
                Créer Pharmacie
              </h5>
              <p className="card-text text-gray-600 dark:text-gray-300">
                Ajoutez une nouvelle pharmacie au système.
              </p>
              <a
                href="/dashboard/superadmin/create_pharmacie"
                className="btn btn-primary block mt-4 py-2 px-4 rounded-md bg-[#007BFF] text-white hover:bg-[#0056b3] transition-colors"
              >
                Créer Pharmacie
              </a>
            </motion.div>

            {/* Ajoutez d'autres boutons ici (ex: Gérer utilisateurs) */}
          </motion.div>

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
                {pharmacies.length > 0 ? (
                  pharmacies.map((pharmacie) => (
                    <TableRow key={pharmacie.id}>
                      <TableCell>{pharmacie.nom_pharm}</TableCell>
                      <TableCell>{pharmacie.commune_pharm}</TableCell>
                      <TableCell>{pharmacie.adresse_pharm}</TableCell>
                      <TableCell>{pharmacie.telephone}</TableCell>
                      <TableCell>{pharmacie.rccm}</TableCell>
                      <TableCell>{pharmacie.idnat}</TableCell>
                      <TableCell>
                        <a
                          href={`/dashboard/superadmin/edit-pharmacie/${pharmacie.id}`}
                          className="btn btn-warning mr-2 py-1 px-2 rounded-md bg-[#FFC107] text-white hover:bg-[#e0a800] transition-colors"
                        >
                          Modifier
                        </a>
                        <button
                          onClick={() =>
                            confirm(
                              `Êtes-vous sûr de vouloir supprimer ${pharmacie.nom_pharm}?`
                            )
                          }
                          className="btn btn-danger py-1 px-2 rounded-md bg-[#DC3545] text-white hover:bg-[#bd2130] transition-colors"
                        >
                          Supprimer
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
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;