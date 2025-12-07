# Synergize - CS2 Community Platform

A modern, full-stack gaming community platform for Counter-Strike 2 servers featuring server listings, leaderboards, ban management, shop system, and admin panel.

## Tech Stack

- **Frontend**: Next.js 14 (App Router) + TypeScript + TailwindCSS
- **Backend**: Laravel 11 + PHP 8.2+
- **Database**: PostgreSQL
- **Auth**: Steam OpenID

## Quick Links

- [Pelican Panel Deployment Guide](docs/PELICAN_DEPLOYMENT.md)
- [Architecture Overview](docs/ARCHITECTURE.md)
- [API Documentation](docs/API.md)
- [Contributing Guide](docs/CONTRIBUTING.md)

---

## Deployment on Pelican Panel

### Prerequisites

1. Pelican Panel with access to create new eggs
2. PostgreSQL database (external or panel-managed)
3. Steam Web API Key ([Get one here](https://steamcommunity.com/dev/apikey))
4. A domain name (optional but recommended)

### Quick Start

1. **Import the Egg**
   - Download `egg-synergize.json` from the [releases page](../../releases)
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
   | `DB_HOST` | PostgreSQL host | `postgres.example.com` |
   | `DB_PORT` | PostgreSQL port | `5432` |
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

### Authentication
- Steam OpenID login (no passwords to manage)
- Role-based access control (Superadmin, Admin, Moderator, User)
- Session management with secure cookies

---

## Project Structure

```
synergize/
├── frontend/                 # Next.js application
│   ├── app/                  # App router pages
│   ├── components/           # React components
│   │   └── ui/              # Base UI components
│   ├── lib/                  # Utilities and API client
│   └── public/              # Static assets
│
├── backend/                  # Laravel API
│   ├── app/
│   │   ├── Http/Controllers/ # API controllers
│   │   ├── Models/          # Eloquent models
│   │   └── Services/        # Business logic
│   ├── database/migrations/ # Database schema
│   └── routes/              # API routes
│
├── pelican/                  # Pelican Panel files
│   └── egg-synergize.json   # Panel egg configuration
│
├── docs/                     # Documentation
│   ├── PELICAN_DEPLOYMENT.md
│   ├── ARCHITECTURE.md
│   ├── API.md
│   └── CONTRIBUTING.md
│
└── scripts/                  # Build and deployment scripts
    ├── build.sh
    └── start.sh
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

DB_CONNECTION=pgsql
DB_HOST=your-db-host
DB_PORT=5432
DB_DATABASE=synergize
DB_USERNAME=your_user
DB_PASSWORD=your_password

STEAM_API_KEY=your_steam_api_key
STEAM_CALLBACK_URL=https://your-domain.com/api/v1/auth/steam/callback

CACHE_DRIVER=file
QUEUE_CONNECTION=database
SESSION_DRIVER=database
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

### Admin Endpoints (requires auth)
- `POST /admin/bans` - Create ban
- `DELETE /admin/bans/:id` - Remove ban
- `POST /admin/assign-role` - Assign admin role
- `GET /admin/logs` - View audit logs

See [API Documentation](docs/API.md) for full details.

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
