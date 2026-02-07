from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta

from core.models import RequestMetric


class Command(BaseCommand):
    help = "Delete raw request metrics older than retention period"

    def handle(self, *args, **options):
        retention_days = 7
        cutoff = timezone.now() - timedelta(days=retention_days)

        deleted_count, _ = RequestMetric.objects.filter(
            timestamp__lt=cutoff
        ).delete()

        self.stdout.write(
            self.style.SUCCESS(
                f"Deleted {deleted_count} raw request metrics older than {retention_days} days"
            )
        )
