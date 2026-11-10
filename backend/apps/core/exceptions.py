"""
RFC 7807 Problem Details exception handler for DRF.
Returns consistent JSON error structure:
{
  "type": "https://lahorefashion.com/errors/validation",
  "title": "Validation Error",
  "status": 422,
  "detail": "...",
  "errors": { "field": ["msg"] }
}
"""
from __future__ import annotations

from typing import Any

from django.core.exceptions import PermissionDenied, ValidationError as DjangoValidationError
from django.http import Http404
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import exception_handler


ERROR_BASE_URI = "https://lahorefashion.com/errors"

STATUS_TITLES = {
    400: "Bad Request",
    401: "Unauthorized",
    403: "Forbidden",
    404: "Not Found",
    409: "Conflict",
    422: "Validation Error",
    429: "Too Many Requests",
    500: "Internal Server Error",
}


class DomainError(Exception):
    """Base class for all domain/business logic errors."""

    def __init__(self, message: str, code: str = "domain_error", status_code: int = 400) -> None:
        super().__init__(message)
        self.message = message
        self.code = code
        self.status_code = status_code


class PermissionError(DomainError):
    def __init__(self, message: str = "You do not have permission to perform this action.") -> None:
        super().__init__(message, code="permission_denied", status_code=403)


class NotFoundError(DomainError):
    def __init__(self, message: str = "Resource not found.") -> None:
        super().__init__(message, code="not_found", status_code=404)


class ConflictError(DomainError):
    def __init__(self, message: str) -> None:
        super().__init__(message, code="conflict", status_code=409)


class ValidationError(DomainError):
    def __init__(self, message: str, errors: dict[str, Any] | None = None) -> None:
        super().__init__(message, code="validation_error", status_code=422)
        self.errors = errors or {}


def rfc7807_exception_handler(exc: Exception, context: dict[str, Any]) -> Response | None:
    """
    Custom DRF exception handler that returns RFC 7807 Problem Details JSON.
    """
    # Handle domain errors first
    if isinstance(exc, DomainError):
        status_code = exc.status_code
        data: dict[str, Any] = {
            "type": f"{ERROR_BASE_URI}/{exc.code}",
            "title": STATUS_TITLES.get(status_code, "Error"),
            "status": status_code,
            "detail": exc.message,
        }
        if isinstance(exc, ValidationError) and exc.errors:
            data["errors"] = exc.errors
        return Response(data, status=status_code)

    # Map Django core exceptions to DRF
    if isinstance(exc, Http404):
        exc = exception_handler(exc, context)
        if exc is not None:
            return _wrap_drf_response(exc, 404)
        return None

    if isinstance(exc, PermissionDenied):
        exc = exception_handler(exc, context)
        if exc is not None:
            return _wrap_drf_response(exc, 403)
        return None

    if isinstance(exc, DjangoValidationError):
        data = {
            "type": f"{ERROR_BASE_URI}/validation_error",
            "title": "Validation Error",
            "status": 422,
            "detail": str(exc),
            "errors": exc.message_dict if hasattr(exc, "message_dict") else {},
        }
        return Response(data, status=status.HTTP_422_UNPROCESSABLE_ENTITY)

    # Let DRF handle everything else
    response = exception_handler(exc, context)
    if response is not None:
        return _wrap_drf_response(response, response.status_code)

    return None


def _wrap_drf_response(response: Response, status_code: int) -> Response:
    """Wrap existing DRF response in RFC 7807 format."""
    original_data = response.data
    detail = ""
    errors: dict[str, Any] = {}

    if isinstance(original_data, dict):
        detail = str(original_data.get("detail", ""))
        errors = {k: v for k, v in original_data.items() if k != "detail"}
    elif isinstance(original_data, list):
        detail = "; ".join(str(i) for i in original_data)
    else:
        detail = str(original_data)

    data: dict[str, Any] = {
        "type": f"{ERROR_BASE_URI}/{STATUS_TITLES.get(status_code, 'error').lower().replace(' ', '_')}",
        "title": STATUS_TITLES.get(status_code, "Error"),
        "status": status_code,
        "detail": detail,
    }
    if errors:
        data["errors"] = errors

    response.data = data
    return response
