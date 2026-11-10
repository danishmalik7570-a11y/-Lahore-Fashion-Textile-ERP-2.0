from django.db import migrations
import uuid

def create_single_default_unit(apps, schema_editor):
    Branch = apps.get_model("branches", "Branch")
    BranchUser = apps.get_model("branches", "BranchUser")
    User = apps.get_model("accounts", "User")

    # 1. Look for existing head office or LHR branch
    default_branch = Branch.objects.filter(is_head_office=True).first()
    if not default_branch:
        default_branch = Branch.objects.filter(code="LHR").first()

    if default_branch:
        default_branch.name = "Lahore Fashion Mill"
        default_branch.code = "LHR"
        default_branch.city = "Lahore"
        default_branch.is_head_office = True
        default_branch.is_active = True
        default_branch.save()
    else:
        default_branch = Branch.objects.create(
            id=uuid.uuid4(),
            code="LHR",
            name="Lahore Fashion Mill",
            city="Lahore",
            is_head_office=True,
            is_active=True,
            address="24-B Industrial Area, Gulberg III, Lahore",
            phone="+92-42-35761234",
            email="info@lahorefashion.com",
        )

    # 2. Deactivate any other branches so only the single unit remains active
    Branch.objects.exclude(id=default_branch.id).update(is_active=False)

    # 3. Ensure all users are assigned to the default single branch
    for user in User.objects.all():
        BranchUser.objects.update_or_create(
            user=user,
            branch=default_branch,
            defaults={"is_default": True},
        )

def reverse_single_unit(apps, schema_editor):
    pass

class Migration(migrations.Migration):
    dependencies = [
        ("branches", "0001_initial"),
        ("accounts", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(create_single_default_unit, reverse_single_unit),
    ]
