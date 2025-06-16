'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Publicite {
  image: string;
  description: string;
  date_debut: string;
  date_fin: string;
}

const SidebarPharmacie = ({ onClose }: { onClose?: () => void }) => {
  const router = useRouter();
const [publicite, setPublicite] = useState<Publicite | null>(null);

  const handleGoHome = () => {
    router.push('/dashboard/directeur');
    if (onClose) onClose();
  };
useEffect(() => {
  fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/publicite-active/`)
    .then(res => res.json())
    .then(data => {
      // Afficher uniquement s'il y a une image et une description valides
      if (data?.image && data?.description) {
        setPublicite(data);
      }
    })
    .catch(err => console.error("Erreur chargement publicité:", err));
}, []);

  return (
    <aside className="h-full w-72 bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700 dark:from-green-800 dark:via-green-700 dark:to-green-600 shadow-2xl flex flex-col font-sans overflow-hidden rounded-tr-3xl rounded-br-3xl">
      
      {/* Contenu scrollable */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 scrollbar-thin scrollbar-thumb-emerald-400/70 scrollbar-track-transparent">

        {/* Logo + Nom */}
        <div className="flex flex-col items-center">
          <img
            src="/logo.jpeg"
            alt="Logo de NICAPHARM"
            className="w-20 h-20 rounded-full object-cover shadow-lg ring-4 ring-white dark:ring-emerald-700 mb-3"
          />
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="text-white text-xl font-bold tracking-wide text-center"
          >
            COSMO PHARMA
          </motion.h1>
        </div>

        {/* Bouton accueil */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleGoHome}
          className="w-full bg-emerald-100/30 dark:bg-emerald-900 text-white font-semibold py-2 px-4 rounded-xl shadow hover:bg-emerald-200/40 dark:hover:bg-emerald-800 transition"
        >
          🏠 Accueil
        </motion.button>

        {/* Vitrine publicitaire */}
        <div className="bg-white/10 backdrop-blur-lg p-4 rounded-2xl shadow text-white">
          <img
            src="/medicament-pub.jpg"
            alt="Publicité Médicament"
            className="w-full h-36 object-cover rounded-xl mb-2"
          />
          <h2 className="font-bold text-base">Paracétamol 500mg</h2>
          <p className="text-sm">Soulage fièvre et douleurs modérées.</p>
          <p className="text-sm mt-1">📞 +243 970 000 000</p>
        </div>

        {/* Paiement abonnement */}
        <div className="bg-white/10 backdrop-blur-lg p-4 rounded-2xl text-white text-sm shadow">
          <h3 className="font-bold mb-1">💰 Paiement Abonnement</h3>
          <p>Numéro : <strong>0856693433</strong></p>
          <p>Compte : <strong>ARCHIPE KAYEYE</strong></p>
        </div>
      </div>

      {/* Footer (fixe en bas) */}
      <div className="px-4 py-3 text-center text-white text-xs border-t border-white/20">
        <p className="font-semibold">© Nicatech 2024</p>
        <p>Développé par Ir. XUBUNTU</p>
      </div>
    </aside>
  );
};

export default SidebarPharmacie;
