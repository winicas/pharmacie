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
    TauxChange,
    Fabricant,
    DepotPharmaceutique,
    ProduitFabricant,
    Pharmacie,
    User,
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
