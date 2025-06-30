from rest_framework import serializers
from .models import Fabricant, ProduitFabricant
from comptes.models import Pharmacie

class ProduitFabricantSerializer(serializers.ModelSerializer):
    fabricant_nom = serializers.CharField(source='fabricant.nom', read_only=True)
    taux_change = serializers.SerializerMethodField()
    prix_achat_cdf = serializers.SerializerMethodField()
    prix_achat_par_plaquette = serializers.SerializerMethodField()

    class Meta:
        model = ProduitFabricant
        fields = [
            'id', 'fabricant', 'nom', 'prix_achat', 'devise',
            'taux_change', 'prix_achat_cdf', 'nombre_plaquettes_par_boite',
            'prix_achat_par_plaquette','fabricant_nom'
        ]
        read_only_fields = ['fabricant_nom']
    def get_taux_change(self, obj):
        if obj.devise == 'USD':
            try:
                return TauxChange.objects.latest('date').taux
            except TauxChange.DoesNotExist:
                return None
        return None

    def get_prix_achat_cdf(self, obj):
        return obj.prix_achat_cdf()

    def get_prix_achat_par_plaquette(self, obj):
        return obj.prix_achat_par_plaquette
    def validate(self, data):
        fabricant = data.get('fabricant')
        nom = data.get('nom')

        if ProduitFabricant.objects.filter(fabricant=fabricant, nom__iexact=nom).exists():
            raise serializers.ValidationError({
                "nom": f"Le produit « {nom} » existe déjà pour ce fabricant."
            })
        return data

from rest_framework import serializers
from .models import ProduitFabricant

class ProduitListeModifierFabricantSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProduitFabricant
        fields = ['id', 'nom', 'prix_achat', 'devise', 'nombre_plaquettes_par_boite']

from rest_framework import serializers
from .models import TauxChange

class TauxChangeSerializer(serializers.ModelSerializer):
    class Meta:
        model = TauxChange
        fields = ['id', 'taux', 'date']

class FabricantSerializer(serializers.ModelSerializer):
    produits = ProduitFabricantSerializer(many=True, read_only=True)

    class Meta:
        model = Fabricant
        fields = ['id', 'nom', 'pays_origine', 'produits']
######################### Enregistrement de medicament dans une pharmacie ##################
# medicamentsn/serializers.py
from rest_framework import serializers
from .models import ProduitPharmacie, ProduitFabricant
from rest_framework import serializers
from .models import ProduitPharmacie, ProduitFabricant, LotProduitPharmacie
from rest_framework import serializers
from decimal import Decimal, InvalidOperation
from django.core.exceptions import ObjectDoesNotExist
from django.utils.crypto import get_random_string

from pharmacie.models import ProduitPharmacie, LotProduitPharmacie, TauxChange

def generate_unique_numero_lot():
    """Génère un numéro de lot unique du type LOT-AB12"""
    while True:
        numero = f"LOT-{get_random_string(4).upper()}"
        if not LotProduitPharmacie.objects.filter(numero_lot=numero).exists():
            return numero

class ProduitPharmacieSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProduitPharmacie
        fields = '__all__'
        read_only_fields = ['pharmacie', 'prix_achat', 'prix_vente', 'quantite']


# serializers.py
from rest_framework import serializers
from .models import LotProduitPharmacie

class LotProduitPharmacieSerializer(serializers.ModelSerializer):
    nom_medicament = serializers.CharField(source='produit.nom_medicament', read_only=True)

    class Meta:
        model = LotProduitPharmacie
        fields = [
            'id',
            'produit',
            'nom_medicament',
            'numero_lot',
            'date_peremption',
            'date_entree',
            'quantite',
            'prix_achat',
            'prix_vente'
        ]


from rest_framework import serializers
from .models import ProduitFabricant

class ProduitsFabricantSerializer(serializers.ModelSerializer):
    prix_achat_cdf = serializers.SerializerMethodField()

    class Meta:
        model = ProduitFabricant
        fields = ['id', 'nom', 'prix_achat_cdf']

    def get_prix_achat_cdf(self, obj):
        return obj.prix_achat_cdf()

######################## commande de produit chez le fourniseur########################
from rest_framework import serializers
from .models import CommandeProduit, CommandeProduitLigne, ProduitFabricant, Fabricant
from rest_framework import serializers
from .models import CommandeProduitLigne, ProduitFabricant
from rest_framework import serializers
from .models import CommandeProduitLigne, ProduitFabricant
import random
import string

from .models import TauxChange  # Assure-toi que c'est bien importé
from .models import TauxChange  # Assure-toi que c'est bien importé
from decimal import Decimal, ROUND_HALF_UP
from rest_framework import serializers
from pharmacie.models import TauxChange, CommandeProduit, CommandeProduitLigne

from rest_framework import serializers
from decimal import Decimal, ROUND_HALF_UP
from datetime import date, timedelta
import random
import string
from pharmacie.models import (
    CommandeProduit,
    CommandeProduitLigne,
    ProduitPharmacie,
    TauxChange,
    LotProduitPharmacie
)

def generer_code_barre_aleatoire():
    chars = string.ascii_letters + string.digits + "!@#$%^&*"
    return ''.join(random.choices(chars, k=6))

class CommandeProduitLigneSerializer(serializers.ModelSerializer):
    class Meta:
        model = CommandeProduitLigne
        fields = ['produit_fabricant', 'quantite_commandee', 'prix_achat']
        read_only_fields = ['prix_achat']

class CommandeProduitSerializer(serializers.ModelSerializer):
    lignes = CommandeProduitLigneSerializer(many=True)

    class Meta:
        model = CommandeProduit
        fields = ['id', 'date_commande', 'etat', 'fabricant', 'lignes']
        read_only_fields = ['id']

    def create(self, validated_data):
        lignes_data = validated_data.pop('lignes')
        user = self.context['request'].user

        if not hasattr(user, 'pharmacie') or user.pharmacie is None:
            raise serializers.ValidationError("L'utilisateur n'est pas lié à une pharmacie.")

        pharmacie = user.pharmacie
        today = date.today()
        errors = []

        for idx, ligne_data in enumerate(lignes_data):
            produit = ligne_data['produit_fabricant']

            deja_commande = CommandeProduitLigne.objects.filter(
                produit_fabricant=produit,
                commande__pharmacie=pharmacie,
                commande__date_commande__date=today
            ).exists()

            if deja_commande:
                errors.append({
                    'index': idx,
                    'produit': produit.nom,
                    'message': f"⚠ Le produit '{produit.nom}' a déjà été commandé aujourd’hui par votre pharmacie."
                })

        if errors:
            raise serializers.ValidationError({'lignes': errors})

        # Création de la commande (sans toucher au stock)
        commande = CommandeProduit.objects.create(pharmacie=pharmacie, **validated_data)

        for ligne_data in lignes_data:
            produit_fabricant = ligne_data['produit_fabricant']
            quantite = ligne_data['quantite_commandee']
            devise = produit_fabricant.devise.upper()
            prix_achat = Decimal(produit_fabricant.prix_achat)

            if devise == 'USD':
                try:
                    taux = TauxChange.objects.latest('date').taux
                    prix_achat *= Decimal(taux)
                except TauxChange.DoesNotExist:
                    raise serializers.ValidationError("Aucun taux de change défini.")

            prix_achat = prix_achat.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)

            CommandeProduitLigne.objects.create(
                commande=commande,
                produit_fabricant=produit_fabricant,
                quantite_commandee=quantite,
                prix_achat=prix_achat
            )

        return commande


from rest_framework import serializers
from .models import CommandeProduit, CommandeProduitLigne, ReceptionProduit, ReceptionLigne

class ProduitCommandeSerializer(serializers.Serializer):
    produit = serializers.CharField(source='produit_fabricant.nom')
    quantite_commandee = serializers.IntegerField()
    quantite_recue = serializers.SerializerMethodField()
    prix_achat = serializers.DecimalField(max_digits=10, decimal_places=2)

    def get_quantite_recue(self, obj):
        reception_lignes = ReceptionLigne.objects.filter(ligne_commande=obj)
        return sum(rl.quantite_recue for rl in reception_lignes)
    

class MouvementCommandeSerializer(serializers.ModelSerializer):
    fabricant = serializers.CharField(source='fabricant.nom')
    produits = serializers.SerializerMethodField()
    date_reception = serializers.SerializerMethodField()
    utilisateur_reception = serializers.SerializerMethodField()

    class Meta:
        model = CommandeProduit
        fields = ['id', 'date_commande', 'etat', 'fabricant', 'produits', 'date_reception', 'utilisateur_reception']

    def get_produits(self, obj):
        lignes = CommandeProduitLigne.objects.filter(commande=obj)
        return ProduitCommandeSerializer(lignes, many=True).data

    def get_date_reception(self, obj):
        receptions = obj.receptions.order_by('-date_reception')
        if receptions.exists():
            return receptions.first().date_reception
        return None

    def get_utilisateur_reception(self, obj):
        receptions = obj.receptions.order_by('-date_reception')
        if receptions.exists() and receptions.first().utilisateur:
            return receptions.first().utilisateur.username
        return None


#####################Reception de medicament####################################
from rest_framework import serializers
from .models import ReceptionProduit, ReceptionLigne, ProduitPharmacie, CommandeProduitLigne
from datetime import date
from rest_framework import serializers
from datetime import date, timedelta
from decimal import Decimal
from pharmacie.models import (
    ReceptionProduit,
    ReceptionLigne,
    ProduitPharmacie,
    LotProduitPharmacie,
)

class ReceptionLigneSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReceptionLigne
        fields = ['ligne_commande', 'quantite_recue']

class ReceptionProduitSerializer(serializers.ModelSerializer):
    lignes = ReceptionLigneSerializer(many=True)

    class Meta:
        model = ReceptionProduit
        fields = ['id', 'commande', 'utilisateur', 'lignes']
        read_only_fields = ['id']

    def create(self, validated_data):
        lignes_data = validated_data.pop('lignes')
        reception = ReceptionProduit.objects.create(**validated_data)
        commande = reception.commande
        pharmacie = commande.pharmacie

        for ligne_data in lignes_data:
            # Création de la ligne de réception
            reception_ligne = ReceptionLigne.objects.create(reception=reception, **ligne_data)

            commande_ligne = ligne_data['ligne_commande']
            produit_fabricant = commande_ligne.produit_fabricant
            quantite_recue = ligne_data['quantite_recue']  # en boîtes

            if not produit_fabricant:
                raise serializers.ValidationError("Produit fabricant introuvable pour la ligne.")

            nb_plaquettes = quantite_recue * produit_fabricant.nombre_plaquettes_par_boite

            produit_pharmacie, created = ProduitPharmacie.objects.get_or_create(
                pharmacie=pharmacie,
                produit_fabricant=produit_fabricant,
                defaults={
                    'quantite': 0,
                    'code_barre': generer_code_barre_aleatoire(),
                    'nom_medicament': produit_fabricant.nom,
                    'indication': True,
                    'localisation': 'A0',
                    'conditionnement': 'boîte',
                    'date_peremption': date.today() + timedelta(days=545),
                    'categorie': 'True',
                    'alerte_quantite': 8,
                    'prix_achat': commande_ligne.prix_achat,
                    'marge_beneficiaire': Decimal('35.00'),
                }
            )

            produit_pharmacie.quantite += nb_plaquettes

            if created:
                produit_pharmacie.prix_vente = (
                    produit_pharmacie.prix_achat + (
                        produit_pharmacie.prix_achat * produit_pharmacie.marge_beneficiaire / 100
                    )
                ).quantize(Decimal('0.01'))

            produit_pharmacie.save()

            # Création du lot
            LotProduitPharmacie.objects.create(
                produit=produit_pharmacie,
                quantite=nb_plaquettes,
                date_peremption=date.today() + timedelta(days=365)
            )

        return reception



###############################################
class CommandeProduitLigneDetailSerializer(serializers.ModelSerializer):
    produit_fabricant = ProduitFabricantSerializer(read_only=True)  # Serializer imbriqué pour le produit.

    class Meta:
        model = CommandeProduitLigne
        fields = ['id', 'produit_fabricant', 'quantite_commandee']

class CommandeProduitDetailSerializer(serializers.ModelSerializer):
    lignes = CommandeProduitLigneDetailSerializer(many=True, read_only=True)
    fabricant = FabricantSerializer(read_only=True)

    class Meta:
        model = CommandeProduit
        fields = ['id', 'pharmacie', 'date_commande', 'etat', 'fabricant', 'lignes']

##################### la vente de produit ########################
from rest_framework import serializers
from django.db import transaction
from .models import VenteProduit, VenteLigne, ProduitPharmacie
from comptes.models import Pharmacie

# Sérialiseur ProduitPharmacie simple

class ProduitsPharmacieSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProduitPharmacie
        fields = ['id', 'nom_medicament', 'prix_vente', 'quantite', 'code_barre']

class PharmacieSerializer(serializers.ModelSerializer):
    class Meta:
        model = Pharmacie
        fields = '__all__'  # ✅ Affiche tous les champs du modèle

class VenteLigneSerializer(serializers.ModelSerializer):
    class Meta:
        model = VenteLigne
        fields = ['produit', 'quantite']  # prix_unitaire n'est plus requis

    def create(self, validated_data):
        # Récupère automatiquement le prix du produit
        produit = validated_data['produit']
        validated_data['prix_unitaire'] = produit.prix_vente
        return super().create(validated_data)

################################# Historique de la vente #################################
# serializers.py
from rest_framework import serializers
from .models import VenteProduit, VenteLigne

class VenteLignessSerializer(serializers.ModelSerializer):
    produit = serializers.CharField(source='produit.nom_medicament')

    class Meta:
        model = VenteLigne
        fields = ['produit', 'quantite', 'prix_unitaire', 'total']

class HistoriqueVenteSerializer(serializers.ModelSerializer):
    utilisateur = serializers.CharField(source='utilisateur.username', default=None)
    client = serializers.CharField(source='client.nom', default=None)
    lignes = VenteLignessSerializer(many=True, read_only=True)

    class Meta:
        model = VenteProduit
        fields = ['id', 'date_vente', 'utilisateur', 'client', 'montant_total', 'lignes']


from rest_framework import serializers
from django.db import transaction
from .models import VenteProduit, VenteLigne, Client, ProduitPharmacie

from rest_framework import serializers
from .models import VenteProduit, ProduitPharmacie, Client
from .serializers import VenteLigneSerializer, PharmacieSerializer

from rest_framework.fields import CurrentUserDefault

class CurrentPharmacieDefault:
    requires_context = True

    def __call__(self, serializer_field):
        user = serializer_field.context['request'].user
        return user.pharmacie  # ou autre relation selon ton modèle


class VenteProduitSerializer(serializers.ModelSerializer):
    pharmacie = serializers.HiddenField(default=CurrentPharmacieDefault())
    pharmacie_detail = PharmacieSerializer(source='pharmacie', read_only=True)

    lignes = VenteLigneSerializer(many=True)
    
    utilisateur = serializers.PrimaryKeyRelatedField(
        read_only=True,
        default=serializers.CurrentUserDefault()
    )
    
    client = serializers.PrimaryKeyRelatedField(
        queryset=Client.objects.all(),
        required=False,
        allow_null=True
    )
    
    montant_total = serializers.DecimalField(
        max_digits=10, 
        decimal_places=2,
        read_only=True
    )

    class Meta:
        model = VenteProduit
        fields = [
            'id', 'pharmacie', 'pharmacie_detail', 'date_vente',
            'utilisateur', 'client', 'lignes', 'montant_total'
        ]
        read_only_fields = ['date_vente', 'utilisateur', 'montant_total']

    def validate(self, data):
        pharmacie = data['pharmacie']
        client = data.get('client')

        if client and client.pharmacie != pharmacie:
            raise serializers.ValidationError(
                "Le client n'appartient pas à cette pharmacie"
            )

        for ligne in data['lignes']:
            produit = ligne['produit']
            if produit.pharmacie != pharmacie:
                raise serializers.ValidationError(
                    f"Le produit {produit.nom_medicament} n'appartient pas à cette pharmacie"
                )

            quantite = ligne['quantite']
            if produit.quantite < quantite:
                raise serializers.ValidationError(
                    f"Stock insuffisant pour {produit.nom_medicament}. "
                    f"Stock: {produit.quantite}, Demande: {quantite}"
                )

        return data

    @transaction.atomic

    def create(self, validated_data):
        lignes_data = validated_data.pop('lignes')
        client = validated_data.pop('client', None)

        vente = VenteProduit.objects.create(
            client=client,
            **validated_data
        )

        total_vente = 0

        for ligne_data in lignes_data:
            produit = ligne_data['produit']
            quantite = ligne_data['quantite']
            prix_unitaire = produit.prix_vente
            total_ligne = quantite * prix_unitaire

            # Création de la ligne de vente
            VenteLigne.objects.create(
                vente=vente,
                produit=produit,
                quantite=quantite,
                prix_unitaire=prix_unitaire,
                total=total_ligne
            )

            # ✅ Réduction du stock global
            produit.quantite -= quantite
            produit.save()

            # ✅ Réduction du stock dans les lots FIFO
            quantite_restante = quantite
            lots = produit.lots.filter(quantite__gt=0).order_by('date_entree')

            for lot in lots:
                if quantite_restante <= 0:
                    break

                quantite_a_retirer = min(lot.quantite, quantite_restante)
                lot.quantite -= quantite_a_retirer
                lot.save()

                quantite_restante -= quantite_a_retirer

            total_vente += total_ligne

        vente.montant_total = total_vente
        vente.save(update_fields=['montant_total'])

        if client:
            client.update_stats()

        return vente


########################### CLIENT ET TOUT C QUI LUI CONCERNE################################
from rest_framework import serializers
from .models import Client, ClientPurchase, MedicalExam, Prescription
from rest_framework import serializers
from .models import Client
from rest_framework.validators import UniqueValidator
class ClientRendezvousSerializer(serializers.ModelSerializer):
    rendez_vous = serializers.SerializerMethodField()

    class Meta:
        model = Client
        fields = ['id', 'nom_complet', 'telephone', 'rendez_vous']

    def get_rendez_vous(self, obj):
        rdvs = obj.rendez_vous_set.order_by('-date')
        return RendezVousSerializer(rdvs, many=True).data

class ClientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Client
        fields = ['id', 'nom_complet', 'telephone', 'score_fidelite']
        extra_kwargs = {
            'telephone': {
                'validators': [
                    UniqueValidator(
                        queryset=Client.objects.all(),
                        message="Ce numéro est déjà utilisé"
                    )
                ]
            }
        }
    
    def validate_telephone(self, value):
        # Nettoyer le numéro de téléphone
        cleaned_phone = ''.join(filter(str.isdigit, value))
        
        # Validation de la longueur
        if len(cleaned_phone) < 8 or len(cleaned_phone) > 15:
            raise serializers.ValidationError(
                "Le numéro doit contenir entre 8 et 15 chiffres"
            )
        
        return cleaned_phone

class ClientPurchaseSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClientPurchase
        fields = ['id', 'produit', 'quantite', 'points_gagnes', 'date_achat']

class MedicalExamSerializer(serializers.ModelSerializer):
    class Meta:
        model = MedicalExam
        fields = ['tension_arterielle', 'examen_malaria', 'remarques']

    def to_internal_value(self, data):
        ret = super().to_internal_value(data)
        if 'examen_malaria' in ret:
            value = ret['examen_malaria']
            if isinstance(value, str):
                ret['examen_malaria'] = value.lower() in ['true', '1', 'yes']
        return ret

# serializers.py
from rest_framework import serializers
from .models import Prescription
# serializers.py
class PrescriptionsSerializer(serializers.ModelSerializer):
    medicament = serializers.CharField(source='medicament.nom_medicament')

    class Meta:
        model = Prescription
        fields = ['medicament', 'dosage', 'duree_traitement', 'date_prescription']

class PrescriptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Prescription
        fields = ['medicament', 'dosage', 'duree_traitement']
######################### Aficher et gere le client################################
from rest_framework import serializers
from .models import Client

class ClientAfficherSerializer(serializers.ModelSerializer):
    class Meta:
        model = Client
        fields = [
            'id', 
            'nom_complet', 
            'telephone', 
            'score_fidelite', 
            'dernier_achat', 
            'total_depense', 
            'created_at'
        ]
        read_only_fields = fields

########################## Contenu alerte stock###################
from rest_framework import serializers
from .models import ProduitPharmacie

class ProduitAlertPharmacieSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProduitPharmacie
        fields = ['id', 'nom_medicament', 'quantite', 'alerte_quantite']

# pharmacie/serializers.py
from rest_framework import serializers
from .models import ProduitPharmacie,Requisition

##############################Affiche sur acceuil responsable ##########################
# serializers.py
from rest_framework import serializers
from datetime import datetime
from django.db.models import Sum, F, DecimalField
from .models import VenteProduit, VenteLigne, RendezVous, PublicitePharmacie, DepotPharmaceutique

class StatistiquesDuJourSerializer(serializers.Serializer):
    chiffre_affaire = serializers.DecimalField(max_digits=12, decimal_places=2)
    benefice = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_ventes = serializers.DecimalField(max_digits=12, decimal_places=2)
    produit_plus_vendu = serializers.CharField()


class ProduitAlerteSerializer(serializers.ModelSerializer):
    niveau_alerte = serializers.SerializerMethodField()

    class Meta:
        model = ProduitPharmacie
        fields = ['id', 'nom_medicament', 'quantite', 'alerte_quantite', 'niveau_alerte']

    def get_niveau_alerte(self, obj):
        if obj.quantite <= obj.alerte_quantite:
            return 'danger'
        elif obj.quantite <= obj.alerte_quantite + 5:
            return 'warning'
        return None

class RequisitionSerializer(serializers.ModelSerializer):
    nom_produit = serializers.SerializerMethodField()
    fabricant_nom = serializers.SerializerMethodField()
    prix_achat = serializers.SerializerMethodField()
    produit_fabricant_id = serializers.IntegerField(source='produit_fabricant.id', read_only=True)  # Ajout de l'ID

    class Meta:
        model = Requisition
        fields = [
            'id',
            'produit_fabricant_id',  # Nouveau champ
            'produit_fabricant',
            'nom_personnalise',
            'nombre_demandes',
            'nom_produit',
            'fabricant_nom',
            'prix_achat',
        ]

    def get_nom_produit(self, obj):
        if obj.nom_personnalise:
            return obj.nom_personnalise
        elif obj.produit_fabricant:
            return obj.produit_fabricant.nom
        return ""

    def get_fabricant_nom(self, obj):
        if obj.produit_fabricant and hasattr(obj.produit_fabricant, 'fabricant'):
            return obj.produit_fabricant.fabricant.nom
        return ""

    def get_prix_achat(self, obj):
        if obj.produit_fabricant and hasattr(obj.produit_fabricant, 'prix_achat'):
            return obj.produit_fabricant.prix_achat
        return None

# serializers.py
class RendezVousSerializer(serializers.ModelSerializer):
    class Meta:
        model = RendezVous
        fields = '__all__'

#######PUBLICITE #############
# serializers.py

class PubliciteSerializer(serializers.ModelSerializer):
    image = serializers.ImageField(use_url=True)

    class Meta:
        model = PublicitePharmacie
        fields = ['image', 'description', 'date_debut', 'date_fin']

    def to_representation(self, instance):
        rep = super().to_representation(instance)
        request = self.context.get('request')
        if request and rep['image']:
            rep['image'] = request.build_absolute_uri(rep['image'])
        return rep

class DepotPharmaceutiqueSerializer(serializers.ModelSerializer):
    fabricant = serializers.PrimaryKeyRelatedField(queryset=Fabricant.objects.all())

    class Meta:
        model = DepotPharmaceutique
        fields = [
            'id', 'fabricant', 'nom_depot', 'ville', 'commune',
            'quartier', 'adresse_complete', 'latitude', 'longitude', 'telephone'
        ]