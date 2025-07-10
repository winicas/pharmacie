import os
import sys
from datetime import datetime
from django.utils import timezone

# Chemin vers le projet Django
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
DJANGO_BASE_DIR = os.path.abspath(os.path.join(CURRENT_DIR, '..'))
sys.path.append(DJANGO_BASE_DIR)

# Configuration Django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "gestion_pharmacie.settings")
import django
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

# Liste ordonnée des modèles
MODELS = [
    User,
    Pharmacie,
    TauxChange,
    Fabricant,
    DepotPharmaceutique,
    ProduitFabricant,
    ProduitPharmacie,
    LotProduitPharmacie,
    CommandeProduit,
    CommandeProduitLigne,
    ReceptionProduit,
    ReceptionLigne,
    Client,
    VenteProduit,
    VenteLigne,
    ClientPurchase,
    MedicalExam,
    Prescription,
    Requisition,
    RendezVous,
    PublicitePharmacie,
]

def has_updated_at(obj):
    return hasattr(obj, 'updated_at') and obj.updated_at is not None

def sync_model_to_remote(model):
    print(f"\n🔄 Synchronisation du modèle {model.__name__} depuis local vers Render...")
    for local_obj in model.objects.using('default').all():
        try:
            remote_obj = model.objects.using('remote').get(pk=local_obj.pk)
        except model.DoesNotExist:
            remote_obj = None

        if not remote_obj:
            print(f"➕ Ajout de {model.__name__} (id={local_obj.pk}) sur Render")
            try:
                local_obj.save(using='remote')
            except IntegrityError as e:
                print(f"⚠️ Erreur Integrity lors de l'ajout: {e}")
        else:
            if has_updated_at(local_obj) and has_updated_at(remote_obj):
                if local_obj.updated_at > remote_obj.updated_at:
                    print(f"📝 Mise à jour de {model.__name__} (id={local_obj.pk}) sur Render")
                    local_obj.save(using='remote')
            else:
                # Si pas de champ updated_at, on peut décider de forcer la mise à jour
                pass  # ou: local_obj.save(using='remote')

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
