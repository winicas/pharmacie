# sync_remote_to_local.py
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
    Pharmacie,
    CommandeProduitLigne,
    ReceptionProduit,
    ReceptionLigne,
    VenteLigne,
    ClientPurchase,
    MedicalExam,
    Prescription,
    LotProduitPharmacie
   
]

MODELS_PAR_PHARMACIE = [
    User,
    ProduitPharmacie,
    CommandeProduit,
    Client,
    VenteProduit, 
    Requisition,
    RendezVous,
     
]

def get_current_pharmacie():
    return Pharmacie.objects.using('default').first()

def sync_model_to_local(model, filter_kwargs=None):
    qs = model.objects.using('remote')
    if filter_kwargs:
        qs = qs.filter(**filter_kwargs)

    print(f"\n🔄 {model.__name__} Render ➜ local...")

    for remote_obj in qs.iterator():
        try:
            local_obj = model.objects.using('default').get(pk=remote_obj.pk)
        except model.DoesNotExist:
            local_obj = None

        if not local_obj:
            print(f"➕ {model.__name__} (id={remote_obj.pk}) ➜ local")
            try:
                remote_obj.save(using='default')
            except IntegrityError as e:
                print(f"⚠️ IntegrityError: {e}")
        else:
            if hasattr(remote_obj, 'updated_at') and hasattr(local_obj, 'updated_at'):
                if remote_obj.updated_at > local_obj.updated_at:
                    print(f"📝 Update {model.__name__} (id={remote_obj.pk}) ➜ local")
                    remote_obj.save(using='default')

def run():
    print("\n🚀 Sync RENDER ➜ LOCAL")

    pharmacie = get_current_pharmacie()
    if not pharmacie:
        print("❌ Aucune pharmacie locale trouvée.")
        return

    for model in MODELS_GLOBAL:
        sync_model_to_local(model)

    for model in MODELS_PAR_PHARMACIE:
        sync_model_to_local(model, {'pharmacie': pharmacie})

    print("\n✅ Synchronisation Render ➜ locale terminée.")

if __name__ == "__main__":
    run()
