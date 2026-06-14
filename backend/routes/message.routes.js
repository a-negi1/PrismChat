const router = require("express").Router();
const {
  getMessages,
  markMessagesRead,
  getUnreadCounts,
  reactToMessage,
  searchMessages,
} = require("../controllers/message.controller");

router.get("/search/:userId",            searchMessages);
router.get("/unread/:userId",            getUnreadCounts);
router.get("/:chatId",                  getMessages);
router.post("/:chatId/read",            markMessagesRead);
router.post("/:messageId/react",        reactToMessage);

module.exports = router;
