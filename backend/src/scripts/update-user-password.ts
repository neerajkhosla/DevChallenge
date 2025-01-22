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

// Test credentials:
// Email: admin@example.com
// Password: Test@123

async function updateUserPassword() {
  try {
    const email = "admin@example.com";
    const password = "Test@123";

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user's password
    const result = await pool.query(
      `UPDATE users 
       SET password = $1 
       WHERE email = $2 AND is_deleted = FALSE 
       RETURNING id, name, email`,
      [hashedPassword, email]
    );

    if (result.rows.length === 0) {
      console.error("User not found");
      return;
    }

    console.log("Password updated successfully for user:", result.rows[0]);
    console.log("\nTest Credentials:");
    console.log("Email:", email);
    console.log("Password:", password);
  } catch (error) {
    console.error("Error updating password:", error);
  } finally {
    await pool.end();
  }
}

updateUserPassword();
