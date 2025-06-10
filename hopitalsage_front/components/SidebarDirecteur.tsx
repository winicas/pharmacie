'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

const SidebarPharmacie = ({ onClose }: { onClose?: () => void }) => {
  const [suggestion, setSuggestion] = useState('');
  const [message, setMessage] = useState('');
  const router = useRouter();
  const [isCopying, setIsCopying] = useState(false);
  const [copyProgress, setCopyProgress] = useState<number | null>(null);

  


  const handleSuggestionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Suggestion envoyée:', suggestion);
    setSuggestion('');
  };

  const handleGoHome = () => {
    router.push('/dashboard/comptable');
    if (onClose) onClose();
  };

const handleSauvegardeSQL = async () => {
  const token = localStorage.getItem("accessToken");
  if (!token) return;

  try {
    const response = await fetch("https://pharmacie-hefk.onrender.com/api/sauvegarde-sql/", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) throw new Error("Erreur lors de la sauvegarde SQL");

    // Téléchargement manuel
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "backup.sql";
    document.body.appendChild(a);
    a.click();
    a.remove();

  } catch (err) {
    console.error("Erreur sauvegarde SQL:", err);
  }
};
// Juste après handleSauvegardeSQL
const handleCopierVersUSB = async () => {
  const token = localStorage.getItem("accessToken");
  if (!token) {
    alert("Vous devez être connecté.");
    return;
  }

  try {
    setIsCopying(true);

    // Lance la requête
    const copiePromise = fetch("https://pharmacie-hefk.onrender.com/api/copier-usb/", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }).then(async (response) => {
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Erreur serveur");
      alert("✅ " + result.message);
    });

    // Forcer un délai minimal de 15 secondes (15000 ms)
    const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));
    await Promise.all([copiePromise, delay(15000)]);

  } catch (error: any) {
    alert("❌ Erreur : " + error.message);
  } finally {
    setIsCopying(false);
  }
};

{isCopying && (
  <div
    style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0,0,0,0.7)',
      color: 'white',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      fontSize: '1.8rem',
      zIndex: 9999,
      flexDirection: 'column',
      gap: '20px',
      userSelect: 'none',
    }}
  >
    <div className="animate-spin" style={{ fontSize: '3rem' }}>🔄</div>
    <div>Copie en cours, merci de patienter...</div>
  </div>
)}



  return (
    <aside className="h-full bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700 dark:from-green-800 dark:via-green-700 dark:to-green-600 p-5 rounded-3xl shadow-2xl flex flex-col justify-between font-sans w-64">
      <div className="flex flex-col items-center">
        {/* Logo */}
        <img
          src="/logo.jpeg"
          alt="Logo de la pharmacie"
          className="w-20 h-20 rounded-full object-cover shadow-lg ring-4 ring-white dark:ring-emerald-700 mb-4"
        />

        {/* Nom de l'app */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="text-white text-xl font-extrabold tracking-wide mb-6 text-center"
        >
          COSMO PHARMA
        </motion.div>

        {/* Accueil */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleGoHome}
          className="bg-emerald-100/30 dark:bg-emerald-900 text-white font-semibold py-2 px-4 rounded-xl shadow-md mb-4 hover:bg-emerald-200/40 dark:hover:bg-emerald-800 transition"
        >
          🏠 Accueil
        </motion.button>

        {/* Message Admin */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-emerald-200/20 dark:bg-emerald-900 text-white p-4 rounded-2xl text-center text-sm shadow-md mb-6"
        >
          <p className="font-semibold mb-2">📢 Message de l'Administrateur :</p>
          <p>Bienvenue chez <strong>NICA PHARM</strong> 🌿</p>
          <a
            href="https://www.nica.com" 
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-200 underline text-xs mt-2 inline-block"
          >
            Voir notre site
          </a>
        </motion.div>

        {/* Bouton Sauvegarder -> Redirection vers /dashboard/directeur/export-data */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSauvegardeSQL}
          className="w-full flex items-center justify-center gap-2 bg-blue-100/30 dark:bg-blue-900 text-white font-semibold py-2 px-4 rounded-xl shadow-md mb-4 hover:bg-blue-200/40 dark:hover:bg-blue-800 transition"
        >
          💾 Sauvegarder les données
        </motion.button>
     
<motion.button
  onClick={handleCopierVersUSB}
  disabled={isCopying}
  className="w-full bg-green-600 text-white py-2 rounded-xl shadow-md mb-4 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
>
  Copier vers la clé USB
</motion.button>


        {message && (
          <p className="text-white text-xs text-center mb-4">
            {message}
          </p>
        )}

        {/* Suggestion */}
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
        <p className="font-bold">© Nicatech 2025</p>
        <p className="mt-1">Développé par William LOSEKA Kings</p>
      </div>
    </aside>
  );
};

export default SidebarPharmacie;