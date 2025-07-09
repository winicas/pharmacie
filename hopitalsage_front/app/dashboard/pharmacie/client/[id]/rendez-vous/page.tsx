'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'next/navigation';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import PharmacieLayout from '@/app/dashboard/directeur/layout'; // ✅ Import du layout global

interface RendezVous {
  id: number;
  client: number;
  date: string;
  heure: string;
  statut: 'à venir' | 'passé';
}

export default function RendezVousPage() {
  const { id } = useParams(); // ✅ Récupère le paramètre [id] via useParams()
  const clientId = parseInt(id as string); // ✅ Cast vers string si nécessaire

  const [date, setDate] = useState<Date | null>(null);
  const [rendezVous, setRendezVous] = useState<RendezVous[]>([]);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [heure, setHeure] = useState<string>('');

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) setAccessToken(token);
  }, []);

  useEffect(() => {
    if (accessToken) fetchRendezVous();
  }, [accessToken]);

  const fetchRendezVous = async () => {
    try {
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/rendez-vous/client/${clientId}/`, // ✅ URL remplacée
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      setRendezVous(res.data);
    } catch (error) {
      console.error('Erreur de chargement des rendez-vous', error);
    }
  };

  const enregistrerRendezVous = async () => {
    if (!date || !heure) return;

    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/rendez-vous/`, // ✅ URL remplacée
        {
          client: clientId,
          date: date.toISOString().split('T')[0],
          heure: heure,
        },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      setRendezVous((prev) => [...prev, res.data]);
      setDate(null);
      setHeure('');
    } catch (error) {
      console.error("Erreur d'enregistrement du rendez-vous", error);
    }
  };

  return (
    <PharmacieLayout>
      <div className="p-6 max-w-2xl mx-auto bg-white rounded-xl shadow">
        <h1 className="text-xl font-semibold text-emerald-700 mb-4">
          Gérer les Rendez-vous du Client #{clientId}
        </h1>

        <div className="mb-6">
          <label className="block text-gray-600 font-medium mb-2">
            Choisir une date de rendez-vous :
          </label>
          <div className="flex gap-2 items-center flex-wrap">
            <DatePicker
              selected={date ?? null}
              onChange={(date: Date | null) => setDate(date)}
              className="border rounded px-4 py-2 w-full sm:w-auto"
              dateFormat="yyyy-MM-dd"
              minDate={new Date()}
              placeholderText="Sélectionner une date"
            />
            <input
              type="time"
              value={heure}
              onChange={(e) => setHeure(e.target.value)}
              className="border rounded px-4 py-2 w-full sm:w-auto"
              required
            />
            <button
              onClick={enregistrerRendezVous}
              className="bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700 transition w-full sm:w-auto"
            >
              Enregistrer
            </button>
          </div>
        </div>

        <h2 className="text-lg font-semibold text-gray-700 mb-2">Historique des rendez-vous</h2>
        <ul className="space-y-2">
          {rendezVous.length === 0 && (
            <li className="text-gray-500">Aucun rendez-vous enregistré.</li>
          )}
          {rendezVous.map((rdv) => (
            <li
              key={rdv.id}
              className={`p-3 rounded border ${
                rdv.statut === 'passé'
                  ? 'bg-gray-100 text-gray-500'
                  : 'bg-emerald-50 text-emerald-800'
              }`}
            >
              {rdv.date} à {rdv.heure} ({rdv.statut})
            </li>
          ))}
        </ul>
      </div>
    </PharmacieLayout>
  );
}