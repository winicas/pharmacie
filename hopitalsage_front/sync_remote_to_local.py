import os
import sys
from django.db import IntegrityError

# Configuration Django
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
DJANGO_BASE_DIR = os.path.abspath(os.path.join(CURRENT_DIR, '..'))
sys.path.append(DJANGO_BASE_DIR)
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "gestion_pharmacie.settings")

import django
django.setup()

from comptes.models import Pharmacie, User
from pharmacie.models import (
    TauxChange, Fabricant, ProduitFabricant, ProduitPharmacie,
    CommandeProduit, CommandeProduitLigne,
    ReceptionProduit, ReceptionLigne,
    Client, VenteProduit, VenteLigne
)

# Modèles globaux (pas liés directement à une pharmacie)
MODELS_GLOBAL = [
    TauxChange,
    Fabricant,
    ProduitFabricant,
    Pharmacie,
    User
]

# Modèles liés à une pharmacie spécifique
MODELS_PAR_PHARMACIE = [
    ProduitPharmacie,
    CommandeProduit,
    CommandeProduitLigne,
    ReceptionProduit,
    ReceptionLigne,
    Client,
    VenteProduit,
    VenteLigne
]

# Mapping pour filtrer par pharmacie
PHARMACIE_LOOKUPS = {
    ProduitPharmacie: "pharmacie",
    CommandeProduit: "pharmacie",
    CommandeProduitLigne: "commande__pharmacie",
    ReceptionProduit: "pharmacie",
    ReceptionLigne: "reception__pharmacie",
    Client: "pharmacie",
    VenteProduit: "pharmacie",
    VenteLigne: "vente__pharmacie"
}

def get_current_pharmacie():
    """Retourne la première pharmacie trouvée en local"""
    return Pharmacie.objects.using('default').first()

def sync_data(source_db, target_db, model, pharmacie=None):
    """Synchronise un modèle entre deux bases"""
    qs = model.objects.using(source_db)

    # Si le modèle dépend d'une pharmacie, on filtre
    if pharmacie and model in PHARMACIE_LOOKUPS:
        lookup = PHARMACIE_LOOKUPS[model]
        qs = qs.filter(**{lookup: pharmacie})

    for obj in qs:
        try:
            target_obj = model.objects.using(target_db).filter(pk=obj.pk).first()
            if not target_obj:
                # Création dans la base cible
                model.objects.using(target_db).create(**{
                    field.name: getattr(obj, field.name)
                    for field in model._meta.fields
                    if field.name != "id"
                })
            else:
                # Mise à jour si updated_at est plus récent
                if hasattr(obj, "updated_at") and obj.updated_at > getattr(target_obj, "updated_at", None):
                    for field in model._meta.fields:
                        if field.name != "id":
                            setattr(target_obj, field.name, getattr(obj, field.name))
                    target_obj.save(using=target_db)
        except IntegrityError as e:
            print(f"Erreur d'intégrité sur {model.__name__} ({obj.pk}): {e}")
        except Exception as e:
            print(f"Erreur lors de la synchro {model.__name__} ({obj.pk}): {e}")

def run():
    pharmacie = get_current_pharmacie()

    if not pharmacie:
        print("Aucune pharmacie locale trouvée. Synchronisation annulée.")
        return

    print("=== Synchronisation REMOTE → LOCAL ===")
    for model in MODELS_GLOBAL:
        sync_data("remote", "default", model)
    for model in MODELS_PAR_PHARMACIE:
        sync_data("remote", "default", model, pharmacie=pharmacie)

    print("=== Synchronisation LOCAL → REMOTE ===")
    for model in MODELS_GLOBAL:
        sync_data("default", "remote", model)
    for model in MODELS_PAR_PHARMACIE:
        sync_data("default", "remote", model, pharmacie=pharmacie)

if __name__ == "__main__":
    run()
