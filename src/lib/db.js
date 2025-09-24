import mysql from "mysql2/promise";
import dotenv from "dotenv";

// Load .env.local explicitly
dotenv.config({ path: "./.env.local" });

export const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "", // empty string if no password
  database: process.env.DB_NAME,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
});
