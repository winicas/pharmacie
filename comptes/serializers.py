from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User

class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()

    def validate(self, data):
        user = authenticate(**data)
        if user and user.is_active:
            return user
        raise serializers.ValidationError("Identifiants incorrects")

from django.contrib.auth import get_user_model

User = get_user_model()

from rest_framework import serializers
from .models import Pharmacie, User
from django.contrib.auth.hashers import make_password

class PharmacieSerializer(serializers.ModelSerializer):
    class Meta:
        model = Pharmacie
        fields = [
            'id',
            'nom_pharm',
            'ville_pharm',
            'commune_pharm',
            'adresse_pharm',
            'rccm',
            'idnat',
            'ni',
            'telephone',
            'logo_pharm',
        ]

class UserSerializer(serializers.ModelSerializer):
    pharmacie = PharmacieSerializer(read_only=True)
    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'first_name',
            'last_name',
            'email',
            'role',
            'pharmacie',
            'profile_picture',
            'date_joined',
        ]

    def create(self, validated_data):
        # Utilisez le manager personnalisé pour créer l'utilisateur
        password = validated_data.pop('password', None)
        user = User.objects.create_user(**validated_data)
        if password:
            user.set_password(password)
            user.save()
        return user
class UsercomptableSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'first_name',
            'last_name',
            'email',
            'password',  # ✅ Ajouté ici
            'role',
            'pharmacie',
            'profile_picture',
            'date_joined',
            'is_active',
        ]
        read_only_fields = ['pharmacie', 'date_joined']
    def create(self, validated_data):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            raise serializers.ValidationError("Utilisateur non authentifié.")

        directeur = request.user
        if directeur.role != 'directeur':
            raise serializers.ValidationError("Seul un directeur peut créer un utilisateur.")

        validated_data['pharmacie'] = directeur.pharmacie
        validated_data['role'] = 'comptable'

        password = validated_data.pop('password')  # ← maintenant ce champ existera
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


# serializers.py
from rest_framework import serializers
from .models import User

class CreateDirectorSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['username', 'password', 'first_name', 'last_name']
        extra_kwargs = {
            'password': {'write_only': True},
        }

    def create(self, validated_data):
        validated_data['role'] = 'directeur'
        pharmacie_id = self.context['pharmacie_id']
        validated_data['pharmacie_id'] = pharmacie_id
        user = User.objects.create_user(**validated_data)
        return user

from rest_framework import serializers

class ComptableDashboardSerializer(serializers.Serializer):
    total_depenses = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_recettes = serializers.DecimalField(max_digits=12, decimal_places=2)
    solde = serializers.DecimalField(max_digits=12, decimal_places=2)


