import express from 'express'
import { addCustomer, addInvestor, afterDueCustomers, contact, deleteCustomer, forgotPassword, getAllCustomers, getAllInvestors, getCustomer, getInvestor, login, logout, myProfile, register, resetPassword, updateCustomer, updateInvestor, updatePassword, updatePrevAdmin, updatePrevInvestors, updateProfile } from '../controllers/adminController.js';
import { isAdminOrInvestorAuthenticated, isAnyAuthenticated, isAuthenticated } from '../middlewares/adminAuth.js';
import { addInstalment, getAllInstalments, getInstalment, getUserInstalments } from '../controllers/instalmentController.js';
import { addWithdrawl, getAllWithdrawls, getUserWithdrawls, getWithdrawl } from '../controllers/withdrawlController.js';
import { isInvestorAuthenticated } from '../middlewares/investorAuth.js';

export const adminRouter = express.Router();

adminRouter.route("/register").post(register);

adminRouter.route("/login").post(login);

adminRouter.route("/me").get(isAuthenticated, myProfile);

adminRouter.route("/logout").get(logout);

adminRouter.route("/update/profile").put(isAuthenticated, updateProfile);

adminRouter.route("/update/password").put(isAuthenticated, updatePassword);

adminRouter.route("/forgot/password").post(forgotPassword);

adminRouter.route("/password/reset/:token").put(resetPassword);

adminRouter.route("/contact").post(contact);


// Customer routing
adminRouter.route("/add/customer").post(isAuthenticated, addCustomer);

adminRouter.route("/get/customers").get(isAdminOrInvestorAuthenticated, getAllCustomers);

adminRouter.route("/update/customer").put(isAuthenticated, updateCustomer);

adminRouter.route("/get/customer/:id").get(isAuthenticated, getCustomer);

adminRouter.route("/delete/customer/:id").delete(isAuthenticated, deleteCustomer);


// Instalment routing
adminRouter.route("/add/instalment").post(isAuthenticated, addInstalment);

adminRouter.route("/get/instalments").get(isAuthenticated, getAllInstalments);

adminRouter.route("/user/instalments/:id").get(isAnyAuthenticated, getUserInstalments);

adminRouter.route("/get/instalment/:id").get(isAuthenticated, getInstalment);

adminRouter.route("/due/customers").get(isAuthenticated, afterDueCustomers);

// Investor routing
adminRouter.route("/add/investor").post(isAuthenticated, addInvestor);

adminRouter.route("/get/investors").get(isAuthenticated, getAllInvestors);

adminRouter.route("/get/investor/:id").get(isAuthenticated, getInvestor);

adminRouter.route("/update/investor").put(isAuthenticated, updateInvestor);

adminRouter.route("/up/admin").get(isAuthenticated, updatePrevAdmin);

adminRouter.route("/up/investors").get(isAdminOrInvestorAuthenticated, updatePrevInvestors);


// Withdrawl routing
adminRouter.route("/add/withdrawl").post(isAuthenticated, addWithdrawl);

adminRouter.route("/get/withdrawls").get(isAuthenticated, getAllWithdrawls);

adminRouter.route("/user/withdrawls/:id").get(isAuthenticated, getUserWithdrawls);

adminRouter.route("/get/withdrawl/:id").get(isAuthenticated, getWithdrawl);

// adminRouter.route("/up/all").put(upAdmin);