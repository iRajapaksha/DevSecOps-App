const express = require("express");
const { body } = require("express-validator");
const authMiddleware = require("../middleware/authMiddleware");
const { register, login, protectedRoute } = require("../controllers/authController");

const router = express.Router();

router.post(
  "/register",
  [
    body("email").isEmail(),
    body("password").isLength({ min: 6 })
  ],
  register
);

router.post(
  "/login",
  [
    body("email").isEmail(),
    body("password").exists()
  ],
  login
);

router.get("/protected", authMiddleware, protectedRoute);

module.exports = router;
