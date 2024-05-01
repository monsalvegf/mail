from django.contrib import admin

from django.contrib.auth.admin import UserAdmin
from .models import User, Email

# Register your models here.

# Registro del modelo User personalizado
admin.site.register(User, UserAdmin)

# Clase personalizada para el modelo Email
class EmailAdmin(admin.ModelAdmin):
    list_display = ('subject', 'sender', 'timestamp', 'read', 'archived')  # Mostrar estos campos en la lista
    list_filter = ('archived', 'read', 'timestamp')  # Filtrar por estos campos
    search_fields = ('subject', 'body', 'sender__username', 'recipients__username')  # Buscar por estos campos
    raw_id_fields = ('sender', 'user')  # Mejorar la interfaz para campos con muchos registros
    filter_horizontal = ('recipients',)  # Mejorar la selección de muchos-a-muchos

# Registrando el modelo Email con la clase personalizada
admin.site.register(Email, EmailAdmin)