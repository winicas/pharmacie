# medicamentsn/signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import ProduitFabricant, ProduitPharmacie
from decimal import Decimal, InvalidOperation

@receiver(post_save, sender=ProduitFabricant)
def update_produits_pharmacie(sender, instance, **kwargs):
    try:
        nb_plaquettes = instance.nombre_plaquettes_par_boite
        prix_boite_cdf = instance.prix_achat_cdf()

        if nb_plaquettes and nb_plaquettes > 0:
            prix_par_plaquette = Decimal(prix_boite_cdf) / Decimal(nb_plaquettes)

            produits_pharmacies = ProduitPharmacie.objects.filter(produit_fabricant=instance)

            for produit in produits_pharmacies:
                produit.prix_achat = prix_par_plaquette.quantize(Decimal('0.01'))

                if produit.marge_beneficiaire is not None:
                    produit.prix_vente = (
                        produit.prix_achat + (produit.prix_achat * produit.marge_beneficiaire / 100)
                    ).quantize(Decimal('0.01'))

                produit.save()

    except (InvalidOperation, ZeroDivisionError) as e:
        print(f"Erreur lors de la mise à jour des produits pharmacie : {e}")
