const AppError = require("../utils/appError");
const Meal = require("./../models/mealModel");
const APIFeatures = require('./../utils/APIFeatures');
const catchAsync = require('./../utils/catchAsync');



exports.getAllMeals = catchAsync(async (req, res, next) => {
  // Build query 

  // query after chaining all the queries above
  const features = new APIFeatures(Meal.find(), req.query)
    // .filter()
    .sort()
    .limitFields()
    .paginate();
  const meals = await features.query;

  res.status(200).json({
    status: "success",
    results: meals.length,
    data: {
      meals,
    },
  });
})


exports.getMeal = catchAsync(async (req, res, next) => {
  console.log(req.params);
  const meal = await Meal.findById(req.params.id);

  if (!meal) {
    return next(new AppError('No meal found with that ID', 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      meal,
    },
  });
})

exports.createMeal = catchAsync(async (req, res, next) => {
  const newMeal = await Meal.create(req.body);

  res.status(201).json({
    status: "success",
    data: {
      meal: newMeal,
    },
  });
});

exports.updateMeal = catchAsync(async (req, res, next) => {
  const meal = await Meal.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!meal) {
    next(new AppError('Cannot find meal with that ID', 404));
  }

  res.status(200).json({
    status: "success",
    meal,
  });
});

exports.deleteMeal = catchAsync(async (req, res, next) => {
  await Meal.findByIdAndDelete(req.params.id);
  if (!meal) {
    next(new AppError('Cannot find meal with that ID', 404));
  }
  res.status(204).json({
    status: 'success',
    data: null
  });
});
