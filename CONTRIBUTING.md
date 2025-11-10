# Contributing to Employee Attendance Service

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/employee-attendance-service.git`
3. Create a branch: `git checkout -b feature/your-feature-name`
4. Make your changes
5. Test your changes
6. Commit and push
7. Open a Pull Request

## Development Setup

### Prerequisites

- Node.js 20+
- Docker and docker-compose
- PostgreSQL (or use Docker)
- Redis (or use Docker)

### Local Development

1. Install dependencies:
```bash
npm install
```

2. Start PostgreSQL and Redis with docker-compose:
```bash
docker-compose -f docker-compose.dev.yml up -d
```

3. Copy environment file:
```bash
cp .env.example .env
```

4. Generate Prisma client:
```bash
npm run prisma:generate
```

5. Run migrations:
```bash
npm run prisma:migrate
```

6. Start development server:
```bash
npm run dev
```

The API will be available at http://localhost:3000

## Code Style

- Use TypeScript for all new code
- Follow existing code patterns and conventions
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions small and focused

## Testing

Before submitting a PR:

1. Build the project:
```bash
npm run build
```

2. Test API endpoints with Postman collection in `postman/collection.json`

3. Verify Docker build:
```bash
docker build -t employee-attendance-service .
```

## Commit Messages

Follow conventional commit format:

- `feat: add new feature`
- `fix: fix bug`
- `docs: update documentation`
- `style: format code`
- `refactor: refactor code`
- `test: add tests`
- `chore: update dependencies`

Examples:
```
feat: add employee department filtering
fix: handle null sign-off time in reports
docs: update API endpoint documentation
```

## Pull Request Process

1. Update documentation if needed
2. Ensure the build passes
3. Update README.md with details of API changes
4. Update QUICKSTART.md if setup process changes
5. Reference any related issues in the PR description
6. Wait for review and address feedback

## Adding New Features

### New API Endpoint

1. Create route file in `app/api/[feature]/[action]/route.ts`
2. Implement request handler (GET, POST, etc.)
3. Add authentication if needed
4. Update Postman collection
5. Update README.md with endpoint documentation

Example structure:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { verifyToken, extractTokenFromHeader } from '@/lib/auth/jwt';

export async function POST(request: NextRequest) {
  try {
    // Verify token
    const authHeader = request.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader);
    const decoded = verifyToken(token);

    // Get request body
    const body = await request.json();

    // Business logic here
    
    // Return response
    return NextResponse.json({ data: result });
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Database Schema Changes

1. Update `prisma/schema.prisma`
2. Generate migration:
```bash
npm run prisma:migrate
```
3. Update related API endpoints
4. Update type definitions if needed

### New Dependencies

Before adding a new dependency:

1. Verify it's actively maintained
2. Check for security vulnerabilities
3. Consider bundle size impact
4. Document why it's needed

## Code Review Guidelines

When reviewing PRs:

- Check for security issues
- Verify error handling
- Test edge cases
- Review database queries for performance
- Check for proper TypeScript types
- Ensure documentation is updated

## Security

- Never commit secrets or API keys
- Use environment variables for configuration
- Validate all user input
- Use parameterized queries (Prisma handles this)
- Report security issues privately to maintainers

## Questions?

- Open an issue for bugs
- Open a discussion for questions
- Check existing issues/PRs first

## License

By contributing, you agree that your contributions will be licensed under the ISC License.

## Thank You!

Your contributions make this project better for everyone. Thank you for taking the time to contribute!
