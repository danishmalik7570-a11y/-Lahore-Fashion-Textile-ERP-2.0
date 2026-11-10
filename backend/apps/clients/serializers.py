from rest_framework import serializers
from .models import Client, ClientContact

class ClientContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClientContact
        fields = "__all__"

class ClientSerializer(serializers.ModelSerializer):
    contacts = ClientContactSerializer(many=True, read_only=True)
    class Meta:
        model = Client
        fields = "__all__"