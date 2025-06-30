'use client';

import { LogOut, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import axios from 'axios';

interface Pharmacie {
  id: number;
  nom_pharm: string;
  adresse_pharm: string;
  telephone: string | null;
}

interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  profile_picture: string | null;
  role: string;
  pharmacie: number;
}

interface HeaderPharmacieProps {
  pharmacie: Pharmacie | null; // Peut être null au début
  user: User | null; // Peut être null au début
}

type MenuItem = {
  href?: string;
  label: string;
  icon: React.ReactNode;
  isTitle?: boolean;
  submenu?: {
    href: string;
    label: string;
    icon: React.ReactNode;
  }[];
};

const HeaderPharmacie = ({ pharmacie, user }: HeaderPharmacieProps) => {
  const [expandedMenus, setExpandedMenus] = useState<{ [key: string]: boolean }>({});
  const [openMenu, setOpenMenu] = useState<null | 'main' | 'clientUser'>(null);
  const router = useRouter();

  const menuRefs = {
    main: useRef<HTMLDivElement>(null),
    clientUser: useRef<HTMLDivElement>(null),
  };

  const handleLogout = async () => {
  const refreshToken = localStorage.getItem("refreshToken");

  try {
    if (refreshToken) {
      await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/logout/`, {
        refresh: refreshToken,
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`
        }
      });
    }
  } catch (error) {
    console.error("Erreur de déconnexion :", error);
  }

  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  router.push("/login");
};

  const toggleExpand = (label: string) => {
    setExpandedMenus(prev => ({ ...prev, [label]: !prev[label] }));
  };

  const renderSubmenu = (submenu: MenuItem["submenu"], parentKey: string, isOpen: boolean) => (
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          key={parentKey}
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden"
        >
          {submenu?.map((item, index) => (
            <Link href={item.href} key={index}>
              <div className="flex items-center gap-3 px-6 py-2 hover:bg-emerald-200 dark:hover:bg-emerald-800 text-sm text-gray-700 dark:text-white transition cursor-pointer">
                <span>{item.icon}</span>
                <span className="ml-2">{item.label}</span>
              </div>
            </Link>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );

  const renderMenu = (items: MenuItem[], refKey: 'main' | 'clientUser') => (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="absolute left-0 mt-2 w-72 bg-white dark:bg-emerald-900 rounded-xl shadow-xl z-50 overflow-hidden"
      ref={menuRefs[refKey]}
    >
      {items.map((item, index) => (
        <div key={index}>
          {!item.isTitle ? (
            <Link href={item.href!} onClick={() => setOpenMenu(null)}>
              <div className="flex items-center gap-3 px-4 py-3 hover:bg-emerald-100 dark:hover:bg-emerald-800 text-sm font-medium cursor-pointer group">
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </div>
            </Link>
          ) : (
            <div>
              <div
                className="flex items-center justify-between px-4 py-3 font-semibold cursor-pointer bg-emerald-200 dark:bg-emerald-800 text-gray-800 dark:text-white"
                onClick={() => toggleExpand(item.label)}
              >
                <div className="flex items-center gap-2">
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                {item.submenu && (
                  <ChevronDown
                    size={16}
                    className={`transition-transform ${
                      expandedMenus[item.label] ? "rotate-180" : ""
                    }`}
                  />
                )}
              </div>
              {item.submenu && renderSubmenu(item.submenu, item.label, !!expandedMenus[item.label])}
            </div>
          )}
        </div>
      ))}
    </motion.div>
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        (menuRefs.main.current && !menuRefs.main.current.contains(event.target as Node)) &&
        (menuRefs.clientUser.current && !menuRefs.clientUser.current.contains(event.target as Node))
      ) {
        setOpenMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const mainMenuItems: MenuItem[] = [
    {
      label: "Vente",
      icon: "🛍️",
      submenu: [
        { href: "/dashboard/comptable/ventes", label: "Faire la vente ici", icon: "🛒" },
        { href: "/dashboard/comptable/client/ajouter-client", label: "Créer Nouveau Client", icon: "👨⚕️" },
        { href: "#", label: "Historique ventes", icon: "⏳" },
        { href: "#", label: "Statistiques", icon: "📊" },
      ],
      isTitle: true,
    },
  ];

  const clientUserMenuItems: MenuItem[] = [
    {
      label: "Clients",
      icon: "🧑‍🤝‍🧑",
      submenu: [
        { href: "#", label: "Liste des clients", icon: "📁" },
        { href: "/dashboard/comptable/client/ajouter-client", label: "Ajouter un client", icon: "➕" },
      ],
      isTitle: true,
    },
  ];

  return (
    <motion.header
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7 }}
      className="flex justify-between items-center px-8 py-5 m-4 rounded-3xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-emerald-700 dark:from-emerald-900 dark:via-emerald-800 dark:to-emerald-700 shadow-2xl backdrop-blur-md relative"
    >
      {/* Menu Principal */}
      <div className="flex items-center gap-4 relative">
        <div className="relative">
          <button
            onClick={() => setOpenMenu(openMenu === "main" ? null : "main")}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-100/30 hover:bg-emerald-200/40 text-white rounded-xl transition-all text-sm"
          >
            🧭 Menu Principal
          </button>
          <AnimatePresence>
            {openMenu === "main" && renderMenu(mainMenuItems, "main")}
          </AnimatePresence>
        </div>

        {/* Menu Utilisateurs / Client */}
        <div className="relative">
          <button
            onClick={() => setOpenMenu(openMenu === "clientUser" ? null : "clientUser")}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-100/30 hover:bg-emerald-200/40 text-white rounded-xl transition-all text-sm"
          >
            👥 Gestion utilisateurs
          </button>
          <AnimatePresence>
            {openMenu === "clientUser" && renderMenu(clientUserMenuItems, "clientUser")}
          </AnimatePresence>
        </div>
      </div>

      {/* Nom de la pharmacie centré */}
      <div className="absolute left-1/2 transform -translate-x-1/2 top-5 text-center">
        <h1 className="text-white text-xl font-bold tracking-wide">
          {pharmacie?.nom_pharm || "Nom de la pharmacie"}
        </h1>
      </div>

      {/* Infos utilisateur à droite */}
      <div className="flex items-center gap-4">
        <Image
          src={user?.profile_picture || '/avatar.jpg'} // Image par défaut
          alt="Photo de profil"
          width={42}
          height={42}
          className="rounded-full border-2 border-white shadow-sm"
        />
        <div className="text-white text-right leading-tight">
          <div className="font-semibold">
            {user?.first_name || 'Prénom'} {user?.last_name || 'Nom'}
          </div>
          <div className="text-xs opacity-80">{user?.role || 'Rôle'}</div>
        </div>
        <button
          onClick={handleLogout}
          className="text-white hover:text-red-300 transition"
          title="Se déconnecter"
        >
          <LogOut size={22} />
        </button>
      </div>
    </motion.header>
  );
};

export default HeaderPharmacie;