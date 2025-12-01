import express, { Request, Response } from "express";
import { Pool, Result } from "pg";
import dotenv from "dotenv";
import path from "path";

dotenv.config({
  path: path.join(process.cwd(), ".env"),
});

const app = express();
const port = `${process.env.PORT}`;
//parser
app.use(express.json());
//DB Connect
const pool = new Pool({
  connectionString: `${process.env.CONNECTION_STR}`,
});

const initDB = async () => {
  await pool.query(`
        CREATE TABLE IF NOT EXISTS users(
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(150) UNIQUE NOT NULL,
        age INT,
        phone VARCHAR(15),
        address TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
        )
        `);
  await pool.query(`
            CREATE TABLE IF NOT EXISTS todos(
            id SERIAL PRIMARY KEY,
            user_id INT REFERENCES users(id) ON DELETE CASCADE,
            title VARCHAR(200) NOT NULL,
            description TEXT,
            completed BOOLEAN DEFAULT false,
            due_date DATE,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
            )
            `);
};

initDB();

app.get("/", (req: Request, res: Response) => {
  res.send("Hello World! For new server");
});

app.post("/", (req: Request, res: Response) => {
  console.log(req.body);
  res.status(201).json({
    success: true,
    message: "API is ready",
  });
});

//Users create
app.post("/users", async (req: Request, res: Response) => {
  const { name, email } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO users(name,email) VALUES($1,$2) RETURNING *`,
      [name, email]
    );
    res.status(200).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error: any) {
    res.status(400).send("Invalid input");
  }
});
//Users GET
app.get("/users", async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`SELECT * FROM users`);
    res.status(200).json({
      success: true,
      data: result.rows,
    });
  } catch (error: any) {
    res.status(400).send("Invalid input GET");
  }
});
//Users GET by ID
app.get("/users/:id", async (req: Request, res: Response) => {
  try {
    // console.log(req.params.id);
    const result = await pool.query(`SELECT * FROM users WHERE id=$1`, [
      req.params.id,
    ]);
    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: "User not Found",
      });
    } else {
      res.status(200).json({
        success: true,
        message: "User Fetch Successfully",
        data: result.rows[0],
      });
    }
    // console.log(result.rows);
  } catch (error: any) {
    res.status(400).send("Invalid input GET by id");
  }
});
//update user
app.put("/users/:id", async (req: Request, res: Response) => {
  const { name, email } = req.body;
  try {
    const result = await pool.query(
      `UPDATE users SET name=$1, email=$2 WHERE  id=$3 RETURNING *`,
      [name, email, req.params.id]
    );
    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: "User not Found",
      });
    } else {
      res.status(200).json({
        success: true,
        message: "User Updated Successfully",
        data: result.rows[0],
      });
    }
  } catch (error: any) {
    res.status(400).send("Invalid input Update by id");
  }
});
//Delete user
app.delete("/users/:id", async (req: Request, res: Response) => {
  // console.log(req.params.id);
  try {
    const result = await pool.query(`DELETE FROM users WHERE id = $1`, [
      req.params.id,
    ]);

    if (result.rowCount === 0) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
    } else {
      res.status(200).json({
        success: true,
        message: "User deleted successfully",
        data: result.rows,
      });
    }
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
