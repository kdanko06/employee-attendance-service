import { JsonEmployerRepository } from '../adapters/db/employerRepository';
import { JsonShiftRepository } from '../adapters/db/shiftRepository';
import { BcryptHasher } from '../adapters/crypto/bcryptHasher';
import { JwtTokenService } from '../adapters/auth/jwtTokenService';
import { FileQueueAdapter } from '../adapters/queue/fileQueueAdapter';
import { AuthUseCase } from '../domain/usecases/authUseCase';
import { EmployerUseCase } from '../domain/usecases/employerUseCase';
import { AttendanceUseCase } from '../domain/usecases/attendanceUseCase';
import { JsonAuditLogRepository } from '../adapters/db/auditLogRepository';

const employerRepository = new JsonEmployerRepository();
const shiftRepository = new JsonShiftRepository();
const auditLogRepository = new JsonAuditLogRepository();
const hasher = new BcryptHasher();
const tokenService = new JwtTokenService();
const queue = new FileQueueAdapter();

const authUseCase = new AuthUseCase(employerRepository, hasher, tokenService, queue);
const employerUseCase = new EmployerUseCase(employerRepository, hasher, queue);
const attendanceUseCase = new AttendanceUseCase(shiftRepository, queue);

export const container = {
  authUseCase,
  employerUseCase,
  attendanceUseCase,
  auditLogRepository
};
