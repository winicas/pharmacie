'use client';

import React, { useEffect, useState } from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
  Image,
} from '@react-pdf/renderer';
import { saveAs } from 'file-saver';

interface ApercuBonCommandeProps {
  fabricant: any;
  lignes: any[];
}

const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 10 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 50,
    height: 50,
    marginRight: 10,
  },
  pharmacyName: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 15,
    textTransform: 'uppercase',
  },
  infoSection: {
    marginTop: 10,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  table: { width: '100%' },
  row: { flexDirection: 'row' },
  cell: {
    padding: 5,
    fontSize: 10,
    borderBottom: '1px solid #000',
    width: '25%',
  },
  total: { marginTop: 20, textAlign: 'right', fontSize: 12 },
});

const BonCommandePDF = ({
  fabricant,
  lignes,
  date,
  nomPharmacie,
}: {
  fabricant: any;
  lignes: any[];
  date: string;
  nomPharmacie: string;
}) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <View style={styles.logoSection}>
          <Image src="/logo.jpeg" style={styles.logo} />
          <Text style={styles.pharmacyName}>{nomPharmacie}</Text>
        </View>
      </View>

      <Text style={styles.title}>Bon de COMMANDE</Text>

      <View style={styles.infoSection}>
        <Text>Fabricant : {fabricant.nom}</Text>
        <Text>Date : {date}</Text>
      </View>

      <View style={styles.table}>
        <View style={styles.row}>
          <Text style={styles.cell}>Produit</Text>
          <Text style={styles.cell}>Prix unitaire</Text>
          <Text style={styles.cell}>Quantité</Text>
          <Text style={styles.cell}>Montant</Text>
        </View>
        {lignes.map((ligne, index) => (
          <View style={styles.row} key={index}>
            <Text style={styles.cell}>{ligne.nom}</Text>
            <Text style={styles.cell}>{Number(ligne.prix_achat).toFixed(2)} Fc</Text>
            <Text style={styles.cell}>{ligne.quantite}</Text>
            <Text style={styles.cell}>
              {(ligne.quantite * ligne.prix_achat).toFixed(2)} Fc
            </Text>
          </View>
        ))}
      </View>

      <Text style={styles.total}>
        Total : {lignes.reduce((acc, l) => acc + l.quantite * l.prix_achat, 0).toFixed(2)} Fc
      </Text>
    </Page>
  </Document>
);

export default function ApercuBonCommande({ fabricant, lignes }: ApercuBonCommandeProps) {
  const [nomPharmacie, setNomPharmacie] = useState<string>('Chargement...');
  const date = new Date().toLocaleDateString();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          throw new Error('Token d\'authentification introuvable');
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/user/me/`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Erreur HTTP ${response.status}`);
        }

        const data = await response.json();

        // Vérifie et set nom de la pharmacie
        setNomPharmacie(data.pharmacie?.nom || 'Nom pharmacie indisponible');
      } catch (error) {
        console.error('Erreur lors de la récupération utilisateur:', error);
        setNomPharmacie('Pharmacie inconnue');
      }
    };

    fetchUser();
  }, []);

  useEffect(() => {
    if (nomPharmacie === 'Chargement...') return;

    const generateAndDownloadPDF = async () => {
      const doc = (
        <BonCommandePDF
          fabricant={fabricant}
          lignes={lignes}
          date={date}
          nomPharmacie={nomPharmacie}
        />
      );

      const blob = await pdf(doc).toBlob();
      saveAs(blob, `Bon_Commande_${fabricant.nom}_${date}.pdf`);
    };

    generateAndDownloadPDF();
  }, [fabricant, lignes, nomPharmacie, date]);

  return (
    <div className="text-green-600 font-semibold p-4">
      ✅ Bon de commande généré et téléchargé automatiquement.
    </div>
  );
}
