import { Pool } from "pg";
import bcrypt from "bcrypt";
import dotenv from "dotenv";

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || "5432"),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

async function createTestUser() {
  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash("password123", 10);

    // Insert test user
    const result = await pool.query(
      `INSERT INTO users (name, email, password, role) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      ["Test Admin", "admin@example.com", hashedPassword, "Admin"]
    );

    console.log("Test user created successfully:", result.rows[0]);
  } catch (error) {
    console.error("Error creating test user:", error);
  } finally {
    await pool.end();
  }
}

createTestUser();
