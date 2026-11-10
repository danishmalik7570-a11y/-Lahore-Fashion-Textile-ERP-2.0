"""
Template Linter Service.
Checks schema dimensions, page bounds, and Jinja syntax before publishing.
"""
from typing import Dict, Any, List


class TemplateLinterService:
    @classmethod
    def lint_template(cls, schema: Dict[str, Any], page_w_mm: float = 210.0, page_h_mm: float = 297.0) -> List[Dict[str, str]]:
        """
        Runs quality and bounds checks on a template schema.
        Returns a list of warnings or errors.
        """
        issues = []
        elements = schema.get("elements", [])

        for el in elements:
            el_id = el.get("id", "element")
            x = float(el.get("x", 0))
            y = float(el.get("y", 0))
            w = float(el.get("width", 50))
            h = float(el.get("height", 20))

            # Bounds check
            if x + w > page_w_mm:
                issues.append({
                    "severity": "ERROR",
                    "element_id": el_id,
                    "message": f"Element exceeds right page boundary ({x + w:.1f}mm > {page_w_mm}mm)."
                })

            if page_h_mm and y + h > page_h_mm:
                issues.append({
                    "severity": "WARNING",
                    "element_id": el_id,
                    "message": f"Element exceeds single-page height ({y + h:.1f}mm > {page_h_mm}mm). May cause page break."
                })

            # Check Jinja expression
            content = str(el.get("content", ""))
            if "{{" in content and "}}" not in content:
                issues.append({
                    "severity": "ERROR",
                    "element_id": el_id,
                    "message": f"Unclosed Jinja variable expression in content: '{content}'."
                })

        return issues
