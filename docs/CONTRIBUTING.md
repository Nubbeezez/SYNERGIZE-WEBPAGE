# Contributing to Synergize

Thank you for your interest in contributing to Synergize! This document provides guidelines and instructions for contributing.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Documentation](#documentation)

---

## Code of Conduct

By participating in this project, you agree to:

- Be respectful and inclusive
- Accept constructive criticism gracefully
- Focus on what is best for the community
- Show empathy towards other contributors

---

## Getting Started

### Prerequisites

- Node.js 18+ ([Download](https://nodejs.org/))
- PHP 8.2+ ([Download](https://www.php.net/))
- Composer ([Download](https://getcomposer.org/))
- PostgreSQL 14+ ([Download](https://www.postgresql.org/))
- Git ([Download](https://git-scm.com/))

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/synergize.git
   cd synergize
   ```
3. Add upstream remote:
   ```bash
   git remote add upstream https://github.com/ORIGINAL_OWNER/synergize.git
   ```

---

## Development Setup

### Backend (Laravel)

```bash
cd backend

# Install dependencies
composer install

# Copy environment file
cp .env.example .env

# Generate application key
php artisan key:generate

# Configure database in .env
# DB_CONNECTION=pgsql
# DB_HOST=127.0.0.1
# DB_PORT=5432
# DB_DATABASE=synergize_dev
# DB_USERNAME=your_user
# DB_PASSWORD=your_password

# Run migrations
php artisan migrate

# Seed development data (optional)
php artisan db:seed

# Start development server
php artisan serve
```

### Frontend (Next.js)

```bash
cd frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local

# Configure API URL in .env.local
# NEXT_PUBLIC_API_URL=http://localhost:8000

# Start development server
npm run dev
```

### Verify Setup

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Test API: `curl http://localhost:8000/api/v1/servers`

---

## Making Changes

### Branch Naming

Use descriptive branch names:

```
feature/add-leaderboard-filter
fix/steam-login-redirect
docs/update-api-documentation
refactor/optimize-server-polling
```

### Workflow

1. **Sync with upstream:**
   ```bash
   git fetch upstream
   git checkout main
   git merge upstream/main
   ```

2. **Create a branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make changes and commit:**
   ```bash
   git add .
   git commit -m "feat: add leaderboard filtering by server"
   ```

4. **Push to your fork:**
   ```bash
   git push origin feature/your-feature-name
   ```

5. **Open a Pull Request**

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(api): add endpoint for player statistics
fix(auth): resolve Steam callback redirect issue
docs(readme): update installation instructions
refactor(frontend): extract ServerCard component
test(api): add tests for ban creation endpoint
```

---

## Pull Request Process

### Before Submitting

- [ ] Code follows the project's coding standards
- [ ] All tests pass locally
- [ ] New code is covered by tests (when applicable)
- [ ] Documentation is updated (when applicable)
- [ ] Commit messages follow conventions
- [ ] Branch is up-to-date with `main`

### PR Template

When creating a PR, include:

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## How Has This Been Tested?
Describe testing performed

## Checklist
- [ ] My code follows the style guidelines
- [ ] I have performed a self-review
- [ ] I have added tests that prove my fix/feature works
- [ ] New and existing tests pass locally
- [ ] I have updated documentation accordingly
```

### Review Process

1. A maintainer will review your PR
2. Address any requested changes
3. Once approved, a maintainer will merge your PR

---

## Coding Standards

### PHP (Laravel)

Follow [PSR-12](https://www.php-fig.org/psr/psr-12/) coding standard.

```php
<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\Server;
use Illuminate\Http\JsonResponse;

class ServerController extends Controller
{
    public function index(): JsonResponse
    {
        $servers = Server::query()
            ->where('status', 'online')
            ->orderBy('name')
            ->paginate(20);

        return response()->json([
            'data' => $servers->items(),
            'meta' => [
                'total' => $servers->total(),
                'page' => $servers->currentPage(),
            ],
        ]);
    }
}
```

**Guidelines:**
- Use type hints and return types
- Use meaningful variable names
- Keep methods focused and small
- Use Laravel conventions (Form Requests, Resources, etc.)

### TypeScript (Next.js)

```typescript
// Use interfaces for object types
interface Server {
  id: number;
  name: string;
  ip: string;
  port: number;
  status: 'online' | 'offline';
  players: number;
  maxPlayers: number;
}

// Use functional components with TypeScript
interface ServerCardProps {
  server: Server;
  onConnect?: (server: Server) => void;
}

export function ServerCard({ server, onConnect }: ServerCardProps) {
  return (
    <div className="rounded-lg bg-primary p-4">
      <h3 className="text-lg font-semibold">{server.name}</h3>
      <p className="text-muted">
        {server.players}/{server.maxPlayers} players
      </p>
      {onConnect && (
        <button
          onClick={() => onConnect(server)}
          className="mt-2 btn-primary"
        >
          Connect
        </button>
      )}
    </div>
  );
}
```

**Guidelines:**
- Use TypeScript strict mode
- Define interfaces for all data structures
- Use `const` by default, `let` when needed
- Prefer functional components
- Use meaningful component and variable names

### CSS (Tailwind)

- Use Tailwind utility classes
- Extract common patterns to components
- Use design system tokens from `tailwind.config.ts`
- Avoid custom CSS unless necessary

```tsx
// Good - uses design tokens
<button className="rounded-md bg-accent-pink px-4 py-2 text-white hover:bg-accent-pink/80">
  Click me
</button>

// Avoid - hardcoded values
<button style={{ backgroundColor: '#f70094', padding: '8px 16px' }}>
  Click me
</button>
```

---

## Testing

### Backend Tests (PHPUnit)

```bash
cd backend

# Run all tests
php artisan test

# Run specific test file
php artisan test tests/Feature/Api/ServerTest.php

# Run with coverage
php artisan test --coverage
```

**Writing tests:**

```php
<?php

namespace Tests\Feature\Api;

use Tests\TestCase;
use App\Models\Server;

class ServerTest extends TestCase
{
    public function test_can_list_servers(): void
    {
        Server::factory()->count(5)->create();

        $response = $this->getJson('/api/v1/servers');

        $response->assertOk()
            ->assertJsonCount(5, 'data')
            ->assertJsonStructure([
                'data' => [
                    '*' => ['id', 'name', 'ip', 'port', 'status'],
                ],
                'meta' => ['total', 'page'],
            ]);
    }
}
```

### Frontend Tests (Jest + Playwright)

```bash
cd frontend

# Run unit tests
npm test

# Run E2E tests
npm run test:e2e

# Run with coverage
npm test -- --coverage
```

**Writing tests:**

```typescript
// Unit test example
import { render, screen } from '@testing-library/react';
import { ServerCard } from '@/components/ServerCard';

describe('ServerCard', () => {
  const mockServer = {
    id: 1,
    name: 'Test Server',
    ip: '192.168.1.1',
    port: 27015,
    status: 'online' as const,
    players: 10,
    maxPlayers: 24,
  };

  it('renders server name', () => {
    render(<ServerCard server={mockServer} />);
    expect(screen.getByText('Test Server')).toBeInTheDocument();
  });

  it('displays player count', () => {
    render(<ServerCard server={mockServer} />);
    expect(screen.getByText('10/24 players')).toBeInTheDocument();
  });
});
```

---

## Documentation

### Code Documentation

**PHP:**
```php
/**
 * Create a new ban record.
 *
 * @param StoreBanRequest $request Validated ban request data
 * @return JsonResponse Created ban resource
 * @throws AuthorizationException If user lacks permission
 */
public function store(StoreBanRequest $request): JsonResponse
```

**TypeScript:**
```typescript
/**
 * Fetches server data from the API.
 *
 * @param id - The server ID to fetch
 * @returns Promise resolving to server data
 * @throws Error if server not found
 */
async function fetchServer(id: number): Promise<Server> {
```

### README Updates

When adding new features, update:
- Main `README.md` if it affects setup or usage
- `docs/API.md` for new endpoints
- `docs/ARCHITECTURE.md` for structural changes

---

## Questions?

- Open a [GitHub Issue](../../issues) for bugs or feature requests
- Start a [Discussion](../../discussions) for questions
- Check existing issues before creating new ones

Thank you for contributing!
