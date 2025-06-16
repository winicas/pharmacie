'use client';

import Link from 'next/link';
import { useState } from 'react';

interface SidebarProps {
  userRole: string; // Rôle de l'utilisateur (superuser, admin, directeur, comptable)
}

const SidebarAdmin = ({ userRole }: SidebarProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    {
      label: 'Tableau de Bord',
      icon: '📊',
      path: '/dashboard/superadmin',
      roles: ['superuser', 'admin', 'directeur', 'comptable'],
    },
    {
      label: 'Ajouter PHARMACIE',
      icon: '🏫',
      path: '/dashboard/superadmin/create_pharmacie',
      roles: ['superuser', 'admin'],
    },
    {
      label: 'Ajouter Directeur',
      icon: '👨‍💼',
      path: '/dashboard/superadmin/create-directeur',
      roles: ['superuser', 'admin'],
    },
    {
      label: 'Gerer le taux Echange',
      icon: '🧑‍💻',
      path: '/dashboard/superadmin/taux-echange',
      roles: ['superuser', 'admin'],
    },
     {
      label: 'CREER FOURNISSEUR',
      icon: '🧑‍💻',
      path: '/dashboard/superadmin/fabricant',
      roles: ['superuser', 'admin'],
    },
     {
      label: 'CREER MEDICAMENT FOURNISSEUR',
      icon: '🧑‍💻',
      path: '/dashboard/superadmin/produit-fabricant',
      roles: ['superuser', 'admin'],
    },
      {
      label: 'MODIFIER PRIX MEDICAMENT FOURNISSEUR',
      icon: '🧑‍💻',
      path: '/dashboard/superadmin/modifier-prixachat-fourni',
      roles: ['superuser', 'admin'],
    },
      {
      label: 'CARTE DE TOUTE MES PHARMACIES',
      icon: '🧑‍💻',
      path: '/dashboard/superadmin/carte',
      roles: ['superuser', 'admin'],
    },

        {
      label: 'PUBLICITE',
      icon: '🧑‍💻',
      path: '/dashboard/superadmin/publicite',
      roles: ['superuser', 'admin'],
    },

    {
      label: 'Déconnexion',
      icon: '🚪',
      path: '/login',
      roles: ['superuser', 'admin', 'directeur', 'comptable'],
    },
  ];

  return (
    <aside
      className={`bg-white dark:bg-zinc-900 h-screen p-4 shadow-md transition-width ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Logo ou Titre */}
      <div
        className="flex items-center justify-between mb-4 cursor-pointer"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        {!isCollapsed && (
          <span className="text-xl font-bold text-[#007BFF]">NicaTech</span>
        )}
        <button className="text-2xl">{isCollapsed ? '☰' : '×'}</button>
      </div>

      {/* Menu Items */}
      <nav>
        {menuItems.map((item, index) => (
          <div key={index}>
            {item.roles.includes(userRole) && (
              <Link
                href={item.path}
                className={`flex items-center py-2 px-4 rounded-md mb-2 hover:bg-[#007BFF] hover:text-white transition-colors ${
                  isCollapsed ? 'justify-center' : ''
                }`}
              >
                {isCollapsed ? null : <span>{item.icon} </span>}
                {!isCollapsed && <span>{item.label}</span>}
              </Link>
            )}
          </div>
        ))}
      </nav>

      {/* Nom de l'application */}
      <div
        className={`mt-auto text-center py-4 border-t border-gray-200 dark:border-zinc-700 transition-opacity ${
          isCollapsed ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <span className="text-sm font-bold text-[#007BFF]">NicaTech</span>
      </div>

      {/* Champ pour les suggestions */}
      <div
        className={`mb-4 mt-auto flex flex-col items-center space-y-2 border-t border-gray-200 dark:border-zinc-700 p-4 transition-opacity ${
          isCollapsed ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Votre conseil pour nous permettre d'améliorer :
        </p>
        <p className="italic text-sm text-gray-500 dark:text-gray-400">Quoi Chef ?</p>
      </div>
    </aside>
  );
};

export default SidebarAdmin;