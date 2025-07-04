# Generated by Django 5.2.1 on 2025-06-30 11:18

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('comptes', '0002_pharmacie_date_activation_pharmacie_duree_en_jours_and_more'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='pharmacie',
            name='date_activation',
        ),
        migrations.RemoveField(
            model_name='pharmacie',
            name='duree_en_jours',
        ),
        migrations.RemoveField(
            model_name='pharmacie',
            name='idnat',
        ),
        migrations.RemoveField(
            model_name='pharmacie',
            name='rccm',
        ),
        migrations.AddField(
            model_name='pharmacie',
            name='date_expiration',
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name='pharmacie',
            name='adresse_pharm',
            field=models.TextField(),
        ),
        migrations.AlterField(
            model_name='pharmacie',
            name='commune_pharm',
            field=models.CharField(max_length=50),
        ),
        migrations.AlterField(
            model_name='pharmacie',
            name='is_active',
            field=models.BooleanField(default=True),
        ),
        migrations.AlterField(
            model_name='pharmacie',
            name='ni',
            field=models.CharField(max_length=20),
        ),
        migrations.AlterField(
            model_name='pharmacie',
            name='nom_pharm',
            field=models.CharField(max_length=100),
        ),
        migrations.AlterField(
            model_name='pharmacie',
            name='telephone',
            field=models.CharField(max_length=20),
        ),
        migrations.AlterField(
            model_name='pharmacie',
            name='ville_pharm',
            field=models.CharField(max_length=50),
        ),
    ]
