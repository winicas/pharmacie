'use client';

import { useState } from 'react';

export default function PubliciteForm() {
  const [image, setImage] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [message, setMessage] = useState('');
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!image || !description || !dateDebut || !dateFin) {
    setMessage('Veuillez remplir tous les champs.');
    return;
  }

  const token = localStorage.getItem('accessToken');  // ou sessionStorage selon ta config

  if (!token) {
    setMessage('Vous devez être connecté pour effectuer cette action.');
    return;
  }

  const formData = new FormData();
  formData.append('image', image);
  formData.append('description', description);
  formData.append('date_debut', dateDebut);
  formData.append('date_fin', dateFin);

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/publicite-active`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        // Pas de Content-Type ici car fetch mettra le bon boundary automatiquement pour FormData
      },
      body: formData,
    });

    if (res.ok) {
      setMessage('Publicité créée avec succès !');
      setImage(null);
      setDescription('');
      setDateDebut('');
      setDateFin('');
    } else {
      const data = await res.json();
      setMessage('Erreur : ' + (data.detail || 'Impossible de créer la publicité'));
    }
  } catch (error) {
    setMessage('Erreur serveur, réessayez plus tard.');
  }
};

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-md shadow-md">
      <h1 className="text-xl font-bold mb-4">Créer une nouvelle publicité</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="image" className="block font-semibold mb-1">Image</label>
          <input
            type="file"
            accept="image/*"
            id="image"
            onChange={e => e.target.files && setImage(e.target.files[0])}
            required
            className="border p-2 rounded w-full"
          />
        </div>

        <div>
          <label htmlFor="description" className="block font-semibold mb-1">Description</label>
          <textarea
            id="description"
            value={description}
            onChange={e => setDescription(e.target.value)}
            required
            rows={3}
            className="border p-2 rounded w-full"
          />
        </div>

        <div>
          <label htmlFor="dateDebut" className="block font-semibold mb-1">Date Début</label>
          <input
            type="date"
            id="dateDebut"
            value={dateDebut}
            onChange={e => setDateDebut(e.target.value)}
            required
            className="border p-2 rounded w-full"
          />
        </div>

        <div>
          <label htmlFor="dateFin" className="block font-semibold mb-1">Date Fin</label>
          <input
            type="date"
            id="dateFin"
            value={dateFin}
            onChange={e => setDateFin(e.target.value)}
            required
            className="border p-2 rounded w-full"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-emerald-600 text-white py-2 rounded hover:bg-emerald-700 transition"
        >
          Enregistrer la publicité
        </button>
      </form>

      {message && <p className="mt-4 text-center text-red-600">{message}</p>}
    </div>
  );
}
