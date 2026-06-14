const router = require("express").Router();
const {
  createGroup,
  getUserGroups,
  getGroup,
  renameGroup,
  addMember,
  leaveGroup,
  updateGroupPhoto,
} = require("../controllers/group.controller");

router.post("/",                        createGroup);
router.get("/user/:userId",             getUserGroups);
router.get("/:groupId",                 getGroup);
router.patch("/:groupId/rename",        renameGroup);
router.patch("/:groupId/add",           addMember);
router.patch("/:groupId/leave",         leaveGroup);
router.patch("/:groupId/photo",         updateGroupPhoto);

module.exports = router;