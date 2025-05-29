const User = require("../models/user");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { promisify } = require("util");
const dotenv = require("dotenv");

const ErrorHandler = require("../utils/errorHandler");
const Email = require("../utils/email");
const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

dotenv.config({ path: "../config/config.env" });

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_TIME + "d",
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_EXPIRES_TIME * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  res.cookie("jwt", token, cookieOptions);

  user.password = undefined;
  res.status(statusCode).json({
    success: true,
    token,
    data: { user },
  });
};
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "avatars",
    transformation: [{ width: 150, crop: "scale" }],
  },
});
const upload = multer({ storage: storage }).single("avatar");

// Register a user   => /api/v1/register

exports.signup = catchAsyncErrors(async (req, res, next) => {
  const { name, email, password, passwordConfirm, phoneNumber } = req.body;

  // Upload avatar to Cloudinary
  const result = await cloudinary.uploader.upload(req.body.avatar, {
    folder: "avatars",
    width: 150,
    crop: "scale",
  });

  // Create user with avatar details
  const user = await User.create({
    name,
    email,
    password,
    passwordConfirm,
    phoneNumber,
    avatar: {
      public_id: result.public_id,
      url: result.secure_url,
    },
  });

  // Send token and user data
  createSendToken(user, 200, res);
});

// Login User => /api/v1/users/login
exports.login = catchAsyncErrors(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new ErrorHandler("Please enter email & password", 400));
  }

  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    return next(new ErrorHandler("Invalid Email or Password", 401));
  }

  const isPasswordMatched = await user.correctPassword(password, user.password);

  if (!isPasswordMatched) {
    return next(new ErrorHandler("Invalid Email or Password", 401));
  }

  createSendToken(user, 200, res);
});

exports.protect = catchAsyncErrors(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new ErrorHandler(
        "You are not logged in! Please log in to get access.",
        404
      )
    );
  }

  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  const currentUser = await User.findById(decoded.id);

  if (!currentUser) {
    return next(
      new ErrorHandler(
        "User recently changed password ! please log in again.",
        404
      )
    );
  }

  if (currentUser.changedPasswordAfter(decoded.iat)) {
    //issued at
    return next(
      new ErrorHandler(
        "User recently changed password ! please log in again.",
        404
      )
    );
  }

  req.user = currentUser;
  next();
});

// Get currently logged in user details   =>   /api/v1/users/me
exports.getUserProfile = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    user,
  });
});

exports.updatePassword = async (req, res, next) => {
  try {
    console.log(req.body);
    const { oldPassword, newPassword, newPasswordConfirm } = req.body;

    const user = await User.findById(req.user.id).select("+password");

    // Checking if the provided old password matches the current password
    const isMatched = await user.correctPassword(oldPassword, user.password);
    if (!isMatched) {
      return next(new ErrorHandler("Old password is incorrect", 400));
    }

    // Update the password fields and save the user
    user.password = newPassword;
    user.passwordConfirm = newPasswordConfirm;
    await user.save();

    // Send a response indicating the password was updated
    res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error(error);
    // Handle any errors and send an appropriate response
    return next(new ErrorHandler("Internal Server Error", 500));
  }
};

// Update user profile   =>   /api/v1/me/users/update
exports.updateProfile = catchAsyncErrors(async (req, res, next) => {
  const newUserData = {
    name: req.body.name,
    email: req.body.email,
  };

  // Update avatar
  if (req.body.avatar !== "") {
    const user = await User.findById(req.user.id);

    const image_id = user.avatar.public_id;
    const res = await cloudinary.uploader.destroy(image_id);

    const result = await cloudinary.uploader.upload(req.body.avatar, {
      folder: "avatars",
      width: 150,
      crop: "scale",
    });

    newUserData.avatar = {
      public_id: result.public_id,
      url: result.secure_url,
    };
  }

  const user = await User.findByIdAndUpdate(req.user.id, newUserData, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  res.status(200).json({
    success: true,
  });
});

//forgotpassword
exports.forgotPassword = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new ErrorHandler("There is no user with email address .", 404));
  }
  const resetToken = user.createPasswordResetToken();

  await user.save({ validateBeforeSave: false });

  try {
    const resetURL = `${process.env.FRONTEND_URL}/users/resetPassword/${resetToken}`;
    await new Email(user, resetURL).sendPasswordReset();
    return res.status(200).json({
      status: "success",
      message: "Token sent to email!",
    });
  } catch (err) {
    // console.log(1, err);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(
      new ErrorHandler(
        "There was an error sending the email, try again later!",
        500
      )
    );
  }
});

//resetPassword
exports.resetPassword = catchAsyncErrors(async (req, res, next) => {
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  if (!user) {
    return next(new ErrorHandler("Token is invalid or has expired", 400));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  createSendToken(user, 200, res);
});

// Logout user   =>   /api/v1/users/logout
exports.logout = catchAsyncErrors(async (req, res, next) => {
  res.cookie("jwt", null, {
    expires: new Date(Date.now()),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    message: "Logged out",
  });
});
