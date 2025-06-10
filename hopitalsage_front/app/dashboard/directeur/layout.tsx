// app/dashboard/pharmacie/layout.tsx
'use client';

import SidebarComptable from '@/components/SidebarPharmacie';
import HeaderComptable from '@/components/HeaderComptable';
import { ReactNode, useEffect, useState } from 'react';

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
  photo: string | null;
  role: string;
  pharmacie: number;
}

export default function PharmacieLayout({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [pharmacie, setPharmacie] = useState<Pharmacie | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');

    if (token) {
      fetch('http://localhost:8000/api/pharmacie/', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then(res => res.json())
        .then(data => setUser(data))
        .catch(err => console.error('Erreur user:', err));

      fetch('http://localhost:8000/api/pharmacie/', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then(res => res.json())
        .then(data => setPharmacie(data))
        .catch(err => console.error('Erreur pharmacie:', err));
    }
  }, []);

  if (!user || !pharmacie) {
    return <div className="text-center p-10 text-gray-500">Chargement...</div>;
  }

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar */}
      <div className="w-64">
        <SidebarComptable />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        <HeaderComptable user={user} pharmacie={pharmacie} />

        <main className="flex-1 p-4 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
