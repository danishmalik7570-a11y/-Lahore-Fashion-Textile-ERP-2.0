from rest_framework import viewsets, permissions
from apps.rbac.permissions import RBACPermission
from .models import CompanySetting
from .serializers import CompanySettingSerializer

class CompanySettingViewSet(viewsets.ModelViewSet):
    queryset = CompanySetting.objects.all()
    serializer_class = CompanySettingSerializer
    permission_classes = [permissions.IsAuthenticated, RBACPermission]
    rbac_module = "settings"