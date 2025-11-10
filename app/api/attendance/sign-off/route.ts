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
    const { employeeId } = body;

    if (!employeeId) {
      return NextResponse.json(
        { error: 'Employee ID is required' },
        { status: 400 }
      );
    }

    // Find the latest attendance record without sign-off
    const attendance = await prisma.attendance.findFirst({
      where: {
        employeeId,
        signOffTime: null,
      },
      orderBy: {
        signInTime: 'desc',
      },
      include: {
        employee: true,
      },
    });

    if (!attendance) {
      return NextResponse.json(
        { error: 'No active attendance record found for this employee' },
        { status: 404 }
      );
    }

    // Update attendance with sign-off time
    const updatedAttendance = await prisma.attendance.update({
      where: { id: attendance.id },
      data: {
        signOffTime: new Date(),
      },
    });

    // Calculate shift duration
    const durationMs = updatedAttendance.signOffTime!.getTime() - updatedAttendance.signInTime.getTime();
    const durationHours = (durationMs / (1000 * 60 * 60)).toFixed(2);

    // Log audit event
    await logAuditEvent('employee_sign_off', employeeId, {
      email: attendance.employee.email,
      name: attendance.employee.name,
      signInTime: updatedAttendance.signInTime,
      signOffTime: updatedAttendance.signOffTime,
      durationHours,
      adminId: decoded.id,
    });

    return NextResponse.json({
      message: 'Employee signed off successfully',
      attendance: {
        id: updatedAttendance.id,
        employeeId: updatedAttendance.employeeId,
        signInTime: updatedAttendance.signInTime,
        signOffTime: updatedAttendance.signOffTime,
        durationHours,
      },
    });
  } catch (error: any) {
    console.error('Sign-off error:', error);
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
