from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.utils import timezone
from django.db import models

class Pharmacie(models.Model):
    nom_pharm = models.CharField(max_length=100, verbose_name="Nom de la pharmacie")
    ville_pharm = models.CharField(max_length=50, verbose_name="Ville")
    commune_pharm = models.CharField(max_length=50, verbose_name="Commune/Arrondissement")
    adresse_pharm = models.TextField(verbose_name="Adresse détaillée")
    rccm = models.CharField(max_length=20, unique=True, verbose_name="Numéro RCCM")
    idnat = models.CharField(max_length=20, unique=True, verbose_name="Numéro IDNAT")
    ni = models.CharField(max_length=20, verbose_name="Numéro National")
    telephone = models.CharField(max_length=20, verbose_name="Téléphone")
    logo_pharm = models.ImageField(upload_to='profile_pictures/', null=True, blank=True)

    def __str__(self):
        return self.nom_pharm

    class Meta:
        verbose_name = "Pharmacie"
        verbose_name_plural = "Pharmacies"

class CustomUserManager(BaseUserManager):
    def create_user(self, username, password=None, **extra_fields):
        if not username:
            raise ValueError('The Username field must be set')
        user = self.model(username=username, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, username, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'superuser')
        return self.create_user(username, password, **extra_fields)

class User(AbstractBaseUser, PermissionsMixin):
    username = models.CharField(max_length=150, unique=True)
    first_name = models.CharField(max_length=30, blank=True)
    last_name = models.CharField(max_length=30, blank=True)
    email = models.EmailField(blank=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)
    pharmacie = models.ForeignKey(Pharmacie, on_delete=models.CASCADE, null=True, blank=True)
    role = models.CharField(max_length=50, choices=[('superuser', 'Superuser'),('admin', 'Admin'), ('directeur', 'Directeur'), ('comptable', 'Comptable')], default='comptable')
    profile_picture = models.ImageField(upload_to='profile_pictures/', null=True, blank=True)

    objects = CustomUserManager()

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = []

    def __str__(self):
        return self.username
