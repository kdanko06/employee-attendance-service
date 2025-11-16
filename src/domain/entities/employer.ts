export type EmployerRole = 'admin' | 'employee';

export interface EmployerEntity {
  id: string;
  email: string;
  name: string;
  role: EmployerRole;
  createdAt: Date;
}
