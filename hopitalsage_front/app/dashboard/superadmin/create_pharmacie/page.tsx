'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Head from 'next/head';

export default function CreerPharmacie() {
  const router = useRouter();

  // Valeur par défaut pour latitude/longitude (ex: Kinshasa)
  const [formData, setFormData] = useState({
    nom_pharm: '',
    ville_pharm: '',
    commune_pharm: '',
    adresse_pharm: '',
    rccm: '',
    idnat: '',
    ni: '',
    telephone: '',
    latitude: -1.2921,     // <-- valeur par défaut
    longitude: 36.8219,    // <-- valeur par défaut
    montant_mensuel: '',
  });

  // Tu peux garder ce useEffect vide ou le supprimer si tu n'as plus besoin de géoloc
  useEffect(() => {
    // Optionnel : afficher un message pour dire qu'on est en mode "défaut"
    console.log("Mode test : Coordonnées par défaut utilisées");
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/pharmacies/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        router.push('/dashboard/superadmin');
      } else {
        const error = await response.json();
        console.error('Erreur serveur:', error);
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
          {/** Champs classiques */}
          {[
            { name: 'nom_pharm', placeholder: 'Nom de la pharmacie' },
            { name: 'ville_pharm', placeholder: 'Ville' },
            { name: 'commune_pharm', placeholder: 'Commune/Arrondissement' },
            { name: 'adresse_pharm', placeholder: 'Adresse détaillée', type: 'textarea' },
            { name: 'rccm', placeholder: 'Numéro RCCM' },
            { name: 'idnat', placeholder: 'Numéro IDNAT' },
            { name: 'ni', placeholder: 'Numéro National' },
            { name: 'telephone', placeholder: 'Téléphone' },
          ].map((field) =>
            field.type === 'textarea' ? (
              <textarea
                key={field.name}
                name={field.name}
                value={(formData as any)[field.name]}
                onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                className="w-full p-2 border rounded mb-4"
                placeholder={field.placeholder}
                required
                rows={3}
              />
            ) : (
              <input
                key={field.name}
                type="text"
                name={field.name}
                value={(formData as any)[field.name]}
                onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                className="w-full p-2 border rounded mb-4"
                placeholder={field.placeholder}
                required
              />
            )
          )}

          {/** Champ pour le montant mensuel */}
          <input
            type="number"
            step="0.01"
            name="montant_mensuel"
            value={formData.montant_mensuel}
            onChange={(e) => setFormData({ ...formData, montant_mensuel: e.target.value })}
            className="w-full p-2 border rounded mb-4"
            placeholder="Montant mensuel à payer"
            required
          />

          {/* Coordonnées GPS affichées en lecture seule */}
          <div className="text-sm text-gray-500 mb-2">
            📍 Position GPS utilisée :
            <br />
            Latitude : {formData.latitude} / Longitude : {formData.longitude}
          </div>

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