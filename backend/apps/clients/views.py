from rest_framework import viewsets, permissions
from .models import Client, ClientContact
from .serializers import ClientSerializer, ClientContactSerializer

class ClientViewSet(viewsets.ModelViewSet):
    queryset = Client.objects.all()
    serializer_class = ClientSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ["city", "brand_type", "status"]
    search_fields = ["name", "ntn", "contact_person"]