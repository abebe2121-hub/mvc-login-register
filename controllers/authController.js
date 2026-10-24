const bcrypt = require("bcrypt");
const User = require("../models/User");

// Display registration page
exports.showRegister = (req, res) => {
  res.render("register", {
    error: null,
  });
};

// Display login page
exports.showLogin = (req, res) => {
  res.render("login", {
    error: null,
    success:
      req.query.registered === "1"
        ? "Registration successful! Please log in."
        : null,
  });
};

// Register a new user
exports.register = async (req, res) => {
  try {
    const name = (req.body.name || "").trim();
    const email = (req.body.email || "").trim().toLowerCase();
    const password = req.body.password || "";
    const confirmPassword = req.body.confirmPassword || "";

    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).render("register", {
        error: "Please fill in all fields.",
      });
    }

    if (name.length > 100 || email.length > 255) {
      return res.status(400).render("register", {
        error: "Name or email is too long.",
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).render("register", {
        error: "Please enter a valid email address.",
      });
    }

    if (password.length < 8 || Buffer.byteLength(password, "utf8") > 72) {
      return res.status(400).render("register", {
        error:
          "Password must be at least 8 characters and no more than 72 UTF-8 bytes.",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).render("register", {
        error: "Passwords do not match.",
      });
    }

    const existingUser = await User.findByEmail(email);

    if (existingUser) {
      return res.status(409).render("register", {
        error: "This email is already registered.",
      });
    }

    // Hash the password before storing it
    const hashedPassword = await bcrypt.hash(password, 12);

    await User.createUser(name, email, hashedPassword);

    return res.redirect("/login?registered=1");
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).render("register", {
        error: "This email is already registered.",
      });
    }

    console.error("Registration error:", error.message);

    return res.status(500).render("register", {
      error: "Registration failed. Please try again.",
    });
  }
};

// Log in an existing user
exports.login = async (req, res) => {
  try {
    const email = (req.body.email || "").trim().toLowerCase();
    const password = req.body.password || "";

    if (!email || !password) {
      return res.status(400).render("login", {
        error: "Please enter your email and password.",
        success: null,
      });
    }

    const user = await User.findByEmail(email);

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).render("login", {
        error: "Invalid email or password.",
        success: null,
      });
    }

    // Create a fresh session after successful login
    req.session.regenerate((err) => {
      if (err) {
        console.error("Session error:", err.message);

        return res.status(500).render("login", {
          error: "Could not start your session. Please try again.",
          success: null,
        });
      }

      req.session.userId = user.id;
      req.session.userName = user.name;

      req.session.save((saveError) => {
        if (saveError) {
          console.error("Session save error:", saveError.message);

          return res.status(500).render("login", {
            error: "Could not complete login. Please try again.",
            success: null,
          });
        }

        return res.redirect("/dashboard");
      });
    });
  } catch (error) {
    console.error("Login error:", error.message);

    return res.status(500).render("login", {
      error: "Login failed. Please try again.",
      success: null,
    });
  }
};

// Display dashboard after login
exports.dashboard = (req, res) => {
  res.render("dashboard", {
    name: req.session.userName,
  });
};

// Log out the user
exports.logout = (req, res, next) => {
  req.session.destroy((err) => {
    if (err) {
      return next(err);
    }

    res.clearCookie("connect.sid", {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    return res.redirect("/login");
  });
};
