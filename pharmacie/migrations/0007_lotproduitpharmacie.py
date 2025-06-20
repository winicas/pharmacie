# Generated by Django 5.2.1 on 2025-06-14 15:07

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('pharmacie', '0006_remove_rendezvous_created_at_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='LotProduitPharmacie',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('numero_lot', models.CharField(blank=True, help_text='Numéro du lot (fourni par le fournisseur ou généré automatiquement)', max_length=100, null=True, unique=True)),
                ('date_peremption', models.DateField()),
                ('date_entree', models.DateField(auto_now_add=True)),
                ('quantite', models.PositiveIntegerField()),
                ('prix_achat', models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True)),
                ('prix_vente', models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True)),
                ('produit', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='lots', to='pharmacie.produitpharmacie')),
            ],
        ),
    ]
