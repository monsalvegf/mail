from django.contrib import admin

from django.contrib.auth.admin import UserAdmin
from .models import User, Email

# Register your models here.

# Registro del modelo User personalizado
admin.site.register(User, UserAdmin)

# Clase personalizada para el modelo Email
class EmailAdmin(admin.ModelAdmin):
    list_display = ('get_id', 'subject', 'sender', 'timestamp', 'read', 'archived')  # Mostrar estos campos en la lista
    list_filter = ('archived', 'read', 'timestamp')  # Filtrar por estos campos
    search_fields = ('subject', 'body', 'sender__username', 'recipients__username')  # Buscar por estos campos
    raw_id_fields = ('sender', 'user')  # Mejorar la interfaz para campos con muchos registros
    filter_horizontal = ('recipients',)  # Mejorar la selección de muchos-a-muchos

    def get_id(self, obj):
        return obj.id
    get_id.admin_order_field = 'id'  # Permite ordenar por este campo
    get_id.short_description = 'ID'  # Texto para la cabecera de la columna

# Registrando el modelo Email con la clase personalizada
admin.site.register(Email, EmailAdmin)

