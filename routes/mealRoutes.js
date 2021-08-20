const express = require("express");
const mealController = require("./../controllers/mealController");
const authController = require('./../controllers/authController');

// Middleware that creates a new router object
const router = express.Router();
  

// Adding HTTP methods to the new router object
router
  .route("/")
  .get(mealController.getAllMeals)
  .post( mealController.createMeal);
router
  .route("/:id")
  .get(mealController.getMeal)
  .patch(mealController.updateMeal)
  .delete(authController.protect,authController.restrictTo('admin'), mealController.deleteMeal);

module.exports = router;
