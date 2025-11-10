import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { verifyToken, extractTokenFromHeader } from '@/lib/auth/jwt';
import { logAuditEvent } from '@/lib/redis/client';

// GET - List all employees with pagination
export async function GET(request: NextRequest) {
  try {
    // Verify admin token
    const authHeader = request.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader);
    const decoded = verifyToken(token);

    if (decoded.type !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const department = searchParams.get('department');

    // Build where clause
    const where: any = {};
    if (department) {
      where.department = department;
    }

    // Get total count
    const total = await prisma.employee.count({ where });

    // Get employees with pagination
    const employees = await prisma.employee.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        department: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { attendances: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    return NextResponse.json({
      employees,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('List employees error:', error);
    if (error.message === 'Invalid or expired token' || error.message === 'No token provided') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create a new employee (without attendance)
export async function POST(request: NextRequest) {
  try {
    // Verify admin token
    const authHeader = request.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader);
    const decoded = verifyToken(token);

    if (decoded.type !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email, name, department } = body;

    if (!email || !name) {
      return NextResponse.json(
        { error: 'Email and name are required' },
        { status: 400 }
      );
    }

    // Check if employee already exists
    const existingEmployee = await prisma.employee.findUnique({
      where: { email },
    });

    if (existingEmployee) {
      return NextResponse.json(
        { error: 'Employee with this email already exists' },
        { status: 409 }
      );
    }

    // Create employee
    const employee = await prisma.employee.create({
      data: {
        email,
        name,
        department,
      },
    });

    // Log audit event
    await logAuditEvent('employee_created', employee.id, {
      email: employee.email,
      name: employee.name,
      department: employee.department,
      adminId: decoded.id,
    });

    return NextResponse.json(
      {
        message: 'Employee created successfully',
        employee: {
          id: employee.id,
          email: employee.email,
          name: employee.name,
          department: employee.department,
          createdAt: employee.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create employee error:', error);
    if (error.message === 'Invalid or expired token' || error.message === 'No token provided') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
