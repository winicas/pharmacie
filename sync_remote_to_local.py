# sync_remote_to_local.py
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
    
    # 2. Éléments indépendants
    TauxChange,
    Fabricant,
    DepotPharmaceutique,
    
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



def sync_model_to_local(model):
    print(f"\n🔄 Synchronisation du modèle {model.__name__} depuis Render vers local...")
    for remote_obj in model.objects.using('remote').all():
        try:
            local_obj = model.objects.using('default').get(pk=remote_obj.pk)
        except model.DoesNotExist:
            local_obj = None

        if not local_obj:
            print(f"➕ Ajout de {model.__name__} (id={remote_obj.pk}) en local")
            try:
                remote_obj.save(using='default')
            except IntegrityError as e:
                print(f"⚠️ Erreur Integrity lors de l'ajout: {e}")
        else:
            if remote_obj.updated_at > local_obj.updated_at:
                print(f"📝 Mise à jour de {model.__name__} (id={remote_obj.pk}) en local")
                remote_obj.save(using='default')


def run():
    print("\n🚀 Lancement de la synchronisation Render vers local...")
    for model in MODELS:
        try:
            sync_model_to_local(model)
        except Exception as e:
            print(f"❌ Erreur pendant la synchronisation du modèle {model.__name__} : {e}")
    print("\n✅ Synchronisation Render vers local terminée avec succès.")


if __name__ == "__main__":
    run()
