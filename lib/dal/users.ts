import { Database } from "../database"
import bcrypt from "bcryptjs"
import type { User } from "../types"

export class UsersDAL {
  static async findByNationalId(nationalId: string): Promise<User | null> {
    const sql = `
      SELECT id, national_id, name, email, role, department, position, isActive, created_at, updated_at
      FROM users
      WHERE national_id = ? AND isActive = true
    `
    return await Database.queryOne<User>(sql, [nationalId])
  }

  static async findById(id: string): Promise<User | null> {
    const sql = `
      SELECT id, national_id, name, email, role, department, position, isActive, created_at, updated_at
      FROM users 
      WHERE id = ?
    `
    return await Database.queryOne<User>(sql, [id])
  }

  static async findAll(filters: { role?: string; isActive?: boolean } = {}): Promise<User[]> {
    let sql = `
      SELECT id, national_id, name, email, role, department, position, isActive, created_at, updated_at
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

    sql += " ORDER BY name"

    return await Database.query<User>(sql, params)
  }

  static async authenticate(nationalId: string, password: string): Promise<User | null> {
    const sql = `
      SELECT id, national_id, name, email, role, department, position, isActive, password_hash
      FROM users 
      WHERE national_id = ? AND isActive = true
    `
    const user = await Database.queryOne<User & { password_hash: string | null }>(sql, [nationalId])

    if (!user) {
      console.error(`[AuthDAL] Debug: User lookup for nationalId '${nationalId}' returned no user.`);
      console.error(`[AuthDAL] Authentication failed: User with nationalId '${nationalId}' not found or is inactive.`);
      return null;
    }

    console.log(`[AuthDAL] Debug: User found for nationalId '${nationalId}':`, JSON.stringify(user));
    console.log(`[AuthDAL] Debug: Password received from client for nationalId '${nationalId}': '${password}'`);
    console.log(`[AuthDAL] Debug: Stored password_hash for nationalId '${nationalId}': '${user.password_hash}'`);

    // Add this check to ensure password_hash is a valid string
    if (typeof user.password_hash !== 'string' || user.password_hash.length === 0) {
      console.error(`[AuthDAL] Authentication failed: No valid password hash found for user with nationalId '${nationalId}'.`);
      return null; // Treat as invalid credentials
    }

    // For demo purposes, we'll accept "password123" for all users
    // In production, use: const isValid = await bcrypt.compare(password, user.password_hash)
    const isValid = await bcrypt.compare(password, user.password_hash)

    if (!isValid) {
      console.error(`[AuthDAL] Authentication failed: Password mismatch for user with nationalId '${nationalId}'.`);
      return null;
    }

    // Remove password_hash from returned user
    const { password_hash, ...userWithoutPassword } = user
    return userWithoutPassword as User
  }

  static async create(userData: Omit<User, "id" | "createdAt" | "updatedAt"> & { password: string }): Promise<string> {
    const id = Database.generateId()
    const passwordHash = await bcrypt.hash(userData.password, 10)

    const data = {
      id,
      national_id: userData.nationalId,
      name: userData.name,
      email: userData.email,
      password_hash: passwordHash,
      role: userData.role,
      department: userData.department,
      position: userData.position,
      isActive: userData.isActive ?? true,
    }

    await Database.insert("users", data)
    return id
  }

  static async update(id: string, updates: Partial<User>): Promise<boolean> {
    const data: Record<string, any> = {}

    if (updates.name) data.name = updates.name
    if (updates.email) data.email = updates.email
    if (updates.role) data.role = updates.role
    if (updates.department) data.department = updates.department
    if (updates.position) data.position = updates.position
    if (updates.isActive !== undefined) data.isActive = updates.isActive

    return await Database.update("users", data, { id })
  }

  static async delete(id: string): Promise<boolean> {
    return await Database.update("users", { isActive: false }, { id })
  }
}
