# Generated by Django 5.2.1 on 2025-06-22 13:51

import django.db.models.deletion
import django.utils.timezone
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('auth', '0012_alter_user_first_name_max_length'),
    ]

    operations = [
        migrations.CreateModel(
            name='Pharmacie',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nom_pharm', models.CharField(max_length=100, verbose_name='Nom de la pharmacie')),
                ('ville_pharm', models.CharField(max_length=50, verbose_name='Ville')),
                ('commune_pharm', models.CharField(max_length=50, verbose_name='Commune/Arrondissement')),
                ('adresse_pharm', models.TextField(verbose_name='Adresse détaillée')),
                ('rccm', models.CharField(max_length=20, unique=True, verbose_name='Numéro RCCM')),
                ('idnat', models.CharField(max_length=20, unique=True, verbose_name='Numéro IDNAT')),
                ('ni', models.CharField(max_length=20, verbose_name='Numéro National')),
                ('telephone', models.CharField(max_length=20, verbose_name='Téléphone')),
                ('logo_pharm', models.ImageField(blank=True, null=True, upload_to='profile_pictures/')),
                ('latitude', models.DecimalField(blank=True, decimal_places=6, max_digits=9, null=True)),
                ('longitude', models.DecimalField(blank=True, decimal_places=6, max_digits=9, null=True)),
                ('montant_mensuel', models.DecimalField(decimal_places=2, default=0.0, max_digits=10, verbose_name='Montant mensuel à payer')),
                ('is_active', models.BooleanField(default=True, verbose_name='Pharmacie active ?')),
            ],
        ),
        migrations.CreateModel(
            name='User',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('password', models.CharField(max_length=128, verbose_name='password')),
                ('last_login', models.DateTimeField(blank=True, null=True, verbose_name='last login')),
                ('is_superuser', models.BooleanField(default=False, help_text='Designates that this user has all permissions without explicitly assigning them.', verbose_name='superuser status')),
                ('username', models.CharField(max_length=150, unique=True)),
                ('first_name', models.CharField(blank=True, max_length=30)),
                ('last_name', models.CharField(blank=True, max_length=30)),
                ('email', models.EmailField(blank=True, max_length=254)),
                ('is_active', models.BooleanField(default=True)),
                ('is_staff', models.BooleanField(default=False)),
                ('date_joined', models.DateTimeField(default=django.utils.timezone.now)),
                ('role', models.CharField(choices=[('superuser', 'Superuser'), ('admin', 'Admin'), ('directeur', 'Directeur'), ('comptable', 'Comptable')], default='comptable', max_length=50)),
                ('profile_picture', models.ImageField(blank=True, null=True, upload_to='profile_pictures/')),
                ('groups', models.ManyToManyField(blank=True, help_text='The groups this user belongs to. A user will get all permissions granted to each of their groups.', related_name='user_set', related_query_name='user', to='auth.group', verbose_name='groups')),
                ('user_permissions', models.ManyToManyField(blank=True, help_text='Specific permissions for this user.', related_name='user_set', related_query_name='user', to='auth.permission', verbose_name='user permissions')),
                ('pharmacie', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to='comptes.pharmacie')),
            ],
            options={
                'abstract': False,
            },
        ),
    ]
