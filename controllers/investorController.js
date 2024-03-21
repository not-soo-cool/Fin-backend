import { sendMail } from "../middlewares/sendMail.js";
import { Admin } from "../models/adminModel.js";
import { Customer } from "../models/customerModel.js";
import { Investor } from "../models/investorModel.js"
import crypto from 'crypto'

export const register = async (req, res) => {
    try {

        let admin = await Investor.findById(req.admin._id);

        const {name, email, mob, address, city, state, postal} = req.body;
        const password = "12345678"

        let investor = await Investor.findOne({email});

        if(investor){
            return res.status(400).json({
                success: false,
                message: "Investor already exists",
            })
        }

        investor = await Investor.create({
            name,
            email,
            password,
            mob,
            address,
            city,
            state,
            postal,
        });

        admin.investors.push(investor._id);
        await admin.save();

        res.status(201).json({
            success: true,
            investor,
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

        let investor = await Investor.findById(req.investor._id).select("+password");
        
        if(newPass !== confirmPass){
            return res.status(200).json({
                success: false,
                message: "Input Passwords are different",
            });
        }

        investor.isVerified = false;
        investor.password = newPass;
        await investor.save();

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

        const investor = await Investor.findOne({ email }).select("+password");

        if(!investor){
            return res.status(404).json({
                success: false,
                message: "Investor does not exist"
            })
        }

        const isMatch = await investor.matchPassword(password);

        if(!isMatch){
            return res.status(400).json({
                success: false,
                message: "Invalid Email or Password"
            })
        }

        const token = await investor.generateToken();

        const options = {
            expires: new Date(Date.now() + process.env.COOKIE_EXPIRE*24*60*60*1000),
            httpOnly: true,
            sameSite: "none",
            secure: true,
        }

        res.status(200).cookie("token", token, options).json({
            success: true,
            investor,
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

        const investor = await Investor.findById(req.investor._id);

        res.status(200).json({
            success: true,
            investor
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

        const {name, email, mob, street, city, state, country, postal} = req.body;

        let investor = await Investor.findById(req.investor._id);

        if(name!==investor.name) investor.name = name;
        if(email!==investor.email) investor.email = email;
        if(mob!==investor.mob) investor.mob = mob;
        if(street!==investor.address.street) investor.address.street = street;
        if(city!==investor.address.city) investor.address.city = city;
        if(state!==investor.address.state) investor.address.state = state;
        if(country!==investor.address.country) investor.address.country = country;
        if(postal!==investor.address.postal) investor.address.postal = postal;

        await investor.save();

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

        let investor = await Investor.findById(req.investor._id).select("+password");

        if(newPass !== confirmPass){
            return res.status(200).json({
                success: false,
                message: "Confirm Password is different",
            });
        }

        const isSame = await investor.matchPassword(newPass);

        if(isSame){
            return res.status(400).json({
                success: false,
                message: "New password can not be same as previous",
            });
        }

        investor.password = newPass;
        await investor.save();

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

        let investor = await Investor.findOne({email: req.body.email});

        if(!investor){
            return res.status(200).json({
                success: false,
                message: "Profile not found",
            });
        }

        const resetToken = investor.getResetPasswordToken();

        await investor.save();

        const resetPasswordUrl = `${req.protocol}://${req.get("host")}/api/v1/investor/password/reset/${resetToken}`;

        const message = `Your password reset token is :- \n\n ${resetPasswordUrl} \n\n If you have not requested this email, then please ignore it`;

        try {

            await sendMail({
                email: investor.email,
                subject: "Reset Password",
                message,
            })

            res.status(200).json({
                success:true,
                message: `Email sent to ${investor.email} successfully`,
            })
            
        } catch (error) {
            investor.resetPasswordToken = undefined;
            investor.resetPasswordExpire = undefined;

            await investor.save();

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

        const investor = await Investor.findOne({
            resetPasswordToken,
            resetPasswordExpire: {$gt: Date.now()},
        });

        if(!investor){
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

        investor.password = newPassword;
        investor.resetPasswordToken = undefined;
        investor.resetPasswordExpire = undefined;

        await investor.save();

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

// export const myProfits = async (req, res) => {
//     try {

//         const customer = await Customer.findById(req.params.id);

//         if(!customer){
//             return res.status(200).json({
//                 success: false,
//                 message: "Customer not found"
//             });
//         }

//         const { profits } = req.body
//         customer.profits = profits;
//         await customer.save();

//         res.status(200).json({
//             success: true,
//             message: "Profits added successfully"
//         });
        
//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             message: error.message
//         })
//     }
// }