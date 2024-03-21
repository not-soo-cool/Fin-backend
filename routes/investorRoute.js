import express from 'express'
import { forgotPassword, login, logout, myProfile, register, resetPassword, updatePassword, updateProfile, verify } from '../controllers/investorController.js';
import { isInvestorAuthenticated } from '../middlewares/investorAuth.js';
import { isAuthenticated } from '../middlewares/adminAuth.js';

export const investorRouter = express.Router();

investorRouter.route("/register").post(isAuthenticated, register);

investorRouter.route("/verify").post(isInvestorAuthenticated, verify);

investorRouter.route("/login").post(login);

investorRouter.route("/me").get(isInvestorAuthenticated, myProfile);

investorRouter.route("/logout").get(logout);

investorRouter.route("/update/profile").put(isInvestorAuthenticated, updateProfile);

investorRouter.route("/update/password").put(isInvestorAuthenticated, updatePassword);

investorRouter.route("/forgot/password").post(forgotPassword);

investorRouter.route("/password/reset/:token").put(resetPassword);

// investorRouter.route("/add/profit/:id").put(isAuthenticated, myProfits);