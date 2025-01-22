import { Pool } from "pg";
import bcrypt from "bcryptjs";

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "usermetrics",
  password: "postgres",
  port: 5432,
});

async function seed() {
  try {
    // Hash passwords
    const adminPassword = await bcrypt.hash("admin123", 10);
    const userPassword = await bcrypt.hash("user123", 10);

    // Insert admin user
    await pool.query(
      `INSERT INTO users (name, email, role, password) 
       VALUES ($1, $2, $3, $4) 
       ON CONFLICT (email) DO NOTHING`,
      ["Admin User", "admin@example.com", "Admin", adminPassword]
    );

    // Insert regular user
    await pool.query(
      `INSERT INTO users (name, email, role, password) 
       VALUES ($1, $2, $3, $4) 
       ON CONFLICT (email) DO NOTHING`,
      ["Test User", "user@example.com", "User", userPassword]
    );

    console.log("✅ Seed data inserted successfully");
    console.log("\nYou can now login with these credentials:");
    console.log("\nAdmin User:");
    console.log("Email: admin@example.com");
    console.log("Password: admin123");
    console.log("\nRegular User:");
    console.log("Email: user@example.com");
    console.log("Password: user123");
  } catch (error) {
    console.error("Error seeding data:", error);
  } finally {
    await pool.end();
  }
}

seed();
