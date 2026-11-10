from rest_framework import viewsets, permissions
from .models import QCAudit
from .serializers import QCAuditSerializer

class QCAuditViewSet(viewsets.ModelViewSet):
    queryset = QCAudit.objects.all()
    serializer_class = QCAuditSerializer
    permission_classes = [permissions.IsAuthenticated]
    search_fields = ["audit_number", "roll_number", "fabric_spec", "auditor_name"]
    filterset_fields = ["result"]