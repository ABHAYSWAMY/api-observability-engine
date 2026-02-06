"""
URL configuration for backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path
from core.views import IngestMetricView,whoami,list_projects, list_raw_metrics, list_aggregated_metrics, get_alerts, get_policies

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/ingest", IngestMetricView.as_view()),
    path("api/whoami", whoami),
    path("api/projects", list_projects),
    path("api/projects/<uuid:project_id>/metrics", list_raw_metrics),
    path("api/projects/<uuid:project_id>/metrics/aggregated",list_aggregated_metrics),
    path("api/projects/<uuid:project_id>/policies", get_policies),
    path("api/projects/<uuid:project_id>/alerts", get_alerts),
]
