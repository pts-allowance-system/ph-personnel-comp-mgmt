import { Database } from '@/lib/database'
import bcrypt from 'bcryptjs'
import type { User } from "../models";

export class UsersDAL {
  static async findByNationalId(nationalId: string): Promise<User | null> {
    const sql = `
      SELECT id, national_id, firstName, lastName, email, role, department, position, isActive, created_at, updated_at
      FROM users
      WHERE national_id = ? AND isActive = true
    `
    return await Database.queryOne<User>(sql, [nationalId])
  }

  static async findById(id: string): Promise<User | null> {
    const sql = `
      SELECT 
        id, national_id, firstName, lastName, email, role, department, position, isActive, 
        certifications, hasSpecialOrder, specialTasks, 
        created_at, updated_at
      FROM users 
      WHERE id = ? AND isActive = true
    `
    return await Database.queryOne<User>(sql, [id]);
  }

  static async findAll(filters: { role?: string; isActive?: boolean } = {}): Promise<User[]> {
    let sql = `
      SELECT id, national_id, firstName, lastName, email, role, department, position, isActive, created_at, updated_at
      FROM users 
      WHERE 1=1
    `
    const params: any[] = []

    if (filters.role) {
      sql += " AND role = ?"
      params.push(filters.role)
    }

    if (filters.isActive !== undefined) {
      sql += " AND isActive = ?"
      params.push(filters.isActive)
    }

    sql += " ORDER BY lastName, firstName"

    return await Database.query<User>(sql, params);
  }

  static async authenticate(nationalId: string, password: string): Promise<User | null> {
    const sql = `
      SELECT id, national_id, firstName, lastName, email, role, department, position, isActive, password_hash
      FROM users 
      WHERE national_id = ? AND isActive = true
    `
    const user = await Database.queryOne<User & { password_hash: string | null }>(sql, [nationalId]);

    if (!user || typeof user.password_hash !== 'string' || user.password_hash.length === 0) {
      return null;
    }
    
    const isValid = await bcrypt.compare(password, user.password_hash);

    if (!isValid) {
      return null;
    }

    // Remove password_hash from returned user
    const { password_hash, ...userWithoutPassword } = user;
    return userWithoutPassword as User;
  }

  static async create(userData: Omit<User, "id" | "createdAt" | "updatedAt"> & { password: string }): Promise<string> {
    const id = Database.generateId()
    const passwordHash = await bcrypt.hash(userData.password, 10)

    const data = {
      id,
      national_id: userData.nationalId,
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      password_hash: passwordHash,
      role: userData.role,
      department: userData.department ?? null,
      position: userData.position ?? null,
      isActive: userData.isActive ?? true,
    }

    await Database.insert("users", data)
    return id
  }

  static async update(id: string, updates: Partial<User>): Promise<boolean> {
    const data: Record<string, any> = {}

    if (updates.firstName) data.firstName = updates.firstName;
    if (updates.lastName) data.lastName = updates.lastName;
    if (updates.email) data.email = updates.email;
    if (updates.role) data.role = updates.role;
    if (updates.department) data.department = updates.department;
    if (updates.position) data.position = updates.position;
    if (updates.isActive !== undefined) data.isActive = updates.isActive;

    if (Object.keys(data).length === 0) return true; // No updates

    return await Database.update("users", data, { id });
  }

  static async delete(id: string): Promise<boolean> {
    return await Database.update("users", { isActive: false }, { id })
  }
}
