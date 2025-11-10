# Quick Start Guide

This guide will help you quickly get the Employee Attendance Service up and running.

## Prerequisites

- Docker and docker-compose installed
- Postman or any API testing tool (optional)

## Steps

### 1. Clone the Repository

```bash
git clone https://github.com/kdanko06/employee-attendance-service.git
cd employee-attendance-service
```

### 2. Start the Services with Docker Compose

This is the easiest way to get started. It will start:
- The Next.js application
- PostgreSQL database
- Redis cache

```bash
docker-compose up -d
```

Wait about 30 seconds for all services to be ready.

### 3. Check Service Status

```bash
docker-compose ps
```

All three services should show as "Up" or "running".

### 4. Run Database Migrations

```bash
# Access the running container
docker-compose exec app sh

# Run migrations
npx prisma migrate deploy

# Exit container
exit
```

Alternatively, you can create the database schema manually:

```bash
# From your host machine with the app running
docker-compose exec app npx prisma db push
```

### 5. Test the API

Open your browser and navigate to:
```
http://localhost:3000
```

You should see the Employee Attendance Service homepage with the list of available endpoints.

### 6. Test with Postman

Import the Postman collection from `postman/collection.json` into Postman.

#### Test Flow:

1. **Register Admin**
   - Run "Register Admin" request
   - This will automatically save the JWT token

2. **Login Admin** (optional)
   - Run "Login Admin" request
   - This will update the JWT token

3. **Sign-In Employee**
   - Run "Sign-In Employee" request
   - This creates a new employee and signs them in
   - Employee ID is automatically saved

4. **Sign-Off Employee**
   - Run "Sign-Off Employee" request
   - This signs off the employee and calculates shift duration

5. **Get Shift Reports**
   - Run any of the "Get Shift Reports" requests
   - View all shifts, filter by employee, or by date range

### 7. Test with cURL

#### Register Admin
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "SecurePassword123!",
    "name": "John Admin"
  }'
```

Save the token from the response.

#### Login Admin
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "SecurePassword123!"
  }'
```

#### Sign-In Employee
```bash
curl -X POST http://localhost:3000/api/attendance/sign-in \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "email": "employee@example.com",
    "name": "Jane Employee",
    "department": "Engineering"
  }'
```

Save the employee ID from the response.

#### Sign-Off Employee
```bash
curl -X POST http://localhost:3000/api/attendance/sign-off \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "employeeId": "EMPLOYEE_ID_HERE"
  }'
```

#### Get Shift Reports
```bash
curl -X GET "http://localhost:3000/api/attendance/report?page=1&limit=50" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Viewing Logs

```bash
# View all logs
docker-compose logs -f

# View just the app logs
docker-compose logs -f app

# View database logs
docker-compose logs -f db

# View Redis logs
docker-compose logs -f redis
```

## Stopping the Services

```bash
docker-compose down
```

To also remove the volumes (this will delete all data):
```bash
docker-compose down -v
```

## Troubleshooting

### Services won't start
- Check if ports 3000, 5432, and 6379 are available
- Run `docker-compose logs` to see error messages

### Database connection errors
- Wait 30 seconds after starting services
- Check database is healthy: `docker-compose ps db`
- Run migrations: `docker-compose exec app npx prisma db push`

### API returns 401 Unauthorized
- Make sure you're including the JWT token in the Authorization header
- Format: `Authorization: Bearer YOUR_TOKEN_HERE`
- Token expires after 24 hours by default

### Can't create employee
- Make sure you're logged in as admin (have valid token)
- Each employee email must be unique

### Redis connection errors (during build)
- These are expected during build time and can be ignored
- Redis is only needed at runtime

## Database Management

### Access Database
```bash
docker-compose exec db psql -U postgres -d attendance_db
```

### Common SQL Queries

```sql
-- View all admins
SELECT * FROM admins;

-- View all employees
SELECT * FROM employees;

-- View all attendance records
SELECT * FROM attendances;

-- View attendance with employee details
SELECT e.name, e.email, a.sign_in_time, a.sign_off_time
FROM attendances a
JOIN employees e ON a.employee_id = e.id
ORDER BY a.sign_in_time DESC;
```

### Prisma Studio (Database GUI)

From your local machine (with docker-compose running):

```bash
# Install dependencies locally
npm install

# Copy .env file
cp .env.example .env

# Open Prisma Studio
npm run prisma:studio
```

Access at: http://localhost:5555

## Redis Management

### Access Redis CLI
```bash
docker-compose exec redis redis-cli
```

### Common Redis Commands

```bash
# View all keys
KEYS *

# View audit logs for a user
LRANGE audit:USER_ID_HERE:list 0 -1

# View specific audit event
GET audit:USER_ID_HERE:TIMESTAMP
```

## Next Steps

- Customize the database schema in `prisma/schema.prisma`
- Add more API endpoints in `app/api/`
- Configure environment variables in `.env`
- Deploy to AWS using `AWS_DEPLOYMENT.md`
- Set up monitoring and alerting
- Implement rate limiting
- Add input validation
- Set up HTTPS

## Production Deployment

For production deployment to AWS ECS Fargate, see the comprehensive guide in `AWS_DEPLOYMENT.md`.

## Support

For issues or questions:
- Check the main README.md
- Review the AWS_DEPLOYMENT.md for deployment issues
- Open an issue on GitHub
