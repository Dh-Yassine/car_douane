from django.core.management.base import BaseCommand
from django.contrib.auth.models import User

class Command(BaseCommand):
    help = 'Create a superuser for the admin panel'

    def handle(self, *args, **options):
        # Check if superuser already exists
        if User.objects.filter(is_superuser=True).exists():
            self.stdout.write(
                self.style.WARNING('Superuser already exists!')
            )
            return

        # Create superuser
        username = 'admin'
        email = 'admin@cardouane.tn'
        password = 'admin123456'

        try:
            user = User.objects.create_superuser(
                username=username,
                email=email,
                password=password
            )
            self.stdout.write(
                self.style.SUCCESS(
                    f'✅ Superuser created successfully!\n'
                    f'Username: {username}\n'
                    f'Email: {email}\n'
                    f'Password: {password}\n\n'
                    f'🔗 Access admin panel at: https://car-douane.onrender.com/admin/'
                )
            )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'❌ Error creating superuser: {e}')
            )
