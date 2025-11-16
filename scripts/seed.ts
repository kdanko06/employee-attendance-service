import bcrypt from 'bcrypt';
import { jsonDb } from '../src/adapters/db/jsonStore';

async function main() {
  const email = 'admin@example.com';
  const password = 'Admin123!';
  await jsonDb.transaction(async (state) => {
    const existing = state.employers.find((employer) => employer.email === email);
    if (existing) {
      console.log('Admin user already exists');
      return;
    }
    const now = new Date().toISOString();
    const passwordHash = await bcrypt.hash(password, 10);
    state.employers.push({
      id: jsonDb.generateId(),
      email,
      name: 'Default Admin',
      role: 'admin',
      passwordHash,
      createdAt: now,
      updatedAt: now
    });
    console.log('Seeded admin user:', { email, password });
  });
}

main().catch((error) => {
  console.error('Failed to seed data store', error);
  process.exit(1);
});
