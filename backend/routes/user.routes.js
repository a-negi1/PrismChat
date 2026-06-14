const router = require("express").Router();
const { searchUsers, getUserChats, updateUserPhoto, updateUserName } = require("../controllers/user.controller");

router.get("/search", searchUsers);
router.get("/:id/chats", getUserChats);
router.post("/:id/photo", updateUserPhoto);
router.post("/:id/name", updateUserName);

module.exports = router;
