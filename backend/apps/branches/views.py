from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from apps.branches.models import Branch
from apps.branches.serializers import BranchSerializer
from apps.accounts.permissions import ModulePermission


class BranchViewSet(viewsets.ModelViewSet):
    """CRUD for branches — Super Admin only for create/update/delete."""
    serializer_class = BranchSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ["is_active", "is_head_office", "city"]
    search_fields = ["name", "code", "city"]
    ordering_fields = ["name", "city", "created_at"]
    ordering = ["name"]

    def get_queryset(self):
        user = self.request.user
        # Super Admin sees all; others see only their allowed branches
        if hasattr(user, "is_super_admin") and user.is_super_admin:
            return Branch.objects.all()
        branch_ids = user.branch_memberships.values_list("branch_id", flat=True)
        return Branch.objects.filter(id__in=branch_ids)

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [permissions.IsAuthenticated(), ModulePermission("branches", "edit")]
        return [permissions.IsAuthenticated()]

    @action(detail=False, methods=["get"], url_path="my-branches")
    def my_branches(self, request):
        """Returns branches the current user has access to."""
        branch_ids = request.user.branch_memberships.values_list("branch_id", flat=True)
        branches = Branch.objects.filter(id__in=branch_ids, is_active=True)
        serializer = self.get_serializer(branches, many=True)
        return Response(serializer.data)
