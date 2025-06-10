from rest_framework import viewsets
from .models import Fabricant, ProduitFabricant
from .serializers import FabricantSerializer, ProduitFabricantSerializer
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404

class FabricantViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = Fabricant.objects.all()
    serializer_class = FabricantSerializer

    def create(self, request, *args, **kwargs):
        print("Requête reçue :", request.data)
        return super().create(request, *args, **kwargs)
    
class ProduitFabricantViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = ProduitFabricant.objects.all()
    serializer_class = ProduitFabricantSerializer
    def perform_create(self, serializer):
        serializer.save()

# views.py
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import TauxChange
from .serializers import TauxChangeSerializer

class TauxChangeViewSet(viewsets.ModelViewSet):
    queryset = TauxChange.objects.all().order_by('-date')  # Le plus récent en haut
    serializer_class = TauxChangeSerializer
    permission_classes = [IsAuthenticated]

#################Enregistrement des nouvelle medicament##############
# medicamentsn/views.py
from rest_framework import viewsets, permissions
from .models import ProduitPharmacie
from .serializers import ProduitPharmacieSerializer

class ProduitPharmacieViewSet(viewsets.ModelViewSet):
    serializer_class = ProduitPharmacieSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Filtrer par pharmacie de l'utilisateur connecté
        return ProduitPharmacie.objects.filter(pharmacie=self.request.user.pharmacie)

    def perform_create(self, serializer):
        serializer.save(pharmacie=self.request.user.pharmacie)

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import ProduitFabricant
from .serializers import ProduitFabricantSerializer

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def produits_par_fabricant(request):
    fabricant_id = request.GET.get('fabricant')
    if fabricant_id:
        produits = ProduitFabricant.objects.filter(fabricant_id=fabricant_id)
        serializer = ProduitFabricantSerializer(produits, many=True)
        return Response(serializer.data)
    return Response({"error": "ID fabricant requis"}, status=400)

############## Commande des medicaments chez les fournisseurs ###############################
from rest_framework import viewsets
from .models import CommandeProduit
from .serializers import CommandeProduitSerializer
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .serializers import CommandeProduitSerializer
  
class CommandeProduitViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = CommandeProduit.objects.all()
    serializer_class = CommandeProduitSerializer 

from rest_framework.views import APIView
from rest_framework.response import Response
from .models import ProduitFabricant
from .serializers import ProduitsFabricantSerializer

class ProduitsDuFabricantView(APIView):
    def get(self, request, pk):
        produits = ProduitFabricant.objects.filter(fabricant_id=pk)
        serializer = ProduitsFabricantSerializer(produits, many=True)
        return Response(serializer.data)

###################"Recption de Medicament du commande"####################""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from .serializers import ReceptionProduitSerializer, CommandeProduitDetailSerializer
from .models import CommandeProduit

class ConfirmerReceptionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        print("Données reçues dans la vue :", request.data)
        serializer = ReceptionProduitSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            commande = serializer.validated_data['commande']
            commande.etat = 'confirmee'  # Marquez la commande comme confirmée
            commande.save()

            serializer.save(utilisateur=request.user)
            return Response({"message": "Réception confirmée avec succès."}, status=201)
        return Response(serializer.errors, status=400)
    
from rest_framework.generics import RetrieveAPIView
from .models import CommandeProduit
from .serializers import CommandeProduitDetailSerializer

class CommandeDetailView(RetrieveAPIView):
    queryset = CommandeProduit.objects.all()
    serializer_class = CommandeProduitDetailSerializer
    permission_classes = [permissions.IsAuthenticated]
   


from rest_framework import generics
from django_filters.rest_framework import DjangoFilterBackend

class CommandeProduitListView(generics.ListAPIView):
    queryset = CommandeProduit.objects.filter(etat='en_attente').prefetch_related('lignes__produit_fabricant__fabricant').select_related('fabricant')
    serializer_class = CommandeProduitDetailSerializer
    permission_classes = [IsAuthenticated]
  
############################vente produit###########################
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import VenteProduit, ProduitPharmacie
from rest_framework import viewsets, generics, serializers
from rest_framework.permissions import IsAuthenticated
from .models import VenteProduit, Client
from .serializers import VenteProduitSerializer
from comptes.models import Pharmacie
from .serializers import (
    VenteProduitSerializer,
    ProduitsPharmacieSerializer,
    PharmacieSerializer
)
from rest_framework import viewsets, permissions
from rest_framework.response import Response
from rest_framework import status

class VenteProduitViewSet(viewsets.ModelViewSet):
    serializer_class = VenteProduitSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return VenteProduit.objects.filter(
            pharmacie=self.request.user.pharmacie
        )

    def perform_create(self, serializer):
        client_id = self.request.data.get('client')
        client = None

        if client_id:
            try:
                client = Client.objects.get(
                    id=client_id,
                    pharmacie=self.request.user.pharmacie
                )
            except Client.DoesNotExist:
                raise serializers.ValidationError("Client introuvable ou n'appartient pas à cette pharmacie.")

        serializer.save(
            utilisateur=self.request.user,
            client=client
        )

class VenteCreateAPIView(generics.CreateAPIView):
    queryset = VenteProduit.objects.all()
    serializer_class = VenteProduitSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        client_id = self.request.data.get('client')
        client = None

        if client_id:
            try:
                client = Client.objects.get(
                    id=client_id,
                    pharmacie=self.request.user.pharmacie
                )
            except Client.DoesNotExist:
                raise serializers.ValidationError("Client introuvable ou n'appartient pas à cette pharmacie.")

        serializer.save(
            utilisateur=self.request.user,
            client=client
        )

################# Historique de la vente #######################
# views.py
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils.dateparse import parse_date
from .models import VenteProduit
from .serializers import HistoriqueVenteSerializer

class HistoriqueVentesAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        pharmacie = request.user.pharmacie
        date_debut = request.GET.get('date_debut')
        date_fin = request.GET.get('date_fin')

        ventes = VenteProduit.objects.filter(pharmacie=pharmacie)

        if date_debut:
            ventes = ventes.filter(date_vente__date__gte=parse_date(date_debut))
        if date_fin:
            ventes = ventes.filter(date_vente__date__lte=parse_date(date_fin))

        ventes = ventes.order_by('-date_vente')
        serializer = HistoriqueVenteSerializer(ventes, many=True)
        return Response(serializer.data)

##################" Statistique Vente #################"


class ProduitPharmacieListAPIView(generics.ListAPIView):
    serializer_class = ProduitsPharmacieSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        pharmacie_id = self.request.query_params.get('pharmacie')
        return ProduitPharmacie.objects.filter(pharmacie_id=pharmacie_id)

class PharmacieUserListAPIView(generics.ListAPIView):
    serializer_class = PharmacieSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Pharmacie.objects.filter(user=self.request.user)
#########################" CLIENT ET TOUT C QUI LUI CONCERNE"################################
from rest_framework import viewsets, permissions
from .models import Client, MedicalExam
from .serializers import ClientSerializer, MedicalExamSerializer,ClientAfficherSerializer
from rest_framework import viewsets
from .models import Client
from .serializers import ClientSerializer
from rest_framework.permissions import IsAuthenticated

class ClientViewSet(viewsets.ModelViewSet):
    queryset = Client.objects.all()
    serializer_class = ClientSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(
            pharmacie=self.request.user.pharmacie,
            score_fidelite=0
        )
    
    def get_queryset(self):
        # Filtrer par pharmacie de l'utilisateur
        return super().get_queryset().filter(
            pharmacie=self.request.user.pharmacie
        )
    
from django.shortcuts import get_object_or_404
class MedicalExamViewSet(viewsets.ModelViewSet):
    queryset = MedicalExam.objects.all()
    serializer_class = MedicalExamSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        # Récupère le client avec gestion automatique des erreurs 404
        client_id = self.request.data.get('client')
        client = get_object_or_404(Client, id=client_id)  # Utilisation correcte
        
        serializer.save(
            client=client,
            created_by=self.request.user
        )

################ Cient Afficher et gerer même le medicamen, prescription et autres############

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.status import HTTP_201_CREATED, HTTP_400_BAD_REQUEST
from rest_framework.permissions import IsAuthenticated
from .models import Client, MedicalExam
from .serializers import MedicalExamSerializer
from rest_framework import status


class CreateMedicalExamView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            client = Client.objects.get(pk=pk, pharmacie=request.user.pharmacie)
        except Client.DoesNotExist:
            return Response({"error": "Client non trouvé ou non autorisé"}, status=status.HTTP_400_BAD_REQUEST)

        # Conversion explicite des données reçues
        data = request.data.copy()
        
        # Assure-toi que 'examen_malaria' est bien un booléen
        if 'examen_malaria' in data:
            if isinstance(data['examen_malaria'], str):
                # Convertir les chaînes comme "true"/"True"/"1" en booléen
                data['examen_malaria'] = data['examen_malaria'].lower() in ['true', '1']
            else:
                # Si c'est envoyé via JSON, ce sera souvent 0/1 ou true/false
                data['examen_malaria'] = bool(data['examen_malaria'])

        serializer = MedicalExamSerializer(data=data)

        if serializer.is_valid():
            exam = serializer.save(client=client)
            return Response(MedicalExamSerializer(exam).data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.status import HTTP_201_CREATED, HTTP_400_BAD_REQUEST
from rest_framework.permissions import IsAuthenticated
from .models import Client, ProduitPharmacie, Prescription
from .serializers import PrescriptionSerializer

class CreatePrescriptionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            client = Client.objects.get(pk=pk, pharmacie=request.user.pharmacie)
        except Client.DoesNotExist:
            return Response({"error": "Client non trouvé"}, status=400)

        data = request.data.copy()
        data['client'] = client.id  # Pour validation du serializer si nécessaire

        serializer = PrescriptionSerializer(data=data)
        if serializer.is_valid():
            prescription = serializer.save(client=client)
            return Response(serializer.data, status=HTTP_201_CREATED)
        return Response(serializer.errors, status=HTTP_400_BAD_REQUEST)

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Client, MedicalExam, Prescription
from .serializers import MedicalExamSerializer, PrescriptionsSerializer

class DossierMedicalClientView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            client = Client.objects.get(pk=pk, pharmacie=request.user.pharmacie)
            exams = MedicalExam.objects.filter(client=client)
            prescriptions = Prescription.objects.filter(client=client)

            return Response({
                "client": {
                    "id": client.id,
                    "nom_complet": client.nom_complet,
                    "telephone": client.telephone,
                    "created_at": client.created_at
                },
                "examens": MedicalExamSerializer(exams, many=True).data,
                "prescriptions": PrescriptionsSerializer(prescriptions, many=True).data
            }, status=200)
        except Client.DoesNotExist:
            return Response({"error": "Client non trouvé"}, status=404)

######################Contenu alerte stock rupture ########################
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import ProduitPharmacie
from .serializers import ProduitAlertPharmacieSerializer
from rest_framework.response import Response
from rest_framework.decorators import api_view
from .models import ProduitPharmacie
from django.db.models import F

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def produits_en_alerte(request):
    produits = ProduitPharmacie.objects.filter(quantite__lte=F('alerte_quantite'))
    
    result = []
    for p in produits:
        if p.quantite <= p.alerte_quantite:
            if p.quantite <= p.alerte_quantite / 2:
                niveau = 'danger'
            else:
                niveau = 'warning'
            result.append({
                'id': p.id,
                'nom_medicament': p.nom_medicament,
                'quantite': p.quantite,
                'alerte_quantite': p.alerte_quantite,
                'niveau_alerte': niveau
            })

    return Response(result)


# pharmacie/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import ProduitPharmacie,Requisition
from .serializers import ProduitAlerteSerializer,RequisitionSerializer

###################### Affiche sur ecran acceuil directeur###################
# views.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from datetime import date
from django.db.models import Sum, F
from .models import VenteProduit, VenteLigne

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def statistiques_du_jour(request):
    user = request.user
    pharmacie = user.pharmacie  # ou lié via profil

    today = date.today()

    ventes_du_jour = VenteProduit.objects.filter(
        pharmacie=pharmacie,
        date_vente__date=today
    )

    total_ventes = ventes_du_jour.aggregate(total=Sum('montant_total'))['total'] or 0

    lignes_du_jour = VenteLigne.objects.filter(
        vente__in=ventes_du_jour
    )

    chiffre_affaire = lignes_du_jour.aggregate(total=Sum('total'))['total'] or 0

    # Bénéfice = (Prix_vente - Prix_achat) * quantite
    lignes = lignes_du_jour.annotate(
        benefice_unitaire=(F('prix_unitaire') - F('produit__prix_achat')) * F('quantite')
    )
    benefice = lignes.aggregate(total=Sum('benefice_unitaire'))['total'] or 0

    # Produit le plus vendu
    produit_plus_vendu = (
        lignes_du_jour.values('produit__nom_medicament')
        .annotate(qte=Sum('quantite'))
        .order_by('-qte')
        .first()
    )

    return Response({
        "chiffre_affaire": chiffre_affaire,
        "benefice": benefice,
        "total_ventes": total_ventes,
        "produit_plus_vendu": produit_plus_vendu['produit__nom_medicament'] if produit_plus_vendu else "Aucun"
    })


################## Rapport Générale ######################################"
# views.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from datetime import date, timedelta
from django.db.models import Sum, F
from .models import VenteProduit, VenteLigne

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def rapport_general(request):
    user = request.user
    pharmacie = user.pharmacie  # Assurez-vous que l'utilisateur est lié à une pharmacie

    periode = request.GET.get('periode', 'jour')
    today = date.today()

    if periode == 'jour':
        date_debut = today
    elif periode == 'semaine':
        date_debut = today - timedelta(days=today.weekday())
    elif periode == 'mois':
        date_debut = today.replace(day=1)
    else:
        return Response({'error': 'Période invalide'}, status=400)

    ventes = VenteProduit.objects.filter(
        pharmacie=pharmacie,
        date_vente__date__gte=date_debut,
        date_vente__date__lte=today
    )

    total_ventes = ventes.aggregate(total=Sum('montant_total'))['total'] or 0

    lignes = VenteLigne.objects.filter(vente__in=ventes)

    chiffre_affaire = lignes.aggregate(total=Sum('total'))['total'] or 0

    lignes = lignes.annotate(
        benefice_unitaire=(F('prix_unitaire') - F('produit__prix_achat')) * F('quantite')
    )
    benefice = lignes.aggregate(total=Sum('benefice_unitaire'))['total'] or 0

    produit_plus_vendu = (
        lignes.values('produit__nom_medicament')
        .annotate(qte=Sum('quantite'))
        .order_by('-qte')
        .first()
    )

    return Response({
        "periode": periode,
        "date_debut": date_debut,
        "date_fin": today,
        "chiffre_affaire": chiffre_affaire,
        "benefice": benefice,
        "total_ventes": total_ventes,
        "produit_plus_vendu": produit_plus_vendu['produit__nom_medicament'] if produit_plus_vendu else "Aucun"
    })



from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status


# views.py
from rest_framework import viewsets, status
from rest_framework.response import Response
from .models import Requisition
from .serializers import RequisitionSerializer, ClientRendezvousSerializer

class RequisitionViewSet(viewsets.ModelViewSet):
    queryset = Requisition.objects.all()
    serializer_class = RequisitionSerializer

    def create(self, request, *args, **kwargs):
        pharmacie = request.data.get('pharmacie')
        produit_fabricant = request.data.get('produit_fabricant')
        nom_personnalise = request.data.get('nom_personnalise')

        try:
            if produit_fabricant:
                obj, created = Requisition.objects.get_or_create(
                    pharmacie_id=pharmacie,
                    produit_fabricant_id=produit_fabricant,
                    defaults={"nombre_demandes": 1}
                )
                if not created:
                    obj.nombre_demandes += 1
                    obj.save()
                serializer = self.get_serializer(obj)
                return Response(serializer.data, status=status.HTTP_201_CREATED)

            elif nom_personnalise:
                obj, created = Requisition.objects.get_or_create(
                    pharmacie_id=pharmacie,
                    nom_personnalise=nom_personnalise,
                    defaults={"nombre_demandes": 1}
                )
                if not created:
                    obj.nombre_demandes += 1
                    obj.save()
                serializer = self.get_serializer(obj)
                return Response(serializer.data, status=status.HTTP_201_CREATED)

            return Response({"detail": "Aucun produit ou nom personnalisé fourni."},
                            status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# views.py
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import Requisition

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def incrementer_demande(request, pk):
    try:
        requisition = Requisition.objects.get(pk=pk)
        requisition.nombre_demandes += 1
        requisition.save()
        return Response({'message': 'Nombre de demandes incrémenté.'})
    except Requisition.DoesNotExist:
        return Response({'error': 'Requisition introuvable.'}, status=status.HTTP_404_NOT_FOUND)


####################### Historique Commande Reception produit chez le fournisseur ###########""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import CommandeProduit
from .serializers import MouvementCommandeSerializer

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def historique_mouvements(request):
    pharmacie = request.user.pharmacie
    commandes = CommandeProduit.objects.filter(pharmacie=pharmacie).order_by('-date_commande')
    serializer = MouvementCommandeSerializer(commandes, many=True)
    return Response(serializer.data)


from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from comptes.serializers import UserSerializer

class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

# views.py
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import Requisition

@api_view(['DELETE'])
def reset_requisitions(request):
    pharmacie_id = request.GET.get('pharmacie')
    if not pharmacie_id:
        return Response({"detail": "Pharmacie non spécifiée."}, status=status.HTTP_400_BAD_REQUEST)
    
    Requisition.objects.filter(pharmacie_id=pharmacie_id).delete()
    return Response({"detail": "Réquisitions supprimées."}, status=status.HTTP_204_NO_CONTENT)

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import Requisition

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_all_requisitions(request):
    pharmacie_id = request.query_params.get('pharmacie')
    if not pharmacie_id:
        return Response({"detail": "ID de la pharmacie requis."}, status=status.HTTP_400_BAD_REQUEST)

    requisitions = Requisition.objects.filter(pharmacie_id=pharmacie_id)
    count = requisitions.count()
    requisitions.delete()
    return Response({"detail": f"{count} réquisition(s) supprimée(s)."}, status=status.HTTP_200_OK)


# views.py
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.db.models import Sum, Count
from django.db.models.functions import TruncDay, TruncWeek, TruncMonth
from .models import VenteProduit

@permission_classes([IsAuthenticated])
@api_view(['GET'])
def historique_ventes(request):
    utilisateur_id = request.GET.get('utilisateur')

    if not utilisateur_id:
        return Response({"error": "Utilisateur ID manquant."}, status=400)

    ventes = VenteProduit.objects.filter(utilisateur_id=utilisateur_id)

    par_jour = ventes.annotate(jour=TruncDay('date_vente')).values('jour').annotate(
        total=Sum('montant_total'), nb=Count('id')
    ).order_by('-jour')

    par_semaine = ventes.annotate(semaine=TruncWeek('date_vente')).values('semaine').annotate(
        total=Sum('montant_total'), nb=Count('id')
    ).order_by('-semaine')

    par_mois = ventes.annotate(mois=TruncMonth('date_vente')).values('mois').annotate(
        total=Sum('montant_total'), nb=Count('id')
    ).order_by('-mois')

    details = [
        {
            "id": v.id,
            "date": v.date_vente,
            "montant_total": v.montant_total,
            "client": v.client.nom_client if v.client else "N/A",
            "lignes": [
                {
                    "produit": l.produit.nom_medicament,
                    "quantite": l.quantite,
                    "total": l.total
                }
                for l in v.lignes.all()
            ]
        }
        for v in ventes.select_related('client').prefetch_related('lignes__produit')
    ]

    return Response({
        "par_jour": list(par_jour),
        "par_semaine": list(par_semaine),
        "par_mois": list(par_mois),
        "details": details
    })



##################### Exporter les données Via une clef usb##########################
import json
import os
from .models import Fabricant, ProduitFabricant, ClientPurchase,ProduitPharmacie, ReceptionLigne,ReceptionProduit,CommandeProduitLigne,CommandeProduit, VenteProduit, Client
from django.http import JsonResponse, FileResponse
from django.core.serializers import serialize
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from datetime import datetime
from tempfile import NamedTemporaryFile
import os
import subprocess
from datetime import datetime
from django.http import FileResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from django.conf import settings

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def sauvegarde_sql(request):
    # Récupération des infos depuis settings.py
    db_settings = settings.DATABASES['default']
    db_name = db_settings['NAME']
    db_user = db_settings['USER']
    db_host = db_settings.get('HOST', 'localhost')
    db_port = db_settings.get('PORT', '5432')

    # Nom temporaire du fichier
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    filename = f"backup_{timestamp}.sql"
    filepath = os.path.join('/tmp', filename)

    try:
        # Générer la commande pg_dump
        command = [
            'pg_dump',
            '-h', db_host,
            '-p', db_port,
            '-U', db_user,
            '-f', filepath,
            db_name
        ]

        # Lancer pg_dump avec mot de passe par variable d'environnement
        env = os.environ.copy()
        env["PGPASSWORD"] = db_settings['PASSWORD']

        subprocess.run(command, env=env, check=True)

        # Retourner le fichier en téléchargement
        response = FileResponse(open(filepath, 'rb'), as_attachment=True)
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response

    except Exception as e:
        return JsonResponse({'erreur': str(e)}, status=500)


import os
import shutil
import platform
from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from django.http import StreamingHttpResponse
import time

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def copier_vers_usb(request):
    dump_dir = "/tmp"
    backup_files = [f for f in os.listdir(dump_dir) if f.startswith("backup_") and f.endswith(".sql")]

    if not backup_files:
        return JsonResponse({'error': 'Aucun fichier de sauvegarde trouvé'}, status=404)

    backup_files.sort(reverse=True)
    latest_backup = backup_files[0]
    sql_path = os.path.join(dump_dir, latest_backup)

    usb_found = None

    system = platform.system()

    if system == "Linux":
        usb_base_paths = ["/media", "/mnt"]
        for base_path in usb_base_paths:
            if not os.path.exists(base_path):
                continue
            for user_folder in os.listdir(base_path):
                full_path = os.path.join(base_path, user_folder)
                if os.path.isdir(full_path):
                    for device in os.listdir(full_path):
                        usb_path = os.path.join(full_path, device)
                        if os.path.ismount(usb_path):
                            usb_found = usb_path
                            break
                    if usb_found:
                        break
            if usb_found:
                break

    elif system == "Windows":
        # Cherche les lecteurs amovibles (USB) dans les lettres D: à Z:
        from ctypes import windll

        DRIVE_REMOVABLE = 2
        bitmask = windll.kernel32.GetLogicalDrives()
        for letter in range(2, 26):  # D-Z
            if bitmask & (1 << letter):
                drive_letter = f"{chr(65 + letter)}:\\"
                if os.path.exists(drive_letter):
                    drive_type = windll.kernel32.GetDriveTypeW(drive_letter)
                    if drive_type == DRIVE_REMOVABLE:
                        usb_found = drive_letter
                        break

    if not usb_found:
        return JsonResponse({'error': 'Clé USB non trouvée. Assurez-vous qu’elle est branchée et montée.'}, status=404)

    try:
        shutil.copy(sql_path, os.path.join(usb_found, latest_backup))
        return JsonResponse({'message': f'Fichier copié avec succès vers {usb_found}'})
    except Exception as e:
        return JsonResponse({'error': f'Échec de la copie : {str(e)}'}, status=500)

####################### Modifier les prix par fabicant########################
# views.py
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import ProduitFabricant
from .serializers import ProduitListeModifierFabricantSerializer

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def produits_par_fabricants(request, fabricant_id):
    produits = ProduitFabricant.objects.filter(fabricant_id=fabricant_id)
    serializer = ProduitListeModifierFabricantSerializer(produits, many=True)
    return Response(serializer.data)

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def modifier_prix_produit(request, produit_id):
    try:
        produit = ProduitFabricant.objects.get(id=produit_id)
    except ProduitFabricant.DoesNotExist:
        return Response({'success': False, 'error': 'Produit non trouvé'}, status=404)

    nouveau_prix = request.data.get('prix_achat')
    if nouveau_prix is None:
        return Response({'success': False, 'error': 'prix_achat manquant'}, status=400)

    try:
        # On essaie de convertir en float, pour valider la donnée
        produit.prix_achat = float(nouveau_prix)
    except ValueError:
        return Response({'success': False, 'error': 'prix_achat invalide'}, status=400)

    produit.save()
    return Response({'success': True, 'prix_achat': produit.prix_achat})

# views.py
from rest_framework import viewsets
from .models import RendezVous
from .serializers import RendezVousSerializer

class RendezVousViewSet(viewsets.ModelViewSet):
    queryset = RendezVous.objects.all()
    serializer_class = RendezVousSerializer
    permission_classes = [IsAuthenticated]

# views.py
class RendezVousListCreateView(generics.ListCreateAPIView):
    queryset = RendezVous.objects.all()
    serializer_class = RendezVousSerializer

class RendezVousByClientView(generics.ListAPIView):
    serializer_class = RendezVousSerializer

    def get_queryset(self):
        client_id = self.kwargs['client_id']
        return RendezVous.objects.filter(client__id=client_id)
###############################
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Client, RendezVous
from .serializers import ClientSerializer
from datetime import date

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def clients_avec_rendezvous(request):
    pharmacie = request.user.pharmacie  # suppose que le user est lié à une pharmacie
    clients = Client.objects.filter(pharmacie=pharmacie)

    results = []
    for client in clients:
        prochain_rdv = RendezVous.objects.filter(client=client, statut='à venir', date__gte=date.today()).order_by('date').first()
        if prochain_rdv:
            results.append({
                'id': client.id,
                'nom_complet': client.nom_complet,
                'telephone': client.telephone,
                'rendez_vous': prochain_rdv.date,
            })

    return Response(results)

