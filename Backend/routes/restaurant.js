const express = require("express");
const router = express.Router({ mergeParams: true });

const {
  getAllRestaurants,
  createRestaurant,
  getRestaurant,
  deleteRestaurant,
} = require("../controllers/restaurantController");

const menuRoutes = require("./menu");

router.route("/").get(getAllRestaurants).post(createRestaurant);

router.route("/:storeId").get(getRestaurant).delete(deleteRestaurant);

router.use("/:storeId/menus", menuRoutes);

module.exports = router;
