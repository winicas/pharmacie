'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const SidebarPharmacie = ({ onClose }: { onClose?: () => void }) => {
  const [suggestion, setSuggestion] = useState('');
  const router = useRouter();

  const handleSuggestionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Suggestion envoyée:', suggestion);
    setSuggestion('');
  };

  const handleGoHome = () => {
    router.push('/dashboard/directeur');
    if (onClose) onClose();
  };

  return (
    <aside className="h-full bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700 dark:from-green-800 dark:via-green-700 dark:to-green-600 p-5 rounded-3xl shadow-2xl flex flex-col justify-between font-sans w-64">
      <div className="flex flex-col items-center">
        {/* Logo statique depuis /public */}
        <img
          src="/logo.jpeg"
          alt="Logo de NICAPHARM"
          className="w-20 h-20 rounded-full object-cover shadow-lg ring-4 ring-white dark:ring-emerald-700 mb-2"
        />

        {/* Nom de l'application avec animation fluide */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="text-white text-xl font-extrabold tracking-wide mb-4 text-center"
        >
          COSMO PHARMA
        </motion.h1>

        {/* Bouton Accueil */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleGoHome}
          className="bg-emerald-100/30 dark:bg-emerald-900 text-white font-semibold py-2 px-4 rounded-xl shadow-md mb-4 hover:bg-emerald-200/40 dark:hover:bg-emerald-800 transition"
        >
          🏠 Accueil
        </motion.button>

        {/* Message administrateur */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-emerald-200/20 dark:bg-emerald-900 text-white p-4 rounded-2xl text-center text-sm shadow-md mb-6"
        >
          <p className="font-semibold mb-2">📢 Message de l'Administrateur :</p>
          <p>Bienvenue chez <strong>NICAPHARM</strong> 🌿</p>
          <a
            href="https://www.nica.com" 
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-200 underline text-xs mt-2 inline-block"
          >
            Voir notre site
          </a>
        </motion.div>

        {/* Formulaire de suggestion */}
        <form onSubmit={handleSuggestionSubmit} className="w-full flex flex-col gap-3">
          <input
            type="text"
            placeholder="Votre suggestion..."
            value={suggestion}
            onChange={(e) => setSuggestion(e.target.value)}
            className="p-2 rounded-xl text-sm focus:outline-none bg-emerald-100/20 dark:bg-emerald-900/30 placeholder-white text-white"
          />
          <button
            type="submit"
            className="bg-emerald-100/30 dark:bg-emerald-900 text-white font-semibold py-2 rounded-xl hover:bg-emerald-200/40 dark:hover:bg-emerald-800 transition"
          >
            Envoyer
          </button>
        </form>
      </div>

      {/* Footer */}
      <div className="text-center text-white text-xs mt-8">
        <p className="font-bold">© Nicatech 2024</p>
        <p className="mt-1">Développé par William LOSEKA King</p>
      </div>
    </aside>
  );
};

export default SidebarPharmacie;