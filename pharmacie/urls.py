from rest_framework.routers import DefaultRouter
from django.urls import path, include
from .views import (
    FabricantViewSet,
    ProduitFabricantViewSet,
    ProduitPharmacieViewSet,
    ProduitPharmacieListAPIView,
    PharmacieUserListAPIView,
    VenteCreateAPIView,    
    produits_par_fabricant,
    ClientViewSet,
    MedicalExamViewSet,
    CreateMedicalExamView,
    CreatePrescriptionView,
    DossierMedicalClientView,
    CommandeProduitViewSet,
    ProduitsDuFabricantView,
    ConfirmerReceptionView,
    CommandeDetailView,
    CommandeProduitListView,
    TauxChangeViewSet,
    produits_en_alerte,
    #ProduitsAlerteAPIView,
    RequisitionViewSet,
    incrementer_demande,
    statistiques_du_jour,
    rapport_general,
    historique_mouvements,
    HistoriqueVentesAPIView,
    MeView, 
    reset_requisitions,
    delete_all_requisitions,
    sauvegarde_sql,
    copier_vers_usb,
    produits_par_fabricants,
    modifier_prix_produit,
    RendezVousViewSet,
RendezVousListCreateView,
RendezVousByClientView,
clients_avec_rendezvous,
LotProduitPharmacieViewSet,
PubliciteActuelleView



)

router = DefaultRouter()

router.register(r'fabricants', FabricantViewSet)
router.register(r'taux-change', TauxChangeViewSet)
router.register(r'produits-fabricants', ProduitFabricantViewSet)
router.register(r'produits-pharmacie', ProduitPharmacieViewSet, basename='produit-pharmacie')
router.register(r'commandes-produits', CommandeProduitViewSet)
router.register(r'clients', ClientViewSet)
router.register(r'exams', MedicalExamViewSet)
router.register(r'requisitions', RequisitionViewSet, basename='requisitions')
router.register(r'rendezvous', RendezVousViewSet)
router.register(r'lots', LotProduitPharmacieViewSet)


urlpatterns = [
    path('api/', include(router.urls)),
    path('api/requisitions/reset/', reset_requisitions),
    path('api/rendez-vous/client/<int:client_id>/', RendezVousByClientView.as_view()),
    path('api/rendez-vous/', RendezVousListCreateView.as_view()),
    path('api/clients-avec-rendezvous/', clients_avec_rendezvous, name='clients-avec-rendezvous'),
    path('api/sauvegarde-sql/', sauvegarde_sql, name='sauvegarde_sql'),
    path('api/copier-usb/', copier_vers_usb, name='copier_vers_usb'),
    path('api/produits/<int:fabricant_id>/', produits_par_fabricants, name='api_produits_fabricant'),
    path('api/produit/<int:produit_id>/modifier/', modifier_prix_produit, name='api_modifier_prix'),
    path('api/publicite-active/', PubliciteActuelleView.as_view()),
    path('api/requisitions/delete_all/', delete_all_requisitions, name='delete_all_requisitions'),


    # Produits par fabricant
    path('api/produits-fabricant/', produits_par_fabricant, name='produits-par-fabricant'),
    path('api/user/me/', MeView.as_view(), name='user-me'),
    path('api/fabricants/<int:pk>/produits/', ProduitsDuFabricantView.as_view()),
    
    path('api/produits-alerte/', produits_en_alerte, name='produits-alerte'),
    #path('api/produits-alerte/', ProduitsAlerteAPIView.as_view(), name='produits-alerte'),
    path('api/requisitions/<int:pk>/incrementer/', incrementer_demande),
    # Création d'une vente
    path('api/ventes/', VenteCreateAPIView.as_view(), name='vente-create'),
    path('api/statistiques-du-jour/', statistiques_du_jour),
    path('api/rapport-general/', rapport_general),
    path('api/historique-mouvements/', historique_mouvements, name='historique-mouvements'),
    path('api/historique-ventes/', HistoriqueVentesAPIView.as_view(), name='historique-ventes'),

    # Liste des produits d'une pharmacie
    path('api/commandes-produitss/', CommandeProduitListView.as_view(), name='liste-commandes-produits'),
    path('api/produits-pharmacie/', ProduitPharmacieListAPIView.as_view(), name='produits-pharmacie'),
    path('api/reception/confirm/', ConfirmerReceptionView.as_view(), name='confirmer-reception'),
    path('api/commande/<int:pk>/', CommandeDetailView.as_view(), name='commande-detail'),

    # Liste des pharmacies de l'utilisateur connecté
    path('api/pharmacie/', PharmacieUserListAPIView.as_view(), name='pharmacie-user'),
    path('api/clients/<int:pk>/examen/', CreateMedicalExamView.as_view(), name='create-exam'),
    path('api/clients/<int:pk>/ordonnance/', CreatePrescriptionView.as_view(), name='create-prescription'),
    path('api/clients/<int:pk>/dossier-medical/', DossierMedicalClientView.as_view(), name='dossier-medical'),
    
   
    
]
