require("dotenv").config();

const express = require("express");
const session = require("express-session");
const path = require("path");

const db = require("./config/db");
const authRoutes = require("./routes/authRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET is missing from your .env file");
}

// Configure EJS
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Read form data
app.use(
  express.urlencoded({
    extended: false,
    limit: "10kb",
  }),
);

// Serve CSS and other public files
app.use(express.static(path.join(__dirname, "public")));

// Configure login sessions
app.use(
  session({
    name: "connect.sid",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 1000,
    },
  }),
);

// Register application routes
app.use("/", authRoutes);

// Handle unknown pages
app.use((req, res) => {
  res.status(404).send("Page not found");
});

// Handle server errors
app.use((err, req, res, next) => {
  console.error("Server error:", err.message);

  if (res.headersSent) {
    return next(err);
  }

  res.status(500).send("Something went wrong. Please try again.");
});

// Start only after checking MySQL
async function startServer() {
  try {
    await db.query("SELECT 1");

    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("MySQL connection failed:", error.message);

    process.exit(1);
  }
}

startServer();
