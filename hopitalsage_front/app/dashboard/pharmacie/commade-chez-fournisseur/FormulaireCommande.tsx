'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion } from 'framer-motion';
import ApercuBonCommande from '../commade-chez-fournisseur/ApercuBonCommande';
export interface ProduitFabricant {
  id: number;
  nom: string;
 
}

interface LigneCommande {
  nom: string;
  fabricant?: string;
  quantite: number;
  identifiant: string;
  prix_achat: number;
  id?: number;
}

export default function FormulaireCommande() {
  const [fabricants, setFabricants] = useState<any[]>([]);
  const [produits, setProduits] = useState<any[]>([]);
  const [selectedFabricant, setSelectedFabricant] = useState<any>(null);
  const [panier, setPanier] = useState<LigneCommande[]>([]);
  const [requisitions, setRequisitions] = useState<any[]>([]);
  const [showPDF, setShowPDF] = useState(false);
  const [commandeConfirmee, setCommandeConfirmee] = useState(null);

  const accessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

  useEffect(() => {
    if (accessToken) {
      axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/fabricants/`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      }).then((res) => setFabricants(res.data));

      axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/requisitions/`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      }).then((res) => setRequisitions(res.data));
    }
  }, [accessToken]);

  const handleFabricantSelect = async (id: string) => {
    const fabricant = fabricants.find((f) => f.id === parseInt(id));
    setSelectedFabricant(fabricant);
    setShowPDF(false);
    setPanier([]);

    const res = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/fabricants/${id}/produits/`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
      const produitsTries = res.data.sort((a: ProduitFabricant, b: ProduitFabricant) =>
      a.nom.localeCompare(b.nom)
    );
    setProduits(produitsTries);
    setProduits(res.data);
  };

  const ajouterAuPanier = (produit: any) => {
    const identifiant = `${produit.nom}-${produit.id}`;
    const existe = panier.find((p) => p.identifiant === identifiant);

    if (!existe) {
      setPanier([
        ...panier,
        {
          nom: produit.nom,
          fabricant: produit.fabricant,
          quantite: 1,
          identifiant,
          prix_achat: produit.prix_achat,
          id: produit.id,
        },
      ]);
    } else {
      setPanier(panier.map((p) =>
        p.identifiant === identifiant
          ? { ...p, quantite: p.quantite + 1 }
          : p
      ));
    }
  };

  const updateQuantite = (index: number, value: string) => {
    const copy = [...panier];
    copy[index].quantite = parseInt(value) || 0;
    setPanier(copy);
  };

  const supprimerDuPanier = (identifiant: string) => {
    setPanier(panier.filter(p => p.identifiant !== identifiant));
  };

  const total = panier.reduce((acc, p) => acc + p.quantite * p.prix_achat, 0);

 const handleConfirmerCommande = async () => {
  if (!selectedFabricant) {
    alert("Veuillez sélectionner un fabricant.");
    return;
  }

  if (panier.length === 0) {
    alert("Le panier est vide. Veuillez ajouter des produits avant de confirmer la commande.");
    return;
  }

  const lignesInvalides = panier.filter((ligne) => !ligne.id || ligne.quantite <= 0);
  if (lignesInvalides.length > 0) {
    alert("Certaines lignes de commande sont invalides. Veuillez vérifier les produits ajoutés.");
    return;
  }

  const confirmation = window.confirm("Voulez-vous vraiment confirmer la commande ?");
  if (!confirmation) {
    return;
  }

  const payload = {
    fabricant: selectedFabricant.id,
    lignes: panier
      .filter((l) => l.quantite > 0)
      .map((l) => ({
        produit_fabricant: l.id,
        quantite_commandee: l.quantite,
        prix_achat: l.prix_achat,
      })),
  };

  try {
    await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/commandes-produits/`, payload, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    // Stocke une copie du panier pour l'utiliser dans le PDF
    setCommandeConfirmee({
      fabricant: selectedFabricant,
      lignes: [...panier],
    });

    setShowPDF(true); // affiche le PDF
    setPanier([]); // vide le panier (n'affectera pas le PDF qui utilise commandeConfirmee)

  } catch (error: any) {
    console.error("Erreur lors de la confirmation de la commande :", error);
    if (error.response && error.response.data) {
      alert(`Erreur : ${error.response.data.message || "Une erreur s'est produite."}`);
    } else {
      alert("Erreur lors de la commande.");
    }
  }
};

const ajouterDepuisRequisition = async (req: any) => {
  if (!selectedFabricant || req.fabricant_nom !== selectedFabricant.nom) {
    alert("Le produit ne correspond pas au fabricant sélectionné.");
    return;
  }

  const idProduit = req.produit_fabricant_id;

  if (!idProduit) {
    alert("Ce produit n'a pas d'ID valide. Veuillez contacter l'administrateur.");
    return;
  }

  // Ajouter au panier
  ajouterAuPanier({
    nom: req.nom_produit || req.nom_personnalise,
    prix_achat: req.prix_achat ?? 0,
    id: idProduit,
    fabricant: selectedFabricant.nom,
    quantite: req.nombre_demandes || 1,
  });

  try {
    // Suppression dans la base de données
    await axios.delete(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/requisitions/${req.id}/`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    // Mise à jour de l'état requisitions (côté client)
    setRequisitions(prev => prev.filter(r => r.id !== req.id));
  } catch (error) {
    console.error("Erreur lors de la suppression de la réquisition :", error);
    alert("Échec de la suppression de la réquisition.");
  }
};


  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold text-blue-700">🧾 Créer une commande</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Colonne Gauche : Fabricant, Produits, Réquisitions */}
        <div className="space-y-4 text-sm">
          <Card className="p-4">
            <label className="block font-medium mb-1">Sélectionner un fabricant :</label>
            <select
              onChange={(e) => handleFabricantSelect(e.target.value)}
              className="w-full border p-2 rounded-md"
            >
              <option value="">-- Choisir --</option>
              {fabricants.map((f) => (
                <option key={f.id} value={f.id}>{f.nom}</option>
              ))}
            </select>
          </Card>

          {/* Réquisitions */}
          {requisitions.length > 0 && (
            <Card className="p-4 bg-yellow-50 border border-yellow-200">
              <h2 className="font-semibold text-yellow-800 mb-2">📝 Réquisitions</h2>
              <ScrollArea className="h-[200px] pr-2">
                <div className="space-y-2">
                  {requisitions.map((r) => (
                    <div key={r.id} className="border p-2 rounded-md flex justify-between items-center">
                      <div>
                        <div className="font-semibold">{r.nom_produit || r.nom_personnalise}</div>
                        <div className="text-xs text-gray-600">Fabricant : {r.fabricant_nom || 'N/A'}</div>
                        {r.prix_achat !== undefined && (
                          <div className="text-xs text-gray-600">Prix : {Number(r.prix_achat).toFixed(2)} Fc</div>
                        )}
                      </div>
                      <Button size="sm" onClick={() => ajouterDepuisRequisition(r)}>Ajouter</Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </Card>
          )}

          {/* Liste Produits */}
          {produits.length > 0 && (
            <Card className="p-4">
              <h2 className="font-semibold mb-2">📦 Produits</h2>
              <ScrollArea className="h-[300px] pr-2">
                <div className="space-y-2">
                  {produits.map((prod) => (
                    <div key={prod.id} className="border p-2 rounded-md flex justify-between items-center">
                      <div>
                        <div className="font-semibold">{prod.nom}</div>
                        <div className="text-xs text-gray-600">{Number(prod.prix_achat).toFixed(2)} Fc</div>
                      </div>
                      <Button size="sm" onClick={() => ajouterAuPanier(prod)}>Ajouter</Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </Card>
          )}
        </div>

        {/* Colonne Droite : Panier */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm">
          <Card className="p-4">
            <h2 className="text-lg font-semibold mb-4">🛒 Panier</h2>
            {panier.length === 0 ? (
              <p className="text-gray-500">Aucun produit dans le panier.</p>
            ) : (
              <ScrollArea className="h-[400px] mb-4 pr-2">
                <div className="space-y-3">
                  {panier.map((item, index) => (
                    <div
                      key={item.identifiant}
                      className="grid grid-cols-7 items-center gap-2 border-b pb-2 text-xs"
                    >
                      <span className="col-span-2 font-medium truncate">{item.nom}</span>
                      <span>{item.prix_achat} Fc</span>
                      <Input
                        type="number"
                        min={0}
                        value={item.quantite}
                        onChange={(e) => updateQuantite(index, e.target.value)}
                        className="w-16"
                      />
                      <span className="text-green-600 font-semibold">
                        {(item.quantite * item.prix_achat).toFixed(2)} Fc
                      </span>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => supprimerDuPanier(item.identifiant)}
                      >
                        Supprimer
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}

            <div className="text-right font-bold text-sm mt-4">
              Total : <span className="text-blue-600">{total.toFixed(2)} Fc</span>
            </div>

            <div className="mt-4 text-right">
              <Button
                onClick={handleConfirmerCommande}
                disabled={total <= 0}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Confirmer la commande
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>

    {showPDF && commandeConfirmee && (
  <ApercuBonCommande
    fabricant={commandeConfirmee.fabricant}
    lignes={commandeConfirmee.lignes}
  />
)}

    </div>
  );
}
