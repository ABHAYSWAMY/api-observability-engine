import uuid
import secrets
from django.db import models
from django.contrib.auth.models import User

def generate_api_key():
    return secrets.token_hex(32)

class Project(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    name = models.CharField(max_length=100)
    email = models.EmailField(null=True,blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class APIKey(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(Project, on_delete=models.CASCADE)
    key = models.CharField(max_length=64, unique=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.project.name} - {self.key[:6]}..."
    
class RequestMetric(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE)
    endpoint = models.CharField(max_length=255)
    method = models.CharField(max_length=10)
    status_code = models.IntegerField()
    latency_ms = models.IntegerField()
    timestamp = models.DateTimeField()

    class Meta:
        indexes = [
            models.Index(fields=["project", "timestamp"]),
            models.Index(fields=["status_code"]),
            models.Index(fields=["endpoint"]),
        ]

    def __str__(self):
        return f"{self.project.name} {self.endpoint} {self.status_code}"

class AggregatedMetric(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE)
    endpoint = models.CharField(max_length=255)

    bucket_start = models.DateTimeField()
    bucket_size = models.CharField(
        max_length=10,
        choices=[
            ("1m", "1 minute"),
            ("5m", "5 minutes"),
            ("1h", "1 hour"),
        ],
    )

    request_count = models.IntegerField()
    error_count = models.IntegerField()
    p95_latency_ms = models.IntegerField()

    class Meta:
        unique_together = ("project", "endpoint", "bucket_start", "bucket_size")
        indexes = [
            models.Index(fields=["project", "bucket_start"]),
        ]

    def __str__(self):
        return f"{self.project.name} {self.endpoint} {self.bucket_size}"

class AlertPolicy(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)

    metric = models.CharField(
        max_length=20,
        choices=[
            ("latency_p95", "Latency p95"),
            ("error_rate", "Error rate"),
            ("throughput", "Throughput"),
        ],
    )

    threshold = models.FloatField()
    comparison = models.CharField(
        max_length=5,
        choices=[
            (">", ">"),
            ("<", "<"),
        ],
    )

    severity = models.CharField(
        max_length=10,
        choices=[
            ("info", "info"),
            ("warn", "warn"),
            ("critical", "critical"),
        ],
    )

    cooldown_minutes = models.IntegerField(default=15)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.project.name} - {self.name}"

class AlertEvent(models.Model):
    policy = models.ForeignKey(AlertPolicy, on_delete=models.CASCADE)
    triggered_at = models.DateTimeField()
    value = models.FloatField()
    resolved = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.policy.name} @ {self.triggered_at}"
