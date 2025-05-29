const express = require("express");
const router = express.Router({ mergeParams: true });
const {
  getAllMenus,
  createMenu,
  deleteMenu,
} = require("../controllers/menuController");

router.route("/").get(getAllMenus).post(createMenu);

router.route("/:menuId").delete(deleteMenu);

module.exports = router;
