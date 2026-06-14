const router = require("express").Router();
const { verifyToken } = require("../controllers/auth.controller");


router.post("/verify", verifyToken);

module.exports = router;
