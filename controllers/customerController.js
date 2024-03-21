import { sendMail } from "../middlewares/sendMail.js";
import { Admin } from "../models/adminModel.js";
import { Customer } from "../models/customerModel.js"
import crypto from 'crypto'

export const register = async (req, res) => {
    try {

        let admin = await Admin.findById(req.admin._id);

        const {name, email, mob, address, city, state, postal} = req.body;
        const password = "12345678"

        let customer = await Customer.findOne({email});

        if(customer){
            return res.status(400).json({
                success: false,
                message: "Customer already exists",
            })
        }

        customer = await Customer.create({
            name,
            email,
            password,
            mob,
            address,
            city,
            state,
            postal,
        });

        admin.customers.push(customer._id);
        await admin.save();

        res.status(201).json({
            success: true,
            customer,
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        })
    }
}

export const verify = async (req, res) => {
    try {

        const {newPass, confirmPass} = req.body;

        let customer = await Customer.findById(req.customer._id).select("+password");
        
        if(newPass !== confirmPass){
            return res.status(200).json({
                success: false,
                message: "Input Passwords are different",
            });
        }

        customer.isVerified = false;
        customer.password = newPass;
        await customer.save();

        res.status(200).json({
            success: true,
            message: "Password changed successfully"
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        })
    }
}

export const login = async (req, res) => {
    try {

        const {email, password} = req.body;

        if(!email || !password){
            return res.status(400).json({
                success: false,
                message: "Enter both Email and Password"
            })
        }

        const customer = await Customer.findOne({ email }).select("+password");

        if(!customer){
            return res.status(404).json({
                success: false,
                message: "Customer does not exist"
            })
        }

        const isMatch = await customer.matchPassword(password);

        if(!isMatch){
            return res.status(400).json({
                success: false,
                message: "Invalid Email or Password"
            })
        }

        const token = await customer.generateToken();

        const options = {
            expires: new Date(Date.now() + process.env.COOKIE_EXPIRE*24*60*60*1000),
            httpOnly: true,
            sameSite: "none",
            secure: true,
        }

        res.status(200).cookie("token", token, options).json({
            success: true,
            customer,
            token,
        });
        
    } catch (e) {
        res.status(500).json({
            success: false,
            message: e.message,
        })
        
    }
}

export const myProfile = async (req, res) => {
    try {

        const customer = await Customer.findById(req.customer._id);

        res.status(200).json({
            success: true,
            customer
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

export const logout = async (req, res) => {
    try {

        res.status(200).cookie("token", null, {
            expires: new Date(Date.now()),
            httpOnly: true,
            sameSite: "none",
            secure: true,
        }).json({
            success: true,
            message: "Logged out successfuly"
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

export const updateProfile = async (req, res) => {
    try {

        const {name, email, mob} = req.body;

        let customer = await Customer.findById(req.customer._id);

        if(name) customer.name = name;
        if(email) customer.email = email;
        if(mob) customer.mob = mob;

        await customer.save();

        res.status(200).json({
            success: true,
            message: "Profile Updated Successfully",
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

export const updatePassword = async (req, res) => {
    try {

        const {newPass, confirmPass} = req.body;

        let customer = await Customer.findById(req.customer._id).select("+password");

        if(newPass !== confirmPass){
            return res.status(200).json({
                success: false,
                message: "Confirm Password is different",
            });
        }

        const isSame = await customer.matchPassword(newPass);

        if(isSame){
            return res.status(400).json({
                success: false,
                message: "New password can not be same as previous",
            });
        }

        customer.password = newPass;
        await customer.save();

        res.status(200).json({
            success: true,
            message: "Password Updated Successfully",
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

export const forgotPassword = async (req, res) => {
    try {

        let customer = await Customer.findOne({email: req.body.email});

        if(!customer){
            return res.status(200).json({
                success: false,
                message: "Profile not found",
            });
        }

        const resetToken = customer.getResetPasswordToken();

        await customer.save();

        const resetPasswordUrl = `${req.protocol}://${req.get("host")}/api/v1/customer/password/reset/${resetToken}`;

        const message = `Your password reset token is :- \n\n ${resetPasswordUrl} \n\n If you have not requested this email, then please ignore it`;

        try {

            await sendMail({
                email: customer.email,
                subject: "Reset Password",
                message,
            })

            res.status(200).json({
                success:true,
                message: `Email sent to ${customer.email} successfully`,
            })
            
        } catch (error) {
            customer.resetPasswordToken = undefined;
            customer.resetPasswordExpire = undefined;

            await customer.save();

            res.status(500).json({
                success: false,
                message: error.message
            })
        }
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

export const resetPassword = async (req, res) => {

    try {

        const resetPasswordToken = crypto.createHash("sha256").update(req.params.token).digest("hex");

        const customer = await Customer.findOne({
            resetPasswordToken,
            resetPasswordExpire: {$gt: Date.now()},
        });

        if(!customer){
            return res.status(404).json({
                success: false,
                message: "Reset Password Token is invalid or has been expired"
            });
        }

        const { newPassword, confirmPassword } = req.body;
        if(newPassword !== confirmPassword){
            return res.status(401).json({
                success: false,
                message: "Pasword Does not match"
            });
        }

        customer.password = newPassword;
        customer.resetPasswordToken = undefined;
        customer.resetPasswordExpire = undefined;

        await customer.save();

        res.status(200).json({
            success: true,
            message: "Password has been updated successfully",
        })
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

