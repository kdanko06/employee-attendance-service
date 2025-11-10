import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { verifyToken, extractTokenFromHeader } from '@/lib/auth/jwt';
import { logAuditEvent } from '@/lib/redis/client';

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

    // Create attendance record (sign-in)
    const attendance = await prisma.attendance.create({
      data: {
        employeeId: employee.id,
      },
    });

    // Log audit event
    await logAuditEvent('employee_sign_in', employee.id, {
      email: employee.email,
      name: employee.name,
      signInTime: attendance.signInTime,
      adminId: decoded.id,
    });

    return NextResponse.json(
      {
        message: 'Employee signed in successfully',
        employee: {
          id: employee.id,
          email: employee.email,
          name: employee.name,
          department: employee.department,
        },
        attendance: {
          id: attendance.id,
          signInTime: attendance.signInTime,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Sign-in error:', error);
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
