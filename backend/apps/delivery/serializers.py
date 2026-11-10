from rest_framework import serializers
from .models import DeliveryChallan

class DeliveryChallanSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeliveryChallan
        fields = "__all__"