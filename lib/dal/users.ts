import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq, and, or, like, sql, not } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import type { User } from "../models";

// Define a type for the user data returned from the DB, excluding the password
type UserRecord = Omit<typeof users.$inferSelect, 'passwordHash'>;

export class UsersDAL {
  private static mapToUser(record: UserRecord): User {
    // This is a simple mapping for now. We can add more complex logic here if needed.
    return {
      id: record.id,
      nationalId: record.nationalId,
      firstName: record.firstName,
      lastName: record.lastName,
      email: record.email,
      role: record.role,
      department: record.department ?? undefined,
      position: record.position ?? undefined,
      hasSpecialOrder: record.hasSpecialOrder ?? undefined,
      certifications: record.certifications ? (record.certifications as string[]) : undefined,
      specialTasks: record.specialTasks ? (record.specialTasks as string[]) : undefined,
      isActive: record.isActive ?? false,
    };
  }

  static async findByNationalId(nationalId: string): Promise<User | null> {
    const result = await db.select().from(users).where(and(eq(users.nationalId, nationalId), eq(users.isActive, true))).limit(1);
    if (result.length === 0) return null;
    const { passwordHash, ...userRecord } = result[0];
    return this.mapToUser(userRecord);
  }

  static async findById(id: string): Promise<User | null> {
    const result = await db.select().from(users).where(and(eq(users.id, id), eq(users.isActive, true))).limit(1);
    if (result.length === 0) return null;
    const { passwordHash, ...userRecord } = result[0];
    return this.mapToUser(userRecord);
  }

  static async findAll(filters: { role?: string; isActive?: boolean, searchTerm?: string } = {}): Promise<User[]> {
    const conditions = [];
    if (filters.role) {
      conditions.push(eq(users.role, filters.role as User['role']));
    }
    if (filters.isActive !== undefined) {
      conditions.push(eq(users.isActive, filters.isActive));
    }
    if (filters.searchTerm) {
      const searchPattern = `%${filters.searchTerm}%`;
      conditions.push(
        or(
          like(sql`concat(${users.firstName}, ' ', ${users.lastName})`, searchPattern),
          like(users.email, searchPattern),
          like(users.nationalId, searchPattern)
        )!
      );
    }

    const finalCondition = conditions.length > 0 ? and(...conditions) : undefined;

    const results = await db.select().from(users).where(finalCondition);
    return results.map(r => {
        const { passwordHash, ...userRecord } = r;
        return this.mapToUser(userRecord)
    });
  }

  static async authenticate(nationalId: string, password: string): Promise<User | null> {
    const result = await db.select().from(users).where(and(eq(users.nationalId, nationalId), eq(users.isActive, true))).limit(1);
    if (result.length === 0) return null;

    const userWithPassword = result[0];
    const isValid = await bcrypt.compare(password, userWithPassword.passwordHash);

    if (!isValid) {
      return null;
    }

    const { passwordHash, ...userRecord } = userWithPassword;
    return this.mapToUser(userRecord);
  }

  static async create(userData: Omit<User, "id" | "isActive"> & { password: string }): Promise<string> {
    const id = crypto.randomUUID();
    const passwordHash = await bcrypt.hash(userData.password, 10);

    await db.insert(users).values({
      id,
      nationalId: userData.nationalId,
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      passwordHash,
      role: userData.role,
      department: userData.department,
      position: userData.position,
      hasSpecialOrder: userData.hasSpecialOrder,
      certifications: userData.certifications,
      specialTasks: userData.specialTasks,
      updatedAt: new Date(),
    });

    return id;
  }

  static async update(id: string, updates: Partial<User>): Promise<boolean> {
    const result = await db.update(users).set(updates).where(eq(users.id, id));
    return result[0].affectedRows > 0;
  }

  static async delete(id: string): Promise<boolean> {
    // This is a soft delete
    const result = await db.update(users).set({ isActive: false }).where(eq(users.id, id));
    return result[0].affectedRows > 0;
  }
}
