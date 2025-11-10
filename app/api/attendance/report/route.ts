import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { verifyToken, extractTokenFromHeader } from '@/lib/auth/jwt';

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
    const employeeId = searchParams.get('employeeId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Build where clause
    const where: any = {};
    
    if (employeeId) {
      where.employeeId = employeeId;
    }

    if (startDate || endDate) {
      where.signInTime = {};
      if (startDate) {
        where.signInTime.gte = new Date(startDate);
      }
      if (endDate) {
        where.signInTime.lte = new Date(endDate);
      }
    }

    // Get total count
    const total = await prisma.attendance.count({ where });

    // Get attendance records with pagination
    const attendances = await prisma.attendance.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            email: true,
            name: true,
            department: true,
          },
        },
      },
      orderBy: {
        signInTime: 'desc',
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Calculate shift durations
    const report = attendances.map((attendance) => {
      let durationHours = null;
      if (attendance.signOffTime) {
        const durationMs = attendance.signOffTime.getTime() - attendance.signInTime.getTime();
        durationHours = (durationMs / (1000 * 60 * 60)).toFixed(2);
      }

      return {
        id: attendance.id,
        employee: attendance.employee,
        signInTime: attendance.signInTime,
        signOffTime: attendance.signOffTime,
        durationHours,
        status: attendance.signOffTime ? 'completed' : 'active',
      };
    });

    return NextResponse.json({
      report,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Report error:', error);
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
