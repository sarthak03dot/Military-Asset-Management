const pool = require("../config");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { logAudit } = require("../middleware/loggingMiddleware"); // Import logging utility

exports.registerUser = async (req, res) => {
  const { username, password, email, role, base_id } = req.body;
  const registeringAdminId = req.user ? req.user.user_id : null;

  if (!username || !password || !email || !role) {
    return res
      .status(400)
      .json({
        message:
          "Please enter all required fields: username, password, email, role",
      });
  }

  const validRoles = ["admin", "base_commander", "logistics_officer"];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ message: "Invalid role specified." });
  }

  if (role === "base_commander" && !base_id) {
    return res
      .status(400)
      .json({ message: "Base ID is required for base commanders." });
  }

  try {
    const userExists = await pool.query(
      "SELECT * FROM users WHERE username = $1 OR email = $2",
      [username, email]
    );
    if (userExists.rows.length > 0) {
      return res
        .status(400)
        .json({ message: "User with that username or email already exists." });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await pool.query(
      "INSERT INTO users (username, password_hash, email, role, base_id) VALUES ($1, $2, $3, $4, $5) RETURNING user_id, username, email, role, base_id",
      [username, passwordHash, email, role, base_id]
    );

    await logAudit(
      registeringAdminId,
      "USER_REGISTERED",
      "user",
      newUser.rows[0].user_id,
      {
        username: newUser.rows[0].username,
        role: newUser.rows[0].role,
      },
      req.ip
    );

    res.status(201).json({
      message: "User registered successfully",
      user: {
        user_id: newUser.rows[0].user_id,
        username: newUser.rows[0].username,
        email: newUser.rows[0].email,
        role: newUser.rows[0].role,
        base_id: newUser.rows[0].base_id,
      },
    });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({ message: "Server error during registration." });
  }
};

exports.loginUser = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ message: "Please enter username and password" });
  }

  try {
    const userResult = await pool.query(
      "SELECT * FROM users WHERE username = $1",
      [username]
    );
    const user = userResult.rows[0];

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials." });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials." });
    }

    const token = jwt.sign(
      { user_id: user.user_id, role: user.role, base_id: user.base_id },
      process.env.JWT_SECRET,
      { expiresIn: "1h" } // Token expires in 1 hour
    );

    await logAudit(
      user.user_id,
      "USER_LOGIN",
      "user",
      user.user_id,
      {
        username: user.username,
        role: user.role,
      },
      req.ip
    );

    res.json({
      message: "Logged in successfully",
      token,
      user: {
        user_id: user.user_id,
        username: user.username,
        email: user.email,
        role: user.role,
        base_id: user.base_id,
      },
    });
  } catch (error) {
    console.error("Error logging in user:", error);
    res.status(500).json({ message: "Server error during login." });
  }
};
