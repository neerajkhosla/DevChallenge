import express from "express";
import cors from "cors";
import { Pool } from "pg";
import dotenv from "dotenv";
import { readFileSync } from "fs";
import { join } from "path";
import swaggerUi from "swagger-ui-express";
import { specs } from "./swagger";
import { v4 as uuidv4 } from "uuid";
import PDFDocument from "pdfkit";
import bcrypt from "bcrypt";

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Swagger Documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

// Database configuration
const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || "5432"),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// Initialize database
const initializeDb = async () => {
  try {
    const sqlScript = readFileSync(join(__dirname, "db", "init.sql"), "utf8");
    await pool.query(sqlScript);
    console.log("Database initialized successfully");
  } catch (error) {
    console.error("Error initializing database:", error);
  }
};

app.use(cors());
app.use(express.json());

// Add this interface
interface UserActivity {
  activity_type: string;
  activity_timestamp: string;
  details: string;
}

interface UserActivitySummary {
  activity_type: string;
  activity_count: number;
  last_updated: string;
}

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - role
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: The auto-generated id of the user
 *         name:
 *           type: string
 *           description: The name of the user
 *         email:
 *           type: string
 *           format: email
 *           description: The email address of the user
 *         role:
 *           type: string
 *           enum: [Admin, User]
 *           description: The role of the user
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *         deleted_at:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: Deletion timestamp
 *         is_deleted:
 *           type: boolean
 *           description: Soft delete flag
 *
 *     UserActivity:
 *       type: object
 *       properties:
 *         activity_type:
 *           type: string
 *           description: Type of activity (e.g., login, pdf_download)
 *         activity_timestamp:
 *           type: string
 *           format: date-time
 *           description: When the activity occurred
 *         details:
 *           type: string
 *           description: Additional details about the activity
 *
 *     UserActivitySummary:
 *       type: object
 *       properties:
 *         activity_type:
 *           type: string
 *           description: Type of activity
 *         activity_count:
 *           type: integer
 *           description: Number of times this activity occurred
 *         last_updated:
 *           type: string
 *           format: date-time
 *           description: When this summary was last updated
 *
 *     UserActivityResponse:
 *       type: object
 *       properties:
 *         user:
 *           type: object
 *           properties:
 *             name:
 *               type: string
 *             email:
 *               type: string
 *             role:
 *               type: string
 *         recentActivities:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/UserActivity'
 *         activitySummary:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/UserActivitySummary'
 */

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Returns the list of all users
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: The list of users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 */
app.get("/api/users", async (req: express.Request, res: express.Response) => {
  try {
    const result = await pool.query(
      `SELECT * FROM users 
       WHERE is_deleted = FALSE 
       ORDER BY created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Create a new user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - role
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               role:
 *                 type: string
 *                 enum: [Admin, User]
 *     responses:
 *       201:
 *         description: The user was successfully created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 */
app.post("/api/users", async (req: express.Request, res: express.Response) => {
  const { name, email, role } = req.body;
  try {
    // Hash the default password
    const hashedPassword = await bcrypt.hash("Test@123", 10);

    const result = await pool.query(
      `INSERT INTO users (name, email, role, password) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [name, email, role, hashedPassword]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Update a user by id
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: The user id
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - role
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               role:
 *                 type: string
 *                 enum: [Admin, User]
 *     responses:
 *       200:
 *         description: The user was updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 */
app.put(
  "/api/users/:id",
  async (req: express.Request, res: express.Response) => {
    const { id } = req.params;
    const { name, email, role } = req.body;
    try {
      const result = await pool.query(
        `UPDATE users 
       SET name = $1, 
           email = $2, 
           role = $3, 
           updated_at = CURRENT_TIMESTAMP 
       WHERE id = $4 AND is_deleted = FALSE 
       RETURNING *`,
        [name, email, role, id]
      );
      if (result.rows.length === 0) {
        res.status(404).json({ error: "User not found" });
      } else {
        res.json(result.rows[0]);
      }
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Delete a user by id
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: The user id
 *     responses:
 *       200:
 *         description: The user was deleted
 *       404:
 *         description: User not found
 */
app.delete(
  "/api/users/:id",
  async (req: express.Request, res: express.Response) => {
    const { id } = req.params;
    try {
      const result = await pool.query(
        `UPDATE users 
       SET is_deleted = TRUE, 
           deleted_at = CURRENT_TIMESTAMP 
       WHERE id = $1 AND is_deleted = FALSE 
       RETURNING *`,
        [id]
      );
      if (result.rows.length === 0) {
        res.status(404).json({ error: "User not found" });
      } else {
        res.json({ message: "User deleted successfully" });
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

/**
 * @swagger
 * /api/users/{userId}/activity:
 *   get:
 *     summary: Get user activity logs and summary
 *     tags: [User Activity]
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: UUID of the user
 *     responses:
 *       200:
 *         description: User activity data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserActivityResponse'
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
app.get("/api/users/:userId/activity", async (req, res) => {
  try {
    const { userId } = req.params;

    // Fetch user details
    const userResult = await pool.query(
      "SELECT name, email, role FROM users WHERE id = $1",
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = userResult.rows[0];

    // Fetch recent activities
    const activitiesResult = await pool.query(
      `SELECT activity_type, activity_timestamp, details 
       FROM user_activity 
       WHERE user_id = $1 
       AND activity_timestamp >= NOW() - INTERVAL '1 month'
       ORDER BY activity_timestamp DESC 
       LIMIT 10`,
      [userId]
    );

    // Fetch activity summary
    const summaryResult = await pool.query(
      `SELECT activity_type, SUM(activity_count) as activity_count, MAX(last_updated) as last_updated
       FROM user_activity_summary 
       WHERE user_id = $1 
       AND last_updated >= NOW() - INTERVAL '1 month'
       GROUP BY activity_type`,
      [userId]
    );

    res.json({
      user,
      recentActivities: activitiesResult.rows,
      activitySummary: summaryResult.rows,
    });
  } catch (error) {
    console.error("Error fetching user activity:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * @swagger
 * /api/users/{userId}/activity/log:
 *   post:
 *     summary: Log a new user activity
 *     tags: [User Activity]
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: UUID of the user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - activity_type
 *             properties:
 *               activity_type:
 *                 type: string
 *                 description: Type of activity (e.g., pdf_download)
 *               details:
 *                 type: string
 *                 description: Additional details about the activity
 *     responses:
 *       201:
 *         description: Activity logged successfully
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
app.post("/api/users/:userId/activity/log", async (req, res) => {
  try {
    const { userId } = req.params;
    const { activity_type, details } = req.body;

    // Check if user exists
    const userResult = await pool.query(
      "SELECT id FROM users WHERE id = $1 AND is_deleted = FALSE",
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    // Log the activity
    await pool.query(
      `INSERT INTO user_activity (user_id, activity_type, details) 
       VALUES ($1, $2, $3)`,
      [userId, activity_type, details]
    );

    // Update or create activity summary
    await pool.query(
      `INSERT INTO user_activity_summary (user_id, activity_type, activity_count, last_updated)
       VALUES ($1, $2, 1, CURRENT_TIMESTAMP)
       ON CONFLICT (user_id, activity_type) 
       DO UPDATE SET 
         activity_count = user_activity_summary.activity_count + 1,
         last_updated = CURRENT_TIMESTAMP`,
      [userId, activity_type]
    );

    res.status(201).json({ message: "Activity logged successfully" });
  } catch (error) {
    console.error("Error logging activity:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * @swagger
 * /api/users/{userId}/activity-pdf:
 *   get:
 *     summary: Download user activity report as PDF
 *     tags: [User Activity]
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: UUID of the user
 *     responses:
 *       200:
 *         description: PDF report generated successfully
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
app.get("/api/users/:userId/activity-pdf", async (req, res) => {
  try {
    const { userId } = req.params;

    // Fetch user details
    const userResult = await pool.query(
      "SELECT name, email, role FROM users WHERE id = $1 AND is_deleted = FALSE",
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = userResult.rows[0];

    // Log the PDF download activity
    await pool.query(
      `INSERT INTO user_activity (user_id, activity_type, details) 
       VALUES ($1, $2, $3)`,
      [userId, "pdf_download", "Downloaded activity report"]
    );

    // Update activity summary
    await pool.query(
      `INSERT INTO user_activity_summary (user_id, activity_type, activity_count, last_updated)
       VALUES ($1, $2, 1, CURRENT_TIMESTAMP)
       ON CONFLICT (user_id, activity_type) 
       DO UPDATE SET 
         activity_count = user_activity_summary.activity_count + 1,
         last_updated = CURRENT_TIMESTAMP`,
      [userId, "pdf_download"]
    );

    // Fetch recent activities
    const activitiesResult = await pool.query(
      `SELECT activity_type, activity_timestamp, details 
       FROM user_activity 
       WHERE user_id = $1 
       AND activity_timestamp >= NOW() - INTERVAL '1 month'
       ORDER BY activity_timestamp DESC 
       LIMIT 10`,
      [userId]
    );

    // Fetch activity summary
    const summaryResult = await pool.query(
      `SELECT activity_type, SUM(activity_count) as activity_count, MAX(last_updated) as last_updated
       FROM user_activity_summary 
       WHERE user_id = $1 
       AND last_updated >= NOW() - INTERVAL '1 month'
       GROUP BY activity_type`,
      [userId]
    );

    // Create PDF
    const doc = new PDFDocument({
      size: "A4",
      margin: 50,
      info: {
        Title: `Activity Report - ${user.name}`,
        Author: "User Management System",
      },
    });

    // Set response headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=user-activity-${userId}.pdf`
    );

    // Pipe the PDF to the response
    doc.pipe(res);

    // Add header
    doc
      .fontSize(24)
      .fillColor("#1e40af")
      .text("User Activity Report", { align: "center" });
    doc.moveDown();

    // Add timestamp and duration
    const now = new Date();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    doc
      .fontSize(10)
      .fillColor("#6b7280")
      .text(`Generated on: ${now.toLocaleString()}`, { align: "right" })
      .text(
        `Report Duration: ${oneMonthAgo.toLocaleDateString()} - ${now.toLocaleDateString()}`,
        { align: "right" }
      );
    doc.moveDown();

    // User Details Section
    doc.fontSize(18).fillColor("#1e40af").text("User Information");
    doc.moveDown(0.5);

    // Add user details without the box
    doc
      .fontSize(12)
      .fillColor("#000000")
      .text(`Name: ${user.name}`)
      .text(`Email: ${user.email}`)
      .text(`Role: ${user.role}`);

    doc.moveDown();

    // Activity Summary Section
    doc.fontSize(18).fillColor("#1e40af").text("Activity Summary");
    doc.moveDown(0.5);

    summaryResult.rows.forEach((summary: UserActivitySummary) => {
      doc
        .fontSize(12)
        .fillColor("#000000")
        .text(`${summary.activity_type}: ${summary.activity_count} times`)
        .fontSize(10)
        .fillColor("#6b7280")
        .text(
          `Last activity: ${new Date(summary.last_updated).toLocaleString()}`
        )
        .moveDown(0.5);
    });

    doc.moveDown();

    // Recent Activities Section
    doc.fontSize(18).fillColor("#1e40af").text("Recent Activities");
    doc.moveDown(0.5);

    // Table headers
    const startX = 50;
    let currentY = doc.y;

    // Draw table header
    doc.fontSize(12).fillColor("#1e40af");

    // Draw header background
    doc.rect(startX, currentY, 500, 20).fillColor("#f3f4f6").fill();

    // Draw header text
    doc
      .fillColor("#1e40af")
      .text("Activity Type", startX + 10, currentY + 5)
      .text("Timestamp", startX + 200, currentY + 5)
      .text("Details", startX + 350, currentY + 5);

    currentY += 25;

    // Table rows
    activitiesResult.rows.forEach((activity: UserActivity, index: number) => {
      // Alternate row background
      if (index % 2 === 0) {
        doc
          .rect(startX, currentY - 5, 500, 25)
          .fillColor("#f9fafb")
          .fill();
      }

      doc
        .fillColor("#000000")
        .fontSize(10)
        .text(activity.activity_type, startX + 10, currentY)
        .text(
          new Date(activity.activity_timestamp).toLocaleString(),
          startX + 200,
          currentY
        )
        .text(activity.details || "-", startX + 350, currentY);

      currentY += 25;
    });

    // Finalize PDF
    doc.end();
  } catch (error) {
    console.error("Error generating PDF:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Authenticate a user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: User authenticated successfully
 *       401:
 *         description: Invalid credentials
 *       500:
 *         description: Internal server error
 */
app.post(
  "/api/auth/login",
  async (req: express.Request, res: express.Response) => {
    const { email, password } = req.body;

    try {
      const result = await pool.query(
        `SELECT * FROM users 
       WHERE email = $1 AND is_deleted = FALSE`,
        [email]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const user = result.rows[0];
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      // Log the login activity
      await pool.query(
        `INSERT INTO user_activity (user_id, activity_type, details) 
       VALUES ($1, $2, $3)`,
        [user.id, "login", "User logged in"]
      );

      // Update activity summary
      await pool.query(
        `INSERT INTO user_activity_summary (user_id, activity_type, activity_count, last_updated)
       VALUES ($1, $2, 1, CURRENT_TIMESTAMP)
       ON CONFLICT (user_id, activity_type) 
       DO UPDATE SET 
         activity_count = user_activity_summary.activity_count + 1,
         last_updated = CURRENT_TIMESTAMP`,
        [user.id, "login"]
      );

      // Return user data without password
      const { password: _, ...userData } = user;
      res.json(userData);
    } catch (error) {
      console.error("Error authenticating user:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

app.listen(port, async () => {
  await initializeDb();
  console.log(`Server running on port ${port}`);
});
