import uuid # 👈 Import nou pentru UUID
from django.db import models
# Am schimbat AbstractUser cu AbstractBaseUser și PermissionsMixin
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager 
from django.utils import timezone # 👈 Import nou pentru date
from django.utils.translation import gettext_lazy as _

# ======================================================================
# Custom User Manager (necesar pentru AbstractBaseUser)
# ======================================================================
class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError(_('The Email must be set'))
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password) # Hash parola, chiar daca Supabase face auth
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        extra_fields.setdefault('role', 'admin') # Rolul "admin" pentru superuser

        if extra_fields.get('is_staff') is not True:
            raise ValueError(_('Superuser must have is_staff=True.'))
        if extra_fields.get('is_superuser') is not True:
            raise ValueError(_('Superuser must have is_superuser=True.'))
        return self.create_user(email, password, **extra_fields)


# ======================
# 1. USER (Admin + User) - MODIFICAT
# ======================
class User(AbstractBaseUser, PermissionsMixin): 
    # Am schimbat id-ul default la UUID pentru a corespunde cu Supabase UID
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False) 
    email = models.EmailField(_('email address'), unique=True)
    username = models.CharField(max_length=150, unique=True, null=True, blank=True) # Poate stoca UID-ul de la Supabase ca text sau alt ID

    ROLE_CHOICES = (
        ("user", "User"),
        ("admin", "Admin"),
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default="user")

    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    date_joined = models.DateTimeField(default=timezone.now)

    objects = CustomUserManager() # 👈 Folosim managerul nostru custom

    USERNAME_FIELD = 'email' # 👈 Login se face cu email
    REQUIRED_FIELDS = [] # 👈 Nu mai cerem alte câmpuri obligatorii la creare

    def __str__(self):
        return f"{self.email} ({self.role})"


# ======================
# 2. PLANURI
# ======================
class Plan(models.Model):
    name = models.CharField(max_length=50, unique=True)   # Free, Pro, Enterprise
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0)  # ex. 9.99
    currency = models.CharField(max_length=5, default="EUR")  # EUR/USD
    features = models.TextField(blank=True)  # listă de features (JSON/text)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.price}{self.currency})"


# ======================
# 3. SUBSCRIPTIONS
# ======================
class Subscription(models.Model):
    STATUS_CHOICES = (
        ("active", "Active"),
        ("canceled", "Canceled"),
        ("trial", "Trial"),
    )
    # FK catre noul nostru User model
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="subscriptions")
    plan = models.ForeignKey(Plan, on_delete=models.CASCADE, related_name="subscriptions")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="active")
    start_date = models.DateTimeField(auto_now_add=True)
    renewal_date = models.DateTimeField(null=True, blank=True)  # când trebuie plătit din nou
    end_date = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.user.email} - {self.plan.name} ({self.status})"


# ======================
# 4. PAYMENTS (facturi)
# ======================
class Payment(models.Model):
    STATUS_CHOICES = (
        ("paid", "Paid"),
        ("pending", "Pending"),
        ("failed", "Failed"),
    )
    # FK catre noul nostru User model
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="payments")
    plan = models.ForeignKey(Plan, on_delete=models.CASCADE, related_name="payments")
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=5, default="EUR")
    payment_date = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="paid")
    transaction_id = models.CharField(max_length=100, blank=True)  # primit de la Stripe/alt procesator

    def __str__(self):
        return f"{self.user.email} - {self.amount}{self.currency} ({self.status})"


# ======================
# 5. COSTS (Admin only) - Enhanced for plan-specific costs
# ======================
class Cost(models.Model):
    description = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=5, default="EUR")
    date = models.DateTimeField(auto_now_add=True)
    category = models.CharField(max_length=50, blank=True)  # hosting, database, cdn, docker, supabase, etc.
    plan = models.ForeignKey(Plan, on_delete=models.CASCADE, related_name="costs", null=True, blank=True)  # Optional: cost specific to a plan

    def __str__(self):
        plan_name = f" ({self.plan.name})" if self.plan else ""
        return f"{self.description}{plan_name} - {self.amount}{self.currency}"


# ======================
# 6. USER ACTIVITY TRACKING
# ======================
class UserSession(models.Model):
    """Track user login sessions and time spent online"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="sessions")
    login_time = models.DateTimeField()  # Removed auto_now_add to allow manual date setting
    logout_time = models.DateTimeField(null=True, blank=True)
    duration_minutes = models.IntegerField(default=0) 
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    
    class Meta:
        ordering = ['-login_time']
    
    def __str__(self):
        return f"{self.user.email} - {self.duration_minutes}min on {self.login_time.date()}"
    
    def calculate_duration(self):
        """Calculate session duration"""
        if self.logout_time:
            delta = self.logout_time - self.login_time
            self.duration_minutes = int(delta.total_seconds() / 60)
            self.save()
        return self.duration_minutes
    
# ======================
# 7. GAMES
# ======================
class Game(models.Model):
    name = models.CharField(max_length=100, unique=True)
    display_name = models.CharField(max_length=150, blank=True)
    image_url = models.URLField(max_length=500)
    description = models.TextField(blank=True, null=True)
    genre = models.CharField(max_length=50, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    added_date = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.display_name or self.name

# ======================
# 8. FRIENDS
# ======================
class Friendship(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
    )
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='friendships_sent')
    friend = models.ForeignKey(User, on_delete=models.CASCADE, related_name='friendships_received')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'friend')
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.user.email} -> {self.friend.email} ({self.status})'
    
    def accept(self):
        self.status = 'accepted'
        self.save()

        Friendship.objects.get_or_create(
            user=self.friend,
            friend=self.user,
            defaults={'status': 'accepted'}
        )
    
    @classmethod
    def are_friends(cls, user1, user2):
        return cls.objects.filter(
            user=user1,
            friend=user2,
            status='accepted'
        ).exists()
    
    @classmethod
    def get_friends(cls, user):
        return User.objects.filter(
            friendships_received__user=user,
            friendships_received__status='accepted'
        ).distinct()
    
    @classmethod
    def get_pending_requests(cls, user):
        return cls.objects.filter(
            friend=user,
            status='pending'
        ).select_related('user')