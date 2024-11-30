import dotenv from "dotenv";
import pkg from "pg";
const { Pool } = pkg;

dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || "5432"),
  database: process.env.DB_NAME,
  max: 20, 
  idleTimeoutMillis: 30000, 
  connectionTimeoutMillis: 5000, 
});

export const testConnection = async () => {
  try {
    const res = await pool.query("SELECT NOW()");
    console.log("Database connected:", res.rows[0].now);
  } catch (err: unknown) {
    if (typeof err === "object" && err !== null && "message" in err) {
      console.error("Database connection error:", err.message);
    }
  }
};

export default pool;
