# API Documentation

Complete API reference for the Employee Attendance Service.

## Base URL

```
http://localhost:3000
```

## Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

Tokens are obtained by registering or logging in as an admin.

## Error Responses

All endpoints return errors in the following format:

```json
{
  "error": "Error message description"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (invalid or missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate resource)
- `500` - Internal Server Error

---

## Authentication Endpoints

### Register Admin

Creates a new admin user and returns a JWT token.

**Endpoint:** `POST /api/auth/register`

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "admin@example.com",
  "password": "SecurePassword123!",
  "name": "John Admin"
}
```

**Response:** `201 Created`
```json
{
  "message": "Admin registered successfully",
  "admin": {
    "id": "uuid",
    "email": "admin@example.com",
    "name": "John Admin",
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Errors:**
- `400` - Missing required fields (email, password, or name)
- `409` - Admin with this email already exists
- `500` - Internal server error

---

### Login Admin

Authenticates an admin user and returns a JWT token.

**Endpoint:** `POST /api/auth/login`

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "admin@example.com",
  "password": "SecurePassword123!"
}
```

**Response:** `200 OK`
```json
{
  "message": "Login successful",
  "admin": {
    "id": "uuid",
    "email": "admin@example.com",
    "name": "John Admin"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Errors:**
- `400` - Missing required fields (email or password)
- `401` - Invalid credentials
- `500` - Internal server error

---

## Employee Endpoints (Complete CRUD)

All employee endpoints require admin authentication.

### Create Employee

Creates a new employee record without signing them in.

**Endpoint:** `POST /api/employees`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "name": "John Doe",
  "department": "Engineering"
}
```

**Response:** `201 Created`
```json
{
  "message": "Employee created successfully",
  "employee": {
    "id": "uuid",
    "email": "john.doe@example.com",
    "name": "John Doe",
    "department": "Engineering",
    "createdAt": "2024-01-01T08:00:00.000Z"
  }
}
```

**Errors:**
- `400` - Missing required fields (email or name)
- `401` - Unauthorized (invalid or missing token)
- `403` - Forbidden (not an admin)
- `409` - Employee with this email already exists
- `500` - Internal server error

---

### List All Employees

Retrieves all employees with pagination and optional filtering.

**Endpoint:** `GET /api/employees`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (optional) - Page number, default: 1
- `limit` (optional) - Results per page, default: 50
- `department` (optional) - Filter by department name

**Example Requests:**

Get all employees:
```
GET /api/employees?page=1&limit=50
```

Filter by department:
```
GET /api/employees?department=Engineering&page=1&limit=50
```

**Response:** `200 OK`
```json
{
  "employees": [
    {
      "id": "uuid",
      "email": "john.doe@example.com",
      "name": "John Doe",
      "department": "Engineering",
      "createdAt": "2024-01-01T08:00:00.000Z",
      "updatedAt": "2024-01-01T08:00:00.000Z",
      "_count": {
        "attendances": 15
      }
    }
  ],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 50,
    "totalPages": 2
  }
}
```

**Errors:**
- `401` - Unauthorized (invalid or missing token)
- `403` - Forbidden (not an admin)
- `500` - Internal server error

---

### Get Employee by ID

Retrieves a single employee with their recent attendance records.

**Endpoint:** `GET /api/employees/{id}`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "employee": {
    "id": "uuid",
    "email": "john.doe@example.com",
    "name": "John Doe",
    "department": "Engineering",
    "createdAt": "2024-01-01T08:00:00.000Z",
    "updatedAt": "2024-01-01T08:00:00.000Z",
    "recentAttendances": [
      {
        "id": "uuid",
        "employeeId": "uuid",
        "signInTime": "2024-01-01T09:00:00.000Z",
        "signOffTime": "2024-01-01T17:00:00.000Z",
        "createdAt": "2024-01-01T09:00:00.000Z",
        "updatedAt": "2024-01-01T17:00:00.000Z"
      }
    ]
  }
}
```

**Errors:**
- `401` - Unauthorized (invalid or missing token)
- `403` - Forbidden (not an admin)
- `404` - Employee not found
- `500` - Internal server error

---

### Update Employee

Updates an employee's information.

**Endpoint:** `PUT /api/employees/{id}`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "John Doe Updated",
  "email": "john.doe.new@example.com",
  "department": "Product Management"
}
```

Note: All fields are optional. Only include fields you want to update.

**Response:** `200 OK`
```json
{
  "message": "Employee updated successfully",
  "employee": {
    "id": "uuid",
    "email": "john.doe.new@example.com",
    "name": "John Doe Updated",
    "department": "Product Management",
    "updatedAt": "2024-01-01T10:00:00.000Z"
  }
}
```

**Errors:**
- `401` - Unauthorized (invalid or missing token)
- `403` - Forbidden (not an admin)
- `404` - Employee not found
- `409` - Email is already in use by another employee
- `500` - Internal server error

---

### Delete Employee

Deletes an employee and all their attendance records (cascading delete).

**Endpoint:** `DELETE /api/employees/{id}`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "message": "Employee deleted successfully"
}
```

**Errors:**
- `401` - Unauthorized (invalid or missing token)
- `403` - Forbidden (not an admin)
- `404` - Employee not found
- `500` - Internal server error

---

## Attendance Endpoints

All attendance endpoints require admin authentication.

### Sign-In Employee

Creates a new employee (if doesn't exist) and records their sign-in time.

**Endpoint:** `POST /api/attendance/sign-in`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "email": "employee@example.com",
  "name": "Jane Employee",
  "department": "Engineering"
}
```

**Response:** `201 Created`
```json
{
  "message": "Employee signed in successfully",
  "employee": {
    "id": "uuid",
    "email": "employee@example.com",
    "name": "Jane Employee",
    "department": "Engineering"
  },
  "attendance": {
    "id": "uuid",
    "signInTime": "2024-01-01T09:00:00.000Z"
  }
}
```

**Errors:**
- `400` - Missing required fields (email or name)
- `401` - Unauthorized (invalid or missing token)
- `403` - Forbidden (not an admin)
- `409` - Employee with this email already exists
- `500` - Internal server error

---

### Sign-Off Employee

Records an employee's sign-off time and calculates shift duration.

**Endpoint:** `POST /api/attendance/sign-off`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "employeeId": "uuid"
}
```

**Response:** `200 OK`
```json
{
  "message": "Employee signed off successfully",
  "attendance": {
    "id": "uuid",
    "employeeId": "uuid",
    "signInTime": "2024-01-01T09:00:00.000Z",
    "signOffTime": "2024-01-01T17:00:00.000Z",
    "durationHours": "8.00"
  }
}
```

**Errors:**
- `400` - Missing employee ID
- `401` - Unauthorized (invalid or missing token)
- `403` - Forbidden (not an admin)
- `404` - No active attendance record found for this employee
- `500` - Internal server error

---

### Get Shift Reports

Retrieves attendance records with filtering and pagination.

**Endpoint:** `GET /api/attendance/report`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (optional) - Page number, default: 1
- `limit` (optional) - Results per page, default: 50
- `employeeId` (optional) - Filter by employee ID
- `startDate` (optional) - Filter from date (ISO 8601 format)
- `endDate` (optional) - Filter to date (ISO 8601 format)

**Example Requests:**

Get all reports:
```
GET /api/attendance/report?page=1&limit=50
```

Filter by employee:
```
GET /api/attendance/report?employeeId=uuid&page=1&limit=50
```

Filter by date range:
```
GET /api/attendance/report?startDate=2024-01-01&endDate=2024-12-31&page=1&limit=50
```

**Response:** `200 OK`
```json
{
  "report": [
    {
      "id": "uuid",
      "employee": {
        "id": "uuid",
        "email": "employee@example.com",
        "name": "Jane Employee",
        "department": "Engineering"
      },
      "signInTime": "2024-01-01T09:00:00.000Z",
      "signOffTime": "2024-01-01T17:00:00.000Z",
      "durationHours": "8.00",
      "status": "completed"
    },
    {
      "id": "uuid",
      "employee": {
        "id": "uuid",
        "email": "employee2@example.com",
        "name": "John Employee",
        "department": "Sales"
      },
      "signInTime": "2024-01-01T08:30:00.000Z",
      "signOffTime": null,
      "durationHours": null,
      "status": "active"
    }
  ],
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 50,
    "totalPages": 3
  }
}
```

**Errors:**
- `401` - Unauthorized (invalid or missing token)
- `403` - Forbidden (not an admin)
- `500` - Internal server error

---

## Data Models

### Admin

```typescript
{
  id: string;          // UUID
  email: string;       // Unique email address
  password: string;    // Hashed password
  name: string;        // Full name
  createdAt: Date;     // Account creation timestamp
  updatedAt: Date;     // Last update timestamp
}
```

### Employee

```typescript
{
  id: string;          // UUID
  email: string;       // Unique email address
  name: string;        // Full name
  department: string;  // Department name (optional)
  createdAt: Date;     // Record creation timestamp
  updatedAt: Date;     // Last update timestamp
}
```

### Attendance

```typescript
{
  id: string;          // UUID
  employeeId: string;  // Reference to Employee
  signInTime: Date;    // Sign-in timestamp
  signOffTime: Date;   // Sign-off timestamp (nullable)
  createdAt: Date;     // Record creation timestamp
  updatedAt: Date;     // Last update timestamp
}
```

---

## Audit Logging

All significant actions are automatically logged to Redis:

- Admin registration
- Admin login
- Employee sign-in
- Employee sign-off

Audit logs include:
- Action type
- User ID
- Timestamp
- Action details

Logs are stored with a 30-day TTL and can be queried per user.

---

## Rate Limiting

Currently, no rate limiting is implemented. For production deployments, consider:

- Implementing rate limiting middleware
- Using AWS WAF for API protection
- Setting up CloudFlare for DDoS protection

---

## Pagination

Endpoints that return lists support pagination:

- `page` - Current page number (starts at 1)
- `limit` - Number of results per page (max 100)

Response includes pagination metadata:
```json
{
  "pagination": {
    "total": 150,      // Total number of records
    "page": 1,         // Current page
    "limit": 50,       // Results per page
    "totalPages": 3    // Total number of pages
  }
}
```

---

## Date Formats

All dates use ISO 8601 format:

**Request:** `YYYY-MM-DD` or `YYYY-MM-DDTHH:mm:ss.sssZ`
```
2024-01-01
2024-01-01T09:00:00.000Z
```

**Response:** Full ISO 8601 with timezone
```
2024-01-01T09:00:00.000Z
```

---

## Testing with Postman

Import the Postman collection from `postman/collection.json` for ready-to-use requests with:

- Pre-configured request templates
- Automatic token management
- Environment variables
- Example responses

---

## Testing with cURL

See examples in [QUICKSTART.md](QUICKSTART.md) for cURL commands.

---

## Security Best Practices

1. **Always use HTTPS in production**
2. **Keep JWT secrets secure** - Use strong, random secrets (min 32 characters)
3. **Set appropriate token expiry** - Default is 24 hours
4. **Validate input** - All inputs are validated server-side
5. **Use strong passwords** - Minimum 8 characters recommended
6. **Implement rate limiting** - Prevent brute force attacks
7. **Regular security updates** - Keep dependencies up to date

---

## Support

For issues or questions about the API:
- Check the [README.md](README.md)
- Review the [Quick Start Guide](QUICKSTART.md)
- Open an issue on GitHub
