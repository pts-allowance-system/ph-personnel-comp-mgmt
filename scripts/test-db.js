const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

// Function to load environment variables from .env file
function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf-8');
    const envVars = envFile.split('\n');
    console.log('Loading environment variables from .env file...');
    for (const line of envVars) {
      if (line && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=');
        if (key) {
          const value = valueParts.join('=').trim().replace(/(^"|"$)/g, '');
          process.env[key.trim()] = value;
        }
      }
    }
  } else {
    console.log('.env file not found. Using system environment variables or defaults.');
  }
}

// Main function to test the connection
async function testDatabaseConnection() {
  loadEnv();

  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: Number.parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'pts_system',
    connectTimeout: 5000 // 5 second timeout
  };

  console.log(`Attempting to connect to database '${dbConfig.database}' on ${dbConfig.host}:${dbConfig.port}...`);

  try {
    const connection = await mysql.createConnection(dbConfig);
    console.log("✅ Database connection successful!");
    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error("❌ Database connection failed.");
    console.error("Error message:", error.message);
    console.error("\nPlease check your .env file and ensure the database server is running and accessible.");
    process.exit(1);
  }
}

testDatabaseConnection();
