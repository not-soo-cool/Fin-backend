import express from 'express'
import { isCustomerAuthenticated } from '../middlewares/customerAuth.js';
import { isAuthenticated } from '../middlewares/adminAuth.js';
import { forgotPassword, login, logout, myProfile, register, resetPassword, updatePassword, updateProfile, verify } from '../controllers/customerController.js';

export const customerRouter = express.Router();

customerRouter.route("/register").post(isAuthenticated, register);

customerRouter.route("/verify").post(isCustomerAuthenticated, verify);

customerRouter.route("/login").post(login);

customerRouter.route("/me").get(isCustomerAuthenticated, myProfile);

customerRouter.route("/logout").get(logout);

customerRouter.route("/update/profile").put(isCustomerAuthenticated, updateProfile);

customerRouter.route("/update/password/").put(isCustomerAuthenticated, updatePassword);

customerRouter.route("/forgot/password").post(forgotPassword);

customerRouter.route("/password/reset/:token").put(resetPassword);
