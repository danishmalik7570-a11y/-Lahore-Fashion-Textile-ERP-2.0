from rest_framework import viewsets, permissions
from .models import Worker
from .serializers import WorkerSerializer

class WorkerViewSet(viewsets.ModelViewSet):
    queryset = Worker.objects.all()
    serializer_class = WorkerSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ["department", "skill_grade", "shift", "is_active"]
    search_fields = ["employee_code", "name", "cnic"]