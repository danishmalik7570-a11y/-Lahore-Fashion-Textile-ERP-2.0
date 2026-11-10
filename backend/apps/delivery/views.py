from rest_framework import viewsets, permissions
from .models import DeliveryChallan
from .serializers import DeliveryChallanSerializer

class DeliveryChallanViewSet(viewsets.ModelViewSet):
    queryset = DeliveryChallan.objects.all()
    serializer_class = DeliveryChallanSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ["status"]
    search_fields = ["number", "client_name", "vehicle_number", "driver_name"]