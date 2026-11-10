"""Stub dashboard views — will be fully implemented in Phase 11."""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated


class DashboardSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({"message": "Dashboard summary — Phase 11 implementation pending."})


class DashboardProductionFlowView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({"message": "Production flow — Phase 11 implementation pending."})
