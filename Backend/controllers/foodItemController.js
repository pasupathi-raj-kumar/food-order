const Fooditem = require("../models/foodItem");
const ErrorHandler = require("../utils/errorHandler");
const catchAsync = require("../middlewares/catchAsyncErrors");
const APIFeatures = require("../utils/apiFeatures");

exports.getAllFoodItems = catchAsync(async (req, res, next) => {
  let restaurantId = {};
  if (req.params.storeId) {
    restaurantId = { restaurant: req.params.storeId };
  }

  const foodItems = await Fooditem.find(restaurantId);
  const apiFeatures = new APIFeatures(Fooditem.find(), req.query)
    .search()
    .filter();
  res.status(200).json({
    status: "success",
    results: foodItems.length,
    data: foodItems,
  });
});

// /v1/eats/stores/{store_id}/menus
exports.createFoodItem = catchAsync(async (req, res, next) => {
  const fooditem = await Fooditem.create(req.body);
  res.status(201).json({
    status: "success",
    data: fooditem,
  });
});

exports.getFoodItem = catchAsync(async (req, res, next) => {
  const foodItem = await Fooditem.findById(req.params.foodId);

  if (!foodItem)
    return next(new ErrorHandler("No foodItem found with that ID", 404));

  res.status(200).json({
    status: "success",
    data: foodItem,
  });
});

exports.updateFoodItem = catchAsync(async (req, res, next) => {
  const foodItem = await Fooditem.findByIdAndUpdate(
    req.params.foodId,
    req.body,
    {
      new: true,
      runValidators: true,
    }
  );

  if (!foodItem)
    return next(new ErrorHandler("No document found with that ID", 404));

  res.status(200).json({
    status: "success",
    data: foodItem,
  });
});

exports.deleteFoodItem = catchAsync(async (req, res, next) => {
  const foodItem = await Fooditem.findByIdAndDelete(req.params.foodId);

  if (!foodItem)
    return next(new ErrorHandler("No document found with that ID", 404));

  res.status(204).json({
    status: "success",
  });
});
