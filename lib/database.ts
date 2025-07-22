import mysql, { PoolConnection } from "mysql2/promise"

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  port: Number.parseInt(process.env.DB_PORT || "3306"),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "pts_system",
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : undefined,
  timezone: process.env.DB_TIMEZONE || "+07:00",
  connectTimeout: Number.parseInt(process.env.DB_CONNECT_TIMEOUT || "20000"),
  dateStrings: true,
}

// Create and cache the connection pool.
// In development, this prevents new pools from being created on every hot-reload.
// Log the configuration to diagnose connection issues
// console.log("[Database] Initializing with config:", dbConfig);

const globalForPool = global as typeof global & {
  pool?: mysql.Pool
}

let pool: mysql.Pool

if (process.env.NODE_ENV === "production") {
  pool = mysql.createPool({
    ...dbConfig,
    waitForConnections: true,
    connectionLimit: 15,
    queueLimit: 0,
  })
} else {
  if (!globalForPool.pool) {
    globalForPool.pool = mysql.createPool({
      ...dbConfig,
      waitForConnections: true,
      connectionLimit: 15,
      queueLimit: 0,
    })
  }
  pool = globalForPool.pool
}

export function getPool() {
  return pool
}

// Database utility functions
export class Database {
  static async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    try {
      const pool = getPool()
      const [rows] = await pool.execute(sql, params)
      return rows as T[]
    } catch (error) {
      console.error("Database query error:", error)
      throw error
    }
  }

  static async queryOne<T = any>(sql: string, params: any[] = []): Promise<T | null> {
    const results = await this.query<T>(sql, params)
    return results.length > 0 ? results[0] : null
  }

  static async insert(
    table: string,
    data: Record<string, any>,
    connection?: PoolConnection,
  ): Promise<string> {
    const keys = Object.keys(data)
    const values = Object.values(data)
    const placeholders = keys.map(() => "?").join(", ")

    const sql = `INSERT INTO ${table} (${keys.join(", ")}) VALUES (${placeholders})`

    try {
      const executor = connection || getPool()
      const [result] = await executor.execute(sql, values)
      return (result as any).insertId || data.id
    } catch (error) {
      console.error("Database insert error:", error)
      throw error
    }
  }

  static async update(
    table: string,
    data: Record<string, any>,
    where: Record<string, any>,
    connection?: PoolConnection,
  ): Promise<boolean> {
    const setClause = Object.keys(data)
      .map((key) => `${key} = ?`)
      .join(", ")
    const whereClause = Object.keys(where)
      .map((key) => `${key} = ?`)
      .join(" AND ")

    const sql = `UPDATE ${table} SET ${setClause} WHERE ${whereClause}`
    const params = [...Object.values(data), ...Object.values(where)]

    try {
      const executor = connection || getPool()
      const [result] = await executor.execute(sql, params)
      return (result as any).affectedRows > 0
    } catch (error) {
      console.error("Database update error:", error)
      throw error
    }
  }

  static async delete(
    table: string,
    where: Record<string, any>,
    connection?: PoolConnection,
  ): Promise<boolean> {
    const whereClause = Object.keys(where)
      .map((key) => `${key} = ?`)
      .join(" AND ")
    const sql = `DELETE FROM ${table} WHERE ${whereClause}`

    try {
      const executor = connection || getPool()
      const [result] = await executor.execute(sql, Object.values(where))
      return (result as any).affectedRows > 0
    } catch (error) {
      console.error("Database delete error:", error)
      throw error
    }
  }

  static generateId(): string {
    return crypto.randomUUID()
  }
}

// Test database connection
export async function testConnection(): Promise<boolean> {
  try {
    const pool = getPool()
    await pool.execute("SELECT 1")
    console.log("✅ Database connection successful")
    return true
  } catch (error) {
    console.error("❌ Database connection failed:", error)
    return false
  }
}
