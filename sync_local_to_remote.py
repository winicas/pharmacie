# sync_local_to_remote.py
import django
import os
import sys
from django.utils import timezone
from datetime import datetime

# Configuration Django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "gestion_pharmacie.settings")
django.setup()

from comptes.models import Pharmacie, User
from pharmacie.models import (
    Fabricant, ProduitFabricant, ProduitPharmacie, LotProduitPharmacie,
    CommandeProduit, CommandeProduitLigne, ReceptionProduit, ReceptionLigne,
    Client, VenteProduit, VenteLigne, TauxChange,
    ClientPurchase, MedicalExam, Prescription, Requisition,
    RendezVous, PublicitePharmacie, DepotPharmaceutique
)

from django.db import connections
from django.db.utils import IntegrityError

REMOTE = connections['remote']

# Liste des modèles à synchroniser dans l'ordre des dépendances
MODELS = [
    # 1. Utilisateurs et établissements
    User,                        # utilisé partout (vente, réception…)
    Pharmacie,                   # utilisé dans produits, clients, ventes…
    
    # 3. Produits
    ProduitFabricant,           # dépend de Fabricant
    ProduitPharmacie,           # dépend de ProduitFabricant et Pharmacie
    LotProduitPharmacie,        # dépend de ProduitPharmacie
    
    # 4. Commandes
    CommandeProduit,            # dépend de Pharmacie, Fabricant
    CommandeProduitLigne,       # dépend de CommandeProduit, ProduitFabricant
    
    # 5. Réceptions
    ReceptionProduit,           # dépend de CommandeProduit, User
    ReceptionLigne,             # dépend de ReceptionProduit, CommandeProduitLigne
    
    # 6. Clients et ventes
    Client,                     # dépend de Pharmacie
    VenteProduit,               # dépend de Client, User, Pharmacie
    VenteLigne,                 # dépend de VenteProduit, ProduitPharmacie
    ClientPurchase,             # dépend de Client, ProduitPharmacie
    
    # 7. Examens, ordonnances et requêtes
    MedicalExam,                # dépend de Client
    Prescription,               # dépend de Client, ProduitFabricant
    Requisition,                # dépend de ProduitFabricant, Pharmacie
    
    # 8. Autres
    RendezVous,                 # dépend de Client
    PublicitePharmacie,         # dépend de rien, mais affiche logo pharmacie
]


def sync_model_to_remote(model):
    print(f"\n🔄 Synchronisation du modèle {model.__name__}...")
    remote_cursor = REMOTE.cursor()
    table = model._meta.db_table

    for obj in model.objects.using('default').all():
        remote_obj = None
        try:
            remote_obj = model.objects.using('remote').get(pk=obj.pk)
        except model.DoesNotExist:
            pass

        if not remote_obj:
            print(f"➕ Ajout de {model.__name__} (id={obj.pk}) sur Render")
            try:
                obj.save(using='remote')
            except IntegrityError as e:
                print(f"⚠️ Erreur Integrity lors de l'ajout: {e}")
        else:
            if obj.updated_at > remote_obj.updated_at:
                print(f"📝 Mise à jour de {model.__name__} (id={obj.pk}) sur Render")
                obj.save(using='remote')


def run():
    print("\n🚀 Lancement de la synchronisation locale vers Render...")
    for model in MODELS:
        try:
            sync_model_to_remote(model)
        except Exception as e:
            print(f"❌ Erreur pendant la synchronisation du modèle {model.__name__} : {e}")
    print("\n✅ Synchronisation locale vers Render terminée avec succès.")


if __name__ == "__main__":
    run()
