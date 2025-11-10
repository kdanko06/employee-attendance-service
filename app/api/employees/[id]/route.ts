import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { verifyToken, extractTokenFromHeader } from '@/lib/auth/jwt';
import { logAuditEvent } from '@/lib/redis/client';

// GET - Read a single employee by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params;

    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        attendances: {
          orderBy: {
            signInTime: 'desc',
          },
          take: 10, // Last 10 attendance records
        },
      },
    });

    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      employee: {
        id: employee.id,
        email: employee.email,
        name: employee.name,
        department: employee.department,
        createdAt: employee.createdAt,
        updatedAt: employee.updatedAt,
        recentAttendances: employee.attendances,
      },
    });
  } catch (error: any) {
    console.error('Get employee error:', error);
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

// PUT - Update an employee by ID
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params;
    const body = await request.json();
    const { email, name, department } = body;

    // Check if employee exists
    const existingEmployee = await prisma.employee.findUnique({
      where: { id },
    });

    if (!existingEmployee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }

    // Check if email is being changed and if it's already taken
    if (email && email !== existingEmployee.email) {
      const emailTaken = await prisma.employee.findUnique({
        where: { email },
      });

      if (emailTaken) {
        return NextResponse.json(
          { error: 'Email is already in use by another employee' },
          { status: 409 }
        );
      }
    }

    // Update employee
    const updatedEmployee = await prisma.employee.update({
      where: { id },
      data: {
        ...(email && { email }),
        ...(name && { name }),
        ...(department !== undefined && { department }),
      },
    });

    // Log audit event
    await logAuditEvent('employee_updated', updatedEmployee.id, {
      email: updatedEmployee.email,
      name: updatedEmployee.name,
      department: updatedEmployee.department,
      adminId: decoded.id,
      changes: { email, name, department },
    });

    return NextResponse.json({
      message: 'Employee updated successfully',
      employee: {
        id: updatedEmployee.id,
        email: updatedEmployee.email,
        name: updatedEmployee.name,
        department: updatedEmployee.department,
        updatedAt: updatedEmployee.updatedAt,
      },
    });
  } catch (error: any) {
    console.error('Update employee error:', error);
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

// DELETE - Delete an employee by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params;

    // Check if employee exists
    const employee = await prisma.employee.findUnique({
      where: { id },
    });

    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }

    // Delete employee (cascading delete will remove attendance records)
    await prisma.employee.delete({
      where: { id },
    });

    // Log audit event
    await logAuditEvent('employee_deleted', id, {
      email: employee.email,
      name: employee.name,
      department: employee.department,
      adminId: decoded.id,
    });

    return NextResponse.json({
      message: 'Employee deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete employee error:', error);
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
