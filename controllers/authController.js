const crypto = require("crypto");
const { promisify } = require("util");
const User = require("./../models/userModel");
const catchAsync = require("./../utils/catchAsync");
const AppError = require("./../utils/appError");
const sendEmail = require("./../utils/email");
const jwt = require("jsonwebtoken");

// creates a JWT token
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

// Takes the token and returns a response object to the output
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === "production") cookieOptions.secure = true;
  res.cookie("jwt", token, cookieOptions);

  user.password = undefined;
  
  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });

  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // Check if email and password exists
  if (!email || !password) {
    return next(new AppError("Please provide email and password!", 400));
  }

  // Check if user exists and password is correct
  const user = await User.findOne({ email }).select("+password");
  console.log(user);

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError("Incorrect user and password!", 401));
  }

  // If everything ok, send token to the client
  createSendToken(user, 200, res);
});

exports.protect = catchAsync(async (req, res, next) => {
  // 1. Getting token and checking if its there
  let token;
  //Whenever the user wants to access a protected route, it should send the JWT,
  // typically in the Authorization header using the Bearer schema.
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    // 401 -> unauthorized
    return next(
      new AppError("You are not logged in. Please log in to get access.", 401)
    );
  }

  // 2. Verification token -> to check if an invalid token is sent
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  // Check if the user still exists -> if the user changed its password
  // but the old token still exists.
  //  SO the old token could be used for unauthorized access.
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    next(
      new AppError("The user belonging to the token no longer exists.", 401)
    );
  }
  // 4. Check if the user has recently changed the password
  if (currentUser.passwordChangedAfter(decoded.iat)) {
    return next(
      new AppError("User recently changed password. Please login again!", 401)
    );
  }
  console.log(currentUser);

  // Grants access to the protected route
  req.user = currentUser; // authorized user
  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes()) {
      return next(
        // 403 -> forbidden
        new AppError("You do not have permission to perform this action.", 403)
      );
    }
  }; 
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // Get user based on POST email
  const user = await User.findOne({ email: req.body.email }).select(
    "+password"
  );
  if (!user) {
    return next(new AppError("There is no user with email address", 404));
  }

  // Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });
  console.log(user);
  // Send it to user's email
  const resetURL = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot your password? Submit a patch request to this 
  new password and password confirm to ${resetURL}.
  If you didn't forgot your password, please ignore this email.`;

  try {
    await sendEmail({
      email: user.email,
      subject: "Your password is valid for 10 mins!!",
      message,
    });

    res.status(200).json({
      status: "success",
      message: "Token sent to email!",
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    console.error(err);

    return next(
      new AppError(
        "There was an error sending the email. Try again later!",
        500
      )
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1. Get user based on the token
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // 2. If token has not expired, and there is user, set the new password
  if (!user) {
    return next(new AppError("Token is invalid or expired!", 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // 3. Update changedPasswordAt property for the user

  // 4. Log the user in, send the JWT
  createSendToken(user, 200, res);
});

// Change the current password while logged in as a user
exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1. Get user from collection
  const user = await User.findById(req.user.id).select("+password");

  // 2. Check if posted current password is correct
  if (!(await user.correctPassword(req.body.currentPassword, user.password))) {
    return next(
      new AppError("Your password is incorrect.Please try again!", 401)
    );
  }

  // 3. If so, update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  // 4. Log user in, send JWT
  createSendToken(user, 200, res);
});
