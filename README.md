# Employee Attendance Service

Containerised Next.js 14 API project with TypeScript for an Employee Registration and Time Logging System. Features JWT authentication, Prisma ORM with PostgreSQL, Redis for audit logs, and Docker containerization ready for AWS ECR + ECS Fargate deployment.

## 🚀 Quick Start

**Want to get started quickly?** Check out the [Quick Start Guide](QUICKSTART.md) for a streamlined setup process using Docker Compose.

## Features

- 🔐 JWT Authentication for admin users
- 👥 Employee registration and management
- ⏰ Time tracking (sign-in/sign-off)
- 📊 Shift reporting and analytics
- 🗄️ PostgreSQL database with Prisma ORM
- 🔴 Redis for audit logging
- 🐳 Fully containerized with Docker
- ☁️ AWS ECS Fargate deployment ready
- 📮 Postman collection included
- ⚡ CI/CD pipeline with GitHub Actions

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Cache/Logs**: Redis
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcrypt
- **Containerization**: Docker & docker-compose
- **Deployment**: AWS ECR + ECS Fargate

## Prerequisites

- Node.js 20+ and npm
- Docker and docker-compose
- PostgreSQL (if running locally without Docker)
- Redis (if running locally without Docker)

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/kdanko06/employee-attendance-service.git
cd employee-attendance-service
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/attendance_db
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key-change-in-production-min-32-chars
JWT_EXPIRES_IN=24h
NODE_ENV=development
```

### 4. Generate Prisma Client

```bash
npm run prisma:generate
```

### 5. Run database migrations

```bash
npm run prisma:migrate
```

## Running the Application

### Option 1: Local Development

```bash
npm run dev
```

The API will be available at `http://localhost:3000`

### Option 2: Docker Compose (Recommended)

```bash
docker-compose up -d
```

This starts:
- Next.js application on port 3000
- PostgreSQL on port 5432
- Redis on port 6379

To view logs:
```bash
npm run docker:logs
```

To stop:
```bash
npm run docker:down
```

## API Endpoints

### Authentication

#### Register Admin
```
POST /api/auth/register
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "securePassword123",
  "name": "Admin Name"
}
```

#### Login Admin
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "securePassword123"
}
```

### Attendance Management

All attendance endpoints require Bearer token authentication.

#### Sign-In Employee
```
POST /api/attendance/sign-in
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "employee@example.com",
  "name": "Employee Name",
  "department": "Engineering"
}
```

#### Sign-Off Employee
```
POST /api/attendance/sign-off
Authorization: Bearer <token>
Content-Type: application/json

{
  "employeeId": "uuid-here"
}
```

#### Get Shift Reports
```
GET /api/attendance/report?page=1&limit=50&employeeId=uuid&startDate=2024-01-01&endDate=2024-12-31
Authorization: Bearer <token>
```

Query parameters:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 50)
- `employeeId` (optional): Filter by employee ID
- `startDate` (optional): Filter from date (ISO 8601)
- `endDate` (optional): Filter to date (ISO 8601)

## Database Schema

### Admin
- id (UUID, primary key)
- email (unique)
- password (hashed)
- name
- createdAt
- updatedAt

### Employee
- id (UUID, primary key)
- email (unique)
- name
- department
- createdAt
- updatedAt

### Attendance
- id (UUID, primary key)
- employeeId (foreign key)
- signInTime
- signOffTime (nullable)
- createdAt
- updatedAt

## Audit Logging

All significant actions are logged to Redis:
- Admin registration
- Admin login
- Employee sign-in
- Employee sign-off

Audit logs are stored with 30-day TTL and can be retrieved per user.

## AWS Deployment

### Build and Push to ECR

```bash
# Authenticate Docker to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Build image
docker build -t employee-attendance-service .

# Tag image
docker tag employee-attendance-service:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/employee-attendance-service:latest

# Push to ECR
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/employee-attendance-service:latest
```

### ECS Fargate Deployment

1. Create an ECS cluster
2. Create a task definition using the ECR image
3. Configure environment variables in task definition:
   - `DATABASE_URL`
   - `REDIS_URL`
   - `JWT_SECRET`
   - `JWT_EXPIRES_IN`
   - `NODE_ENV=production`
4. Create an ECS service with desired task count
5. Configure Application Load Balancer (optional)
6. Set up RDS PostgreSQL and ElastiCache Redis
7. Configure security groups for database and Redis access

### Environment Variables for Production

Set these in ECS Task Definition or AWS Systems Manager Parameter Store:

```
DATABASE_URL=postgresql://user:password@rds-endpoint:5432/dbname
REDIS_URL=redis://elasticache-endpoint:6379
JWT_SECRET=<strong-random-secret-min-32-chars>
JWT_EXPIRES_IN=24h
NODE_ENV=production
```

## Postman Testing

Import the Postman collection from `postman/collection.json`.

The collection includes:
1. Register Admin
2. Login Admin (saves token automatically)
3. Sign-In Employee
4. Sign-Off Employee
5. Get Shift Reports

## Development Commands

```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Deploy migrations to production
npm run prisma:deploy

# Open Prisma Studio (database GUI)
npm run prisma:studio

# Docker commands
npm run docker:build    # Build Docker image
npm run docker:up       # Start containers
npm run docker:down     # Stop containers
npm run docker:logs     # View logs
```

## Project Structure

```
employee-attendance-service/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── register/route.ts
│   │   │   └── login/route.ts
│   │   └── attendance/
│   │       ├── sign-in/route.ts
│   │       ├── sign-off/route.ts
│   │       └── report/route.ts
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── lib/
│   ├── prisma/
│   │   └── client.ts
│   ├── redis/
│   │   └── client.ts
│   └── auth/
│       └── jwt.ts
├── prisma/
│   └── schema.prisma
├── postman/
│   └── collection.json
├── Dockerfile
├── docker-compose.yml
├── next.config.js
├── tsconfig.json
├── package.json
└── README.md
```

## Security Considerations

- JWT secrets must be at least 32 characters in production
- Passwords are hashed using bcrypt with 10 salt rounds
- All sensitive environment variables should be stored securely (AWS Secrets Manager)
- Enable HTTPS in production
- Configure CORS appropriately
- Implement rate limiting for production
- Regular security updates for dependencies

## Troubleshooting

### Prisma Client Not Generated
```bash
npm run prisma:generate
```

### Database Connection Issues
- Verify DATABASE_URL is correct
- Ensure PostgreSQL is running
- Check network connectivity

### Redis Connection Issues
- Verify REDIS_URL is correct
- Ensure Redis is running
- Check firewall rules

### Docker Issues
- Ensure Docker daemon is running
- Check port availability (3000, 5432, 6379)
- Review logs: `docker-compose logs -f`

## License

ISC

## Support

For issues and questions, please open an issue on GitHub.
