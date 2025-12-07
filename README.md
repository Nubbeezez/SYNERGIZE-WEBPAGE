# Synergize - CS2 Community Platform

A modern, full-stack gaming community platform for Counter-Strike 2 servers featuring server listings, leaderboards, ban management, shop system, and admin panel.

## Tech Stack

- **Frontend**: Next.js 14 (App Router) + TypeScript + TailwindCSS
- **Backend**: Laravel 11 + PHP 8.2+
- **Database**: PostgreSQL / MySQL
- **Cache**: Redis (optional)
- **Auth**: Steam OpenID + Laravel Sanctum

## Quick Links

- [Pelican Panel Deployment Guide](docs/PELICAN_DEPLOYMENT.md)
- [Architecture Overview](docs/ARCHITECTURE.md)
- [API Documentation](docs/API.md)
- [Contributing Guide](docs/CONTRIBUTING.md)

---

## Deployment on Pelican Panel

### Prerequisites

1. Pelican Panel with access to create new eggs
2. PostgreSQL or MySQL database (external or panel-managed)
3. Steam Web API Key ([Get one here](https://steamcommunity.com/dev/apikey))
4. A domain name (optional but recommended)

### Available Eggs

Synergize provides **three Pelican eggs** for flexible deployment options:

| Egg File | Description | Use Case |
|----------|-------------|----------|
| `egg-synergize.json` | **Combined** - Full stack (Frontend + Backend) | Simple single-server deployment |
| `egg-synergize-simple.json` | **Frontend Only** - Next.js | Separate deployment (recommended for production) |
| `egg-synergize-backend.json` | **Backend Only** - Laravel API | Separate deployment (recommended for production) |

### Deployment Options

#### Option A: Single Server (Combined Egg)

Best for: Development, testing, or low-traffic deployments.

1. Import `egg-synergize.json`
2. Create one server with both frontend (port 3000) and backend (port 8000)
3. Both services run in the same container

#### Option B: Two Servers (Recommended for Production)

Best for: Production deployments with better resource management and scaling.

1. **Import both eggs:**
   - `egg-synergize-backend.json` → Creates "Synergize Backend (Laravel)"
   - `egg-synergize-simple.json` → Creates "Synergize Frontend (Next.js)"

2. **Create Backend Server:**
   - Use "Synergize Backend (Laravel)" egg
   - Allocate port 8000 (or your preferred API port)
   - Configure database and Steam API credentials

3. **Create Frontend Server:**
   - Use "Synergize Frontend (Next.js)" egg
   - Allocate port 3000 (or your preferred web port)
   - Set `NEXT_PUBLIC_API_URL` to your backend URL (e.g., `https://api.yoursite.com`)

### Quick Start (Combined Egg)

1. **Import the Egg**
   - Download `egg-synergize.json` from the `pelican/` folder
   - In Pelican Panel: Admin → Eggs → Import Egg
   - Upload the JSON file

2. **Create a Server**
   - Create new server using the "Synergize Platform" egg
   - Configure the variables (see below)
   - Allocate ports (default: 3000 for web, 8000 for API)

3. **Configure Environment Variables**

   | Variable | Description | Example |
   |----------|-------------|---------|
   | `APP_URL` | Your domain/IP | `https://synergize.example.com` |
   | `DB_HOST` | PostgreSQL/MySQL host | `postgres.example.com` |
   | `DB_PORT` | Database port | `5432` (PostgreSQL) or `3306` (MySQL) |
   | `DB_DATABASE` | Database name | `synergize` |
   | `DB_USERNAME` | Database user | `synergize_user` |
   | `DB_PASSWORD` | Database password | `secure_password` |
   | `STEAM_API_KEY` | Steam Web API key | `XXXXXXXXXXXXXXXX` |

4. **Start the Server**
   - The egg will automatically download the latest release
   - Run database migrations
   - Start both frontend and backend services

See [Full Deployment Guide](docs/PELICAN_DEPLOYMENT.md) for detailed instructions.

---

## Features

### Public Features
- **Server Browser**: Live CS2 server list with player counts, maps, and quick connect
- **Leaderboards**: Player rankings by kills, wins, playtime (daily/weekly/monthly/all-time)
- **Ban List**: Public ban records with search functionality
- **Shop**: Credit-based shop for perks and items

### Admin Features
- **Dashboard**: Server health, player stats, recent activity
- **Ban Management**: Create, edit, remove bans with full audit trail
- **Admin Assignment**: Assign admin roles by SteamID with scope control
- **Server Control**: Push configurations to game servers
- **Audit Logs**: Complete history of all admin actions

### Authentication & Authorization
- Steam OpenID login (no passwords to manage)
- Role-based access control with hierarchy:
  - **Owner** (100): Full access to everything
  - **Manager** (30): Almost full access, user management
  - **Head Admin** (20): Leads admin teams
  - **Admin/Senior Admin** (10): Ban management, shop viewing
  - **VIP** (1): Premium perks
  - **User** (0): Basic access
- Session management with secure encrypted cookies
- 7-day token expiration with auto-renewal

---

## Security Features

The platform implements comprehensive security measures:

### Backend Security
- **Rate Limiting**: Tiered limits for API (60/min), admin (30/min), auth (5/min), and sensitive operations (10/min)
- **SQL Injection Prevention**: Parameterized queries and LIKE wildcard escaping
- **CORS Protection**: Restricted origins, methods, and headers
- **Security Headers**: X-Frame-Options, X-Content-Type-Options, CSP, HSTS
- **Session Security**: Encrypted sessions, secure cookies, strict SameSite policy
- **Input Validation**: Form Request classes with type validation
- **Atomic Transactions**: Race condition prevention for purchases and bans
- **IP Validation**: Server IPs validated and private ranges blocked
- **Audit Logging**: All admin actions logged with IP and user agent

### Frontend Security
- **Route Protection**: Middleware for protected routes
- **Security Headers**: Applied to all responses
- **Role-based UI**: Components hidden based on permission level

---

## Project Structure

```
synergize/
├── frontend/                 # Next.js application
│   ├── app/                  # App router pages
│   │   └── admin/           # Admin panel pages
│   ├── components/           # React components
│   │   └── ui/              # Reusable UI components (Modal, Button, Input, etc.)
│   ├── lib/                  # Utilities, API client, auth context
│   ├── middleware.ts         # Route protection & security headers
│   └── public/              # Static assets
│
├── backend/                  # Laravel API
│   ├── app/
│   │   ├── Http/
│   │   │   ├── Controllers/  # API controllers (public & admin)
│   │   │   ├── Middleware/   # Auth, rate limiting, security headers
│   │   │   └── Requests/     # Form request validation classes
│   │   ├── Models/          # Eloquent models
│   │   └── Services/        # Business logic (Steam auth, etc.)
│   ├── config/              # App configuration
│   ├── database/migrations/ # Database schema
│   └── routes/api.php       # API routes with middleware
│
├── docs/                     # Documentation
│   ├── PELICAN_DEPLOYMENT.md
│   ├── ARCHITECTURE.md
│   ├── API.md
│   └── CONTRIBUTING.md
│
└── scripts/                  # Build and deployment scripts
```

---

## Development Setup

### Requirements

- Node.js 18+
- PHP 8.2+
- Composer
- PostgreSQL 14+

### Local Development

```bash
# Clone the repository
git clone https://github.com/yourusername/synergize.git
cd synergize

# Backend setup
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve

# Frontend setup (new terminal)
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:3000`
Backend API runs on `http://localhost:8000`

---

## Configuration

### Environment Variables

#### Backend (.env)

```env
APP_NAME=Synergize
APP_ENV=production
APP_KEY=base64:generated_key_here
APP_DEBUG=false
APP_URL=https://your-domain.com

# Frontend URL for CORS
FRONTEND_URL=https://your-frontend-domain.com

# Database (PostgreSQL or MySQL)
DB_CONNECTION=pgsql
DB_HOST=your-db-host
DB_PORT=5432
DB_DATABASE=synergize
DB_USERNAME=your_user
DB_PASSWORD=your_password

# Steam Authentication
STEAM_API_KEY=your_steam_api_key
STEAM_CALLBACK_URL=https://your-domain.com/api/v1/auth/steam/callback

# Session & Security
SESSION_DRIVER=database
SESSION_ENCRYPT=true
SESSION_SECURE_COOKIE=true
SESSION_SAME_SITE=strict

# Token expiration (minutes) - default 7 days
SANCTUM_TOKEN_EXPIRATION=10080

# Cache & Queue
CACHE_DRIVER=file
QUEUE_CONNECTION=database

# Optional: Redis for better performance
REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379
```

#### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=https://your-domain.com
NEXT_PUBLIC_APP_NAME=Synergize
```

---

## API Overview

Base URL: `/api/v1`

### Public Endpoints
- `GET /servers` - List all game servers
- `GET /servers/:id` - Get server details
- `GET /leaderboards` - Get leaderboard data
- `GET /bans` - Search ban records
- `GET /shop/items` - List shop items

### Auth Endpoints
- `GET /auth/steam/init` - Start Steam login
- `GET /auth/steam/callback` - Steam callback
- `GET /users/me` - Current user profile

### Admin Endpoints (requires auth + role)

#### Ban Management (Admin+)
- `GET /admin/bans` - List all bans
- `POST /admin/bans` - Create ban (rate limited)
- `DELETE /admin/bans/:id` - Remove ban (rate limited)

#### User Management (Manager+)
- `GET /admin/users` - List users with pagination
- `GET /admin/users/:id` - Get user details
- `PUT /admin/users/:id/roles` - Update user roles (rate limited)
- `GET /admin/users/search/:query` - Search users (rate limited)

#### Server Management (Owner only)
- `GET /admin/servers` - List servers with RCON status
- `POST /admin/servers` - Create server
- `PUT /admin/servers/:id` - Update server
- `DELETE /admin/servers/:id` - Delete server

#### Shop Management (Owner only for modifications)
- `GET /admin/shop` - List all items
- `POST /admin/shop` - Create item
- `PUT /admin/shop/:id` - Update item
- `DELETE /admin/shop/:id` - Delete item

#### Settings (Owner only)
- `GET /admin/settings` - Get all settings
- `PUT /admin/settings` - Update single setting
- `PUT /admin/settings/batch` - Update multiple settings

#### Audit Logs (Admin+)
- `GET /admin/logs` - View audit logs with filters

See [API Documentation](docs/API.md) for full details.

---

## UI Components

The frontend includes a library of reusable UI components in `frontend/components/ui/`:

| Component | Description |
|-----------|-------------|
| `Modal` | Accessible modal dialog with backdrop |
| `ConfirmDialog` | Confirmation dialog with danger/warning variants |
| `Button` | Button with variants (primary, secondary, outline, ghost, danger) |
| `Input` | Form input with label, error, and helper text |
| `Select` | Dropdown select with custom styling |
| `Badge` | Status badges (success, warning, error, info) |
| `Spinner` | Loading spinner in multiple sizes |
| `Alert` | Alert messages with dismiss functionality |

Usage example:
```tsx
import { Button, Modal, Input } from '@/components/ui'

<Button variant="primary" isLoading={loading}>
  Save Changes
</Button>
```

---

## Contributing

We welcome contributions! Please see our [Contributing Guide](docs/CONTRIBUTING.md) for details.

### Quick Start for Contributors

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Support

- **Issues**: [GitHub Issues](../../issues)
- **Discord**: [Join our Discord](#) (coming soon)

---

## Acknowledgments

- [Pelican Panel](https://pelican.dev/) - Game server management
- [Steam Web API](https://steamcommunity.com/dev) - Authentication
- [Dembrandt Design System](https://dembrandt.com) - UI/UX inspiration
