"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.forgotPasswordStepTwo = exports.forgotPasswordStepOne = exports.deleteUser = exports.updateUserRole = exports.getAllUsersDashBoard = exports.updateProfilePicture = exports.updatePassword = exports.updateUserInfo = exports.socialAuth = exports.getUserInfo = exports.updateAccessToken = exports.logoutUser = exports.loginUser = exports.activateUser = exports.createForgotPasswordToken = exports.createActivationToken = exports.registrationUser = void 0;
const user_model_1 = __importDefault(require("../models/user.model"));
const ErrorHandler_1 = __importDefault(require("../utils/ErrorHandler"));
const catchAsyncErrors_1 = require("../middleware/catchAsyncErrors");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const ejs_1 = __importDefault(require("ejs"));
const path_1 = __importDefault(require("path"));
const sendMail_1 = __importDefault(require("../utils/sendMail"));
const jwt_1 = require("../utils/jwt");
const redis_1 = require("../utils/redis");
const user_service_1 = require("../services/user.service");
const cloudinary_1 = __importDefault(require("cloudinary"));
require("dotenv").config();
exports.registrationUser = (0, catchAsyncErrors_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, email, password } = req.body;
        const isEmailExist = yield user_model_1.default.findOne({ email });
        if (isEmailExist) {
            return next(new ErrorHandler_1.default("Email already exist", 500));
        }
        const user = { name, email, password };
        const activationToken = (0, exports.createActivationToken)(user);
        const activationCode = activationToken.activationCode;
        const data = { user: { name: user.name }, activationCode };
        const html = yield ejs_1.default.renderFile(path_1.default.join(__dirname, "../mails/activation-mail.ejs"), data);
        try {
            yield (0, sendMail_1.default)({
                email: user.email,
                subject: "Activate your account",
                template: "activation-mail.ejs",
                data,
            });
            res.status(201).json({
                success: true,
                message: `Please check your email: ${user.email} to activate your account!`,
                activationToken: activationToken.token,
            });
        }
        catch (error) {
            return next(new ErrorHandler_1.default(error.message, 500));
        }
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
const createActivationToken = (user) => {
    // generate random number with 4 digits.
    const activationCode = Math.floor(1000 + Math.random() * 9000).toString();
    const token = jsonwebtoken_1.default.sign({ user, activationCode }, process.env.ACTIVATION_SECRET, { expiresIn: "5m" });
    return { token, activationCode };
};
exports.createActivationToken = createActivationToken;
const createForgotPasswordToken = (user) => {
    // generate random number 15 digits.
    const forgotPasswordCode = Math.floor(Math.random() * 9000000000000000) +
        (1000000000000000).toString();
    const forgotPasswordToken = jsonwebtoken_1.default.sign({ user, forgotPasswordCode }, process.env.FORGOT_PASSWORD_SECRET, { expiresIn: "10m" });
    return { forgotPasswordToken };
};
exports.createForgotPasswordToken = createForgotPasswordToken;
exports.activateUser = (0, catchAsyncErrors_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { activation_token, activation_code } = req.body;
        const newUser = jsonwebtoken_1.default.verify(activation_token, process.env.ACTIVATION_SECRET);
        if (newUser.activationCode !== activation_code) {
            return next(new ErrorHandler_1.default("Invalid activation code", 400));
        }
        const { name, email, password } = newUser.user;
        const existUser = yield user_model_1.default.findOne({ email });
        if (existUser) {
            return next(new ErrorHandler_1.default("Email already exist", 400));
        }
        const user = yield user_model_1.default.create({ name, email, password });
        res.status(201).json({ success: true });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
}));
exports.loginUser = (0, catchAsyncErrors_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return next(new ErrorHandler_1.default("Please enter email and password", 400));
        }
        const user = yield user_model_1.default.findOne({ email }).select("+password");
        if (!user) {
            return next(new ErrorHandler_1.default("Invalid email or password", 400));
        }
        const isPasswordMatch = yield user.comparePassword(password);
        if (!isPasswordMatch) {
            return next(new ErrorHandler_1.default("Invalid email or password", 400));
        }
        (0, jwt_1.sendToken)(user, 200, res);
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
}));
// logout user
exports.logoutUser = (0, catchAsyncErrors_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        res.cookie("access_token", "", { maxAge: 1 });
        res.cookie("refresh_token", "", { maxAge: 1 });
        const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a._id) || "";
        redis_1.redis.del(userId);
        res
            .status(200)
            .json({ success: true, message: "Logged out successfully" });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
}));
// update access token
exports.updateAccessToken = (0, catchAsyncErrors_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const refresh_token = req.cookies.refresh_token;
        const decoded = jsonwebtoken_1.default.verify(refresh_token, process.env.REFRESH_TOKEN);
        const message = "Could not refresh token";
        if (!decoded) {
            return next(new ErrorHandler_1.default(message, 400));
        }
        const session = yield redis_1.redis.get(decoded.id);
        if (!session) {
            return next(new ErrorHandler_1.default("Please login to access this resource", 400));
        }
        const user = JSON.parse(session);
        const accessToken = jsonwebtoken_1.default.sign({ id: user._id }, process.env.ACCESS_TOKEN, { expiresIn: "5m" });
        const refreshToken = jsonwebtoken_1.default.sign({ id: user._id }, process.env.REFRESH_TOKEN, { expiresIn: "3d" });
        req.user = user;
        res.cookie("access_token", accessToken, jwt_1.accessTokenOptions);
        res.cookie("refresh_token", refreshToken, jwt_1.refreshTokenOptions);
        // 604800 = 7 days
        yield redis_1.redis.set(user._id, JSON.stringify(user), "EX", 604800);
        // it's only a middleware no need to send response
        // res.status(200).json({ status: "success", accessToken });
        return next();
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
}));
// get user info
exports.getUserInfo = (0, catchAsyncErrors_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    try {
        const userId = (_b = req.user) === null || _b === void 0 ? void 0 : _b._id;
        yield (0, user_service_1.getUserById)(userId, res);
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
}));
// social auth
exports.socialAuth = (0, catchAsyncErrors_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, name, avatar } = req.body;
        const user = yield user_model_1.default.findOne({ email });
        if (user && user.password) {
            res.status(500).json({ success: false, message: "We have this mai" });
        }
        if (!user) {
            const newUser = yield user_model_1.default.create({ email, name, avatar });
            (0, jwt_1.sendToken)(newUser, 200, res);
        }
        else {
            (0, jwt_1.sendToken)(user, 200, res);
        }
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
}));
exports.updateUserInfo = (0, catchAsyncErrors_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _c;
    try {
        const { name } = req.body;
        const userId = (_c = req.user) === null || _c === void 0 ? void 0 : _c._id;
        const user = yield user_model_1.default.findById(userId);
        // if (email && user) {
        //   const isEmailExist = await userModel.findOne({ email });
        //   if (isEmailExist) {
        //     return next(new ErrorHandler("Email already exist", 400));
        //   }
        //   user.email = email;
        // }
        if (name && user) {
            user.name = name;
        }
        yield (user === null || user === void 0 ? void 0 : user.save());
        yield redis_1.redis.set(userId, JSON.stringify(user));
        res.status(201).json({ success: true, user });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
}));
exports.updatePassword = (0, catchAsyncErrors_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _d, _e;
    try {
        const { oldPassword, newPassword } = req.body;
        if (!oldPassword || !newPassword) {
            return next(new ErrorHandler_1.default("Please enter old and new password", 400));
        }
        const user = yield user_model_1.default.findById((_d = req.user) === null || _d === void 0 ? void 0 : _d._id).select("+password");
        // in case it is auth social created account, it had no password
        if ((user === null || user === void 0 ? void 0 : user.password) === undefined) {
            return next(new ErrorHandler_1.default("Invalid User", 400));
        }
        const isPasswordMatch = yield (user === null || user === void 0 ? void 0 : user.comparePassword(oldPassword));
        if (!isPasswordMatch) {
            return next(new ErrorHandler_1.default("Invalid old password", 400));
        }
        user.password = newPassword;
        yield user.save();
        yield redis_1.redis.set((_e = req.user) === null || _e === void 0 ? void 0 : _e._id, JSON.stringify(user));
        res.status(201).json({ success: true, user });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
}));
// update profile picture
exports.updateProfilePicture = (0, catchAsyncErrors_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _f, _g, _h;
    try {
        const { avatar } = req.body;
        const userId = (_f = req.user) === null || _f === void 0 ? void 0 : _f._id;
        const user = yield user_model_1.default.findById(userId);
        if (avatar && user) {
            // if user have one avatar then:
            if ((_g = user === null || user === void 0 ? void 0 : user.avatar) === null || _g === void 0 ? void 0 : _g.public_id) {
                // first delete the previous profile picture
                yield cloudinary_1.default.v2.uploader.destroy((_h = user === null || user === void 0 ? void 0 : user.avatar) === null || _h === void 0 ? void 0 : _h.public_id);
            }
            // no matter if user had or not profile picture now we are uploading to the cloud his new picture
            const myCloud = yield cloudinary_1.default.v2.uploader.upload(avatar, {
                folder: "avatars",
                width: 150,
            });
            user.avatar = {
                public_id: myCloud.public_id,
                url: myCloud.secure_url,
            };
        }
        yield (user === null || user === void 0 ? void 0 : user.save());
        yield redis_1.redis.set(userId, JSON.stringify(user));
        res.status(200).json({ success: true, user });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
}));
// get all users --- only for admin
exports.getAllUsersDashBoard = (0, catchAsyncErrors_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        (0, user_service_1.getAllUsersServiceFunc)(res);
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
// update user role --- only for admin
exports.updateUserRole = (0, catchAsyncErrors_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, role } = req.body;
        const user = yield user_model_1.default.findOne({ email });
        if (user) {
            const userId = user._id;
            (0, user_service_1.updateUserRoleService)(res, userId, role);
        }
        else {
            res.status(404).json({ success: false, message: "User not found" });
        }
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
// delete User --- only for admin
exports.deleteUser = (0, catchAsyncErrors_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const user = yield user_model_1.default.findById(id);
        if (!user) {
            return next(new ErrorHandler_1.default("User not found!", 404));
        }
        yield user.deleteOne({ id });
        yield redis_1.redis.del(id);
        res
            .status(200)
            .json({ success: true, message: "User deleted successfully" });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
// forgotPasswordStep1
exports.forgotPasswordStepOne = (0, catchAsyncErrors_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email } = req.body;
        const user = yield user_model_1.default
            .findOne({ email })
            .select("+forgotPasswordRequestsThatHour +lastTimeRequestedForgetPassword +forgotPasswordStep");
        if (!user) {
            return next(new ErrorHandler_1.default("user with that mail not in our systems.", 500));
        }
        const currentDate = new Date();
        const oneHourInMilliseconds = 60 * 60 * 1000; // Number of milliseconds in an hour
        // Calculate the absolute difference between the two dates
        const timeDifference = currentDate.getTime() - user.lastTimeRequestedForgetPassword.getTime();
        // Check if the absolute difference is greater than one day
        if (timeDifference > oneHourInMilliseconds) {
            user.forgotPasswordRequestsThatHour = 0;
        }
        if (user.forgotPasswordRequestsThatHour >= 3) {
            return next(new ErrorHandler_1.default("You have done too many forgot password requests in this hour, try again one more hour.", 500));
        }
        user.forgotPasswordRequestsThatHour += 1;
        user.lastTimeRequestedForgetPassword = currentDate;
        user.forgotPasswordStep = 1;
        const forgotPasswordToken = (0, exports.createForgotPasswordToken)(user);
        const customizedLink = `http://localhost:8000/api/v1/forgot-password/${forgotPasswordToken.forgotPasswordToken}`;
        const data = { user: { name: user.name }, customizedLink };
        const html = yield ejs_1.default.renderFile(path_1.default.join(__dirname, "../mails/forgot-password-mail.ejs"), data);
        yield user.save();
        yield (0, sendMail_1.default)({
            email: user.email,
            subject: "WeLearn - Forgot Password",
            template: "forgot-password-mail.ejs",
            data,
        });
        res.status(201).json({
            success: true,
            message: `If we do have this mail in our systems, we sent there the next step in the process of 'forgot password' procedure!`,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
// second step of forget password
exports.forgotPasswordStepTwo = (0, catchAsyncErrors_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { forgotPasswordToken } = req.params;
        const newUser = jsonwebtoken_1.default.verify(forgotPasswordToken, process.env.FORGOT_PASSWORD_SECRET);
        if (!newUser) {
            return next(new ErrorHandler_1.default("You have no permissions to access this resource", 500));
        }
        // generate random password 12 digits.
        const newPW = generateRandomString(12);
        const { email } = newUser.user;
        const user = yield user_model_1.default
            .findOne({ email: email })
            .select("+forgotPasswordRequestsThatHour +lastTimeRequestedForgetPassword +forgotPasswordStep");
        console.log("email: ", email);
        console.log("user: ", user);
        if (!user || user.forgotPasswordStep !== 1) {
            return next(new ErrorHandler_1.default("An error occured!", 404));
        }
        user.forgotPasswordStep = 0;
        user.password = newPW;
        yield user.save();
        const data = { user: { name: user.name }, newPW };
        const html = yield ejs_1.default.renderFile(path_1.default.join(__dirname, "../mails/forgot-password-second-mail.ejs"), data);
        yield (0, sendMail_1.default)({
            email: user.email,
            subject: "WeLearn - New Password",
            template: "forgot-password-second-mail.ejs",
            data,
        });
        res.status(201).json({
            success: true,
            message: `New Password was sent to your email!`,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
function generateRandomString(length) {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let randomString = "";
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        randomString += characters.charAt(randomIndex);
    }
    return randomString;
}
