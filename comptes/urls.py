from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import LoginAPIView
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PharmacieViewSet,DashboardComptableAPIView, UserViewSet,ComptableUserViewSet, CreateDirectorView, PharmacieDetailView #CreateAccountantView

router = DefaultRouter()
router.register(r'pharmacies', PharmacieViewSet)
router.register(r'users', UserViewSet)
router.register(r'comptables', ComptableUserViewSet, basename='comptable')

urlpatterns = [
    path('api/', include(router.urls)),
    path('api/login/', LoginAPIView.as_view(), name='api-login'),
    path('api/create-director/<int:pharmacie_id>/', CreateDirectorView.as_view(), name='create-director'),
    path('api/pharmacie/', PharmacieDetailView.as_view(), name='pharmacie-detail'),
    path('api/dashboard/comptable/', DashboardComptableAPIView.as_view(), name='dashboard_comptable'),
    #path('api/create-accountant/', CreateAccountantView.as_view(), name='create-accountant'),
    
]
