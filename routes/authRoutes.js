const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");

const { requireAuth, redirectIfAuth } = require("../middleware/authMiddleware");

// Home page
router.get("/", (req, res) => {
  res.redirect("/login");
});

// Registration
router.get("/register", redirectIfAuth, authController.showRegister);

router.post("/register", redirectIfAuth, authController.register);

// Login
router.get("/login", redirectIfAuth, authController.showLogin);

router.post("/login", redirectIfAuth, authController.login);

// Protected dashboard
router.get("/dashboard", requireAuth, authController.dashboard);

// Logout
router.post("/logout", requireAuth, authController.logout);

module.exports = router;
