<div align="center">

# 🎮 PlayAtac - Gaming Subscription Platform

### *Your Ultimate Gaming Subscription Experience*

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![React](https://img.shields.io/badge/react-18.x-61dafb.svg)](https://reactjs.org/)
[![Django](https://img.shields.io/badge/django-5.x-green.svg)](https://www.djangoproject.com/)

</div>

---

## 📖 About

**PlayAtac** is a cutting-edge full-stack gaming subscription platform engineered with a modern microservices-inspired architecture. Combining powerful technologies, it delivers a seamless user experience with robust backend capabilities.

### 🌟 Key Highlights

- **React Frontend** - Modern, responsive UI/UX
- **Django REST Backend** - Scalable API architecture
- **Supabase Integration** - Real-time auth & database management
- **Stripe Payments** - Secure payment processing
- **AI-Powered Analytics** - Machine Learning for profit prediction

---

## 📋 Table of Contents

- [Features](#-features)
- [Technology Stack](#-technology-stack)
- [System Architecture](#-system-architecture)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation & Setup](#installation--setup)
  - [Environment Variables](#environment-variables)
- [Machine Learning & Analytics](#-machine-learning--analytics)
- [API Reference](#-api-reference)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Features

### 🔐 User Authentication
- Secure login/signup flows using Supabase Auth (JWT)
- Session-based security with token validation

### 💳 Subscription Management
- Tiered plans: **Free**, **Pro**, and **Premium**
- Seamless upgrade/downgrade capabilities
- Secure Stripe integration for subscriptions and one-time payments

### 📊 Interactive Dashboards

**User Dashboard**
- View active subscription plans
- Access payment history
- Manage profile settings

**Admin Dashboard**
- Comprehensive business metrics
- Revenue tracking and visualization
- Active user statistics
- Infrastructure cost monitoring

### 🤖 Advanced Analytics
- Real-time revenue tracking and visualization (Matplotlib)
- **AI-Powered Profit Prediction**: Random Forest/Gradient Boosting models
- PDF Report Generation for business intelligence
- Session Tracking: Login/logout times, duration, IP tracking

### 🐳 Containerized Deployment
- Fully dockerized application
- Consistent development and deployment environment---

## 🛠 Technology Stack

### Frontend
| Technology | Version | Purpose |
|-----------|---------|---------|
| **React** | 18.x | UI Framework |
| **React Router** | 6.x | Client-side routing |
| **Supabase JS** | Latest | Authentication & real-time data |
| **CSS Modules** | - | Component styling |

### Backend
| Technology | Version | Purpose |
|-----------|---------|---------|
| **Django** | 5.x | Web framework |
| **Django REST Framework** | Latest | RESTful API |
| **PostgreSQL** | Latest | Database (via Supabase) |
| **Scikit-learn** | Latest | Machine Learning |
| **Pandas & NumPy** | Latest | Data processing |
| **Matplotlib** | Latest | Data visualization |
| **ReportLab** | Latest | PDF generation |
| **Stripe SDK** | Latest | Payment processing |

### Infrastructure
- 🐳 **Docker & Docker Compose** - Containerization
- 🗄️ **Supabase** - Auth, Database, Real-time subscriptions
- 💳 **Stripe** - Payment gateway---

## 🏗 System Architecture

The application follows a **decoupled microservices-inspired architecture** where the React frontend communicates with the Django backend via REST APIs, while authentication states are managed directly with Supabase.

```mermaid
graph TD
    Client[React Client] -->|Auth & JWT| Supabase[Supabase Auth]
    Client -->|HTTP Requests + JWT| Django[Django Backend]
    Django -->|Validate Token| Supabase
    Django -->|Query/Update| DB[(PostgreSQL DB)]
    Django -->|Payment Intents| Stripe[Stripe API]
    Django -->|ML Models| Scikit[Scikit-Learn]
```

### Architecture Components

- **React Client**: User interface and state management
- **Supabase Auth**: JWT-based authentication and user management
- **Django Backend**: Business logic, API endpoints, and ML processing
- **PostgreSQL**: Persistent data storage
- **Stripe API**: Secure payment processing
- **Scikit-Learn**: ML models for analytics and predictions
---

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed and configured:

- ✅ **Docker & Docker Compose** - Container orchestration
- ✅ **Node.js 16+** - For local frontend development (optional)
- ✅ **Python 3.11+** - For local backend development (optional)
- ✅ **Supabase Account** - Project URL & API Keys
- ✅ **Stripe Account** - Publishable & Secret Keys

---

### Installation & Setup

#### 1️⃣ Clone the Repository

```bash
git clone https://github.com/abelc27/playattack.git
cd playattack
```

#### 2️⃣ Configure Environment Variables

Create `.env` files for both backend and frontend.

**Backend** (`backend/.env`):

```env
SUPABASE_DB_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres
SUPABASE_URL=https://[PROJECT].supabase.co
SUPABASE_KEY=[YOUR_SERVICE_ROLE_KEY]
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
```

**Frontend** (`frontend/exemplu/.env`):

```env
REACT_APP_SUPABASE_URL=https://[PROJECT].supabase.co
REACT_APP_SUPABASE_ANON_KEY=[YOUR_ANON_KEY]
REACT_APP_DJANGO_URL=http://localhost:8000
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

#### 3️⃣ Build and Run with Docker

```bash
docker-compose up --build
```

**Services will be available at:**
- 🌐 Frontend: http://localhost:3000
- 🔌 Backend API: http://localhost:8000

#### 4️⃣ Initialize Database

Open a new terminal and run migrations:

```bash
docker exec -it <backend_container_name> python manage.py migrate
```

#### 5️⃣ Create Admin User

```bash
docker exec -it <backend_container_name> python manage.py createsuperuser
```
---

## 🤖 Machine Learning & Analytics

PlayAtac includes a sophisticated ML pipeline that predicts future profits based on historical business data.

### Training the Model

Run the dedicated management command to train the profit prediction model:

```bash
docker exec -it <backend_container_name> python manage.py train_profit_model --days-ahead 30
```

### Prediction Features

The ML model uses the following features for accurate forecasting:

| Feature Category | Details |
|-----------------|---------|
| **Revenue Metrics** | Lagged revenue & profit |
| **Trend Analysis** | Rolling averages (7, 14, 30 days) |
| **User Engagement** | Session duration & activity patterns |
| **Temporal Features** | Day of week, month, seasonality |

### Accessing Predictions

The **Admin Dashboard** consumes the `/api/profit-prediction/` endpoint to visualize AI-powered forecasts with interactive charts and insights.

### Models Used
- 🌲 **Random Forest Regressor** - Ensemble learning
- 📈 **Gradient Boosting** - Advanced prediction accuracy---

## 📡 API Reference

### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/plans/` | List all subscription plans |
| `GET` | `/api/stripe-config/` | Retrieve Stripe public key |
| `GET` | `/charts/user-activity/` | Generate user activity chart (PNG) |

### Authenticated User Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/user-subscription/` | Get current subscription status | ✅ JWT |
| `POST` | `/api/create-payment-intent/` | Initialize Stripe payment | ✅ JWT |
| `POST` | `/api/confirm-payment/` | Finalize payment & activate plan | ✅ JWT |
| `POST` | `/api/session-tracking/` | Log user login/logout events | ✅ JWT |

### Admin Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/users/` | User management | ✅ Admin |
| `GET` | `/api/analytics/revenue/` | Financial analytics overview | ✅ Admin |
| `GET` | `/api/hosting-costs/` | Infrastructure cost tracking | ✅ Admin |
| `GET` | `/api/generate-pdf-report/` | Download business report (PDF) | ✅ Admin |
| `GET` | `/api/profit-prediction/` | AI profit forecasting | ✅ Admin |---

## 🤝 Contributing

We welcome contributions from the community! Here's how you can help:

1. **Fork** the repository
2. **Create** your feature branch
   ```bash
   git checkout -b feature/AmazingFeature
   ```
3. **Commit** your changes
   ```bash
   git commit -m 'Add some AmazingFeature'
   ```
4. **Push** to the branch
   ```bash
   git push origin feature/AmazingFeature
   ```
5. **Open** a Pull Request

### Code of Conduct

Please note that this project is released with a Contributor Code of Conduct. By participating in this project you agree to abide by its terms.

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` file for more information.

---

<div align="center">

### 👥 Development Team

**Casian Jors & Team**

*Python Academy Final Project*

---

### 🌟 Star this repository if you find it helpful!

Made with ❤️ and ☕

</div>
