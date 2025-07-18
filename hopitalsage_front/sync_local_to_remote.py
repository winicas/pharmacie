# sync_local_to_remote.py
import os
import sys
from django.utils import timezone
from django.db import connections
from django.db.utils import IntegrityError

# Config Django
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
DJANGO_BASE_DIR = os.path.abspath(os.path.join(CURRENT_DIR, '..'))
sys.path.append(DJANGO_BASE_DIR)
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

REMOTE = connections['remote']

MODELS_GLOBAL = [
    TauxChange,
    Fabricant,
    DepotPharmaceutique,
    ProduitFabricant,
    PublicitePharmacie,
]

MODELS_PAR_PHARMACIE = [
    User,
    Pharmacie,
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
]

def get_current_pharmacie():
    return Pharmacie.objects.using('default').first()

def has_updated_at(obj):
    return hasattr(obj, 'updated_at') and obj.updated_at is not None

def sync_model_to_remote(model, filter_kwargs=None):
    qs = model.objects.using('default')
    if filter_kwargs:
        qs = qs.filter(**filter_kwargs)

    print(f"\n🔄 {model.__name__} local ➜ Render...")

    remote_ids = set(model.objects.using('remote').values_list('pk', flat=True))

    for obj in qs.iterator():
        if obj.pk not in remote_ids:
            print(f"➕ {model.__name__} (id={obj.pk}) ➜ remote")
            try:
                obj.save(using='remote')
            except IntegrityError as e:
                print(f"⚠️ IntegrityError: {e}")
        else:
            if has_updated_at(obj):
                remote_obj = model.objects.using('remote').get(pk=obj.pk)
                if has_updated_at(remote_obj) and obj.updated_at > remote_obj.updated_at:
                    print(f"📝 Update {model.__name__} (id={obj.pk}) ➜ remote")
                    obj.save(using='remote')

def run():
    print("\n🚀 Sync LOCAL ➜ RENDER")

    pharmacie = get_current_pharmacie()
    if not pharmacie:
        print("❌ Aucune pharmacie locale trouvée.")
        return

    for model in MODELS_GLOBAL:
        sync_model_to_remote(model)

    for model in MODELS_PAR_PHARMACIE:
        sync_model_to_remote(model, {'pharmacie': pharmacie})

    print("\n✅ Synchronisation locale ➜ Render terminée.")

if __name__ == "__main__":
    run()
