from rest_framework import viewsets, permissions
from .models import StockItem, StockTransaction
from .serializers import StockItemSerializer, StockTransactionSerializer

class StockItemViewSet(viewsets.ModelViewSet):
    queryset = StockItem.objects.all()
    serializer_class = StockItemSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ["category"]
    search_fields = ["code", "name", "warehouse_location"]

class StockTransactionViewSet(viewsets.ModelViewSet):
    queryset = StockTransaction.objects.all()
    serializer_class = StockTransactionSerializer
    permission_classes = [permissions.IsAuthenticated]