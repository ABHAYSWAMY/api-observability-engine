from django.contrib import admin
from .models import (
    Project,
    APIKey,
    RequestMetric,
    AggregatedMetric,
    AlertPolicy,
    AlertEvent,
)


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "owner", "created_at")
    readonly_fields = ("id", "created_at")


@admin.register(APIKey)
class APIKeyAdmin(admin.ModelAdmin):
    list_display = ("id", "project", "is_active", "created_at")
    readonly_fields = ("id", "key", "created_at")


admin.site.register(RequestMetric)
admin.site.register(AggregatedMetric)
admin.site.register(AlertPolicy)
admin.site.register(AlertEvent)



