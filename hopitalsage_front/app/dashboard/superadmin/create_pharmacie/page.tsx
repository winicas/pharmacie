'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Head from 'next/head';

export default function CreerPharmacie() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    nom_pharm: '',
    ville_pharm: '',
    commune_pharm: '',
    adresse_pharm: '',
    rccm: '',
    idnat: '',
    ni: '',
    telephone: '',
  });

 // dashboard/superadmin/create_pharmacie/page.tsx
const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    const response = await fetch('https://pharmacie-hefk.onrender.com/api/pharmacies/', { // ← Slash final ajouté
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
      },
      body: JSON.stringify(formData),
    });
    if (response.ok) {
      router.push('/dashboard/superadmin');
    }
  } catch (error) {
    console.error('Erreur lors de la création :', error);
  }
};

  return (
    <>
      <Head>
        <title>Créer une Pharmacie</title>
      </Head>
      <div className="p-6">
        <h1 className="text-2xl mb-4">Nouvelle Pharmacie</h1>
        <form onSubmit={handleSubmit}>
          {/* Champs du formulaire */}
          <input
            type="text"
            name="nom_pharm"
            value={formData.nom_pharm}
            onChange={(e) =>
              setFormData({ ...formData, nom_pharm: e.target.value })
            }
            className="w-full p-2 border rounded mb-4"
            placeholder="Nom de la pharmacie"
            required
          />

          {/* Champs ajoutés */}
          <input
            type="text"
            name="ville_pharm"
            value={formData.ville_pharm}
            onChange={(e) =>
              setFormData({ ...formData, ville_pharm: e.target.value })
            }
            className="w-full p-2 border rounded mb-4"
            placeholder="Ville"
            required
          />

          <input
            type="text"
            name="commune_pharm"
            value={formData.commune_pharm}
            onChange={(e) =>
              setFormData({ ...formData, commune_pharm: e.target.value })
            }
            className="w-full p-2 border rounded mb-4"
            placeholder="Commune/Arrondissement"
            required
          />

          <textarea
            name="adresse_pharm"
            value={formData.adresse_pharm}
            onChange={(e) =>
              setFormData({ ...formData, adresse_pharm: e.target.value })
            }
            className="w-full p-2 border rounded mb-4"
            placeholder="Adresse détaillée"
            rows={3}
            required
          />

          <input
            type="text"
            name="rccm"
            value={formData.rccm}
            onChange={(e) =>
              setFormData({ ...formData, rccm: e.target.value })
            }
            className="w-full p-2 border rounded mb-4"
            placeholder="Numéro RCCM"
            required
          />

          <input
            type="text"
            name="idnat"
            value={formData.idnat}
            onChange={(e) =>
              setFormData({ ...formData, idnat: e.target.value })
            }
            className="w-full p-2 border rounded mb-4"
            placeholder="Numéro IDNAT"
            required
          />

          <input
            type="text"
            name="ni"
            value={formData.ni}
            onChange={(e) =>
              setFormData({ ...formData, ni: e.target.value })
            }
            className="w-full p-2 border rounded mb-4"
            placeholder="Numéro National"
            required
          />

          <input
            type="text"
            name="telephone"
            value={formData.telephone}
            onChange={(e) =>
              setFormData({ ...formData, telephone: e.target.value })
            }
            className="w-full p-2 border rounded mb-4"
            placeholder="Téléphone"
            required
          />

          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Créer
          </button>
        </form>
      </div>
    </>
  );
}