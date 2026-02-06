from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import Project, APIKey
from .models import generate_api_key


@receiver(post_save, sender=Project)
def create_api_key_for_project(sender, instance, created, **kwargs):
    if created:
        APIKey.objects.create(
            project=instance,
            key=generate_api_key()
        )
