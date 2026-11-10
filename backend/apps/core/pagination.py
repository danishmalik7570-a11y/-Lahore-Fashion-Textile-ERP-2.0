"""
Cursor-based and page-based pagination for DRF.
Default: CursorPagePagination — safe for large tables, no count() overhead.
"""
from rest_framework.pagination import CursorPagination, PageNumberPagination
from rest_framework.response import Response
from typing import Any


class CursorPagePagination(CursorPagination):
    """
    Cursor-based pagination — O(1), works well with 1M+ rows.
    Ordered by created_at DESC by default.
    """
    page_size = 25
    page_size_query_param = "page_size"
    max_page_size = 200
    ordering = "-created_at"
    cursor_query_param = "cursor"


class StandardPagePagination(PageNumberPagination):
    """
    Offset-based pagination for reports / exports where total count matters.
    """
    page_size = 25
    page_size_query_param = "page_size"
    max_page_size = 500
    page_query_param = "page"

    def get_paginated_response(self, data: Any) -> Response:
        return Response({
            "count": self.page.paginator.count,
            "total_pages": self.page.paginator.num_pages,
            "next": self.get_next_link(),
            "previous": self.get_previous_link(),
            "results": data,
        })

    def get_paginated_response_schema(self, schema: Any) -> dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "count": {"type": "integer"},
                "total_pages": {"type": "integer"},
                "next": {"type": "string", "nullable": True},
                "previous": {"type": "string", "nullable": True},
                "results": schema,
            },
        }
