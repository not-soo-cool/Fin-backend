import { sendMail } from "../middlewares/sendMail.js";
import { Admin } from "../models/adminModel.js"
import crypto from 'crypto'
import { Customer } from "../models/customerModel.js";
import { Investor } from "../models/investorModel.js";
import { Instalment } from "../models/instalmentModel.js";
import { Notification } from "../models/notificationModel.js";

export const register = async (req, res) => {
    try {
        const { name, email, password, mob, profits, receivedInstal, expectedInstal } = req.body;

        let admin = await Admin.findOne({email});

        if(admin){
            return res.status(400).json({
                success: false,
                message: "User already exists",
            })
        }

        admin = await Admin.create({
            name,
            email,
            password,
            mob,
            profits,
            receivedInstal,
            expectedInstal
        });

        const token = await admin.generateToken();

        const options = {
            expires: new Date(Date.now() + 90*24*60*60*1000),
            httpOnly: true,
            sameSite: "none",
            secure: true,
        }

        res.status(201).cookie("token", token, options).json({
            success: true,
            admin,
            token,
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

        const admin = await Admin.findOne({ email }).select("+password");

        if(!admin){
            return res.status(404).json({
                success: false,
                message: "User does not exist"
            })
        }

        const isMatch = await admin.matchPassword(password);

        if(!isMatch){
            return res.status(400).json({
                success: false,
                message: "Invalid Email or Password"
            })
        }

        const token = await admin.generateToken();

        const options = {
            expires: new Date(Date.now() + process.env.COOKIE_EXPIRE*24*60*60*1000),
            httpOnly: true,
            sameSite: "None",
            secure: true,
        }

        res.status(200).cookie("token", token, options).json({
            success: true,
            message: "Logged In Successfully"
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

        const admin = await Admin.findById(req.admin._id);

        res.status(200).json({
            success: true,
            admin
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

        let admin = await Admin.findById(req.admin._id);

        if(name!==admin.name) admin.name = name;
        if(email!==admin.email) admin.email = email;
        if(mob!==admin.mob) admin.mob = mob;
        if(street!==admin.address.street) admin.address.street = street;
        if(city!==admin.address.city) admin.address.city = city;
        if(state!==admin.address.state) admin.address.state = state;
        if(country!==admin.address.country) admin.address.country = country;
        if(postal!==admin.address.postal) admin.address.postal = postal;

        await admin.save();

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

        let admin = await Admin.findById(req.admin._id).select("+password");

        if(newPass !== confirmPass){
            return res.status(400).json({
                success: false,
                message: "Confirm Password is different",
            });
        }

        // const isSame = await admin.matchPassword(newPass);

        // if(isSame){
        //     return res.status(400).json({
        //         success: false,
        //         message: "New password can not be same as previous",
        //     });
        // }

        admin.password = newPass;
        await admin.save();

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

        let admin = await Admin.findOne({email: req.body.email});

        if(!admin){
            return res.status(200).json({
                success: false,
                message: "Profile not found",
            });
        }

        const resetToken = admin.getResetPasswordToken();

        await admin.save();

        const resetPasswordUrl = `${req.protocol}://${req.get("host")}/api/v1/admin/password/reset/${resetToken}`;

        const message = `Your password reset token is :- \n\n ${resetPasswordUrl} \n\n If you have not requested this email, then please ignore it`;

        try {

            await sendMail({
                email: admin.email,
                subject: "Reset Password",
                message,
            })

            res.status(200).json({
                success:true,
                message: `Email sent to ${admin.email} successfully`,
            })
            
        } catch (error) {
            admin.resetPasswordToken = undefined;
            admin.resetPasswordExpire = undefined;

            await admin.save();

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

        const admin = await Admin.findOne({
            resetPasswordToken,
            resetPasswordExpire: {$gt: Date.now()},
        });

        if(!admin){
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

        admin.password = newPassword;
        admin.resetPasswordToken = undefined;
        admin.resetPasswordExpire = undefined;

        await admin.save();

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

export const contact = async (req, res) => {
    try {
      const { name, email, num, subj, msg } = req.body;
  
      const message = `Hey, I am ${name}. My email is ${email} and my number is ${num}. In case you don't have time to read the full email, the subejct of the email is: ${subj}. And my full message is ${msg}.`;
  
      await sendMail({
        email,
        message,
      });
  
      return res.status(200).json({
        success: true,
        message: "Message Sent Successfully",
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
};


// Customer controller actions
export const addCustomer = async (req, res) => {
    try {

        let admin = await Admin.findById(req.admin._id);

        const {firstName, lastName, email, mob, street, city, state, country, postal, dob, gender, aadhar, emiDate, guarantorName, guarantorAdd, guarantorPh, prodName, prodPrice, downPay, finAmount, mon, roi, invEmail} = req.body;

        const instals = [
            {
                year: 2023,
                month: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
            },
            {
                year: 2024,
                month: [0, 0, 0]
            },
        ]

        let customer = await Customer.findOne({email});
        let investor = await Investor.findOne({email: invEmail});
        const interest = Number(Number(finAmount*roi*mon)/100).toFixed(0);
        const ipm = Number(interest)/Number(mon)
        const emi = Number((Number(finAmount) + Number(interest))/mon).toFixed(0);
        const today = new Date();
        // const instalDate = new Date(Date.now());
        const instalDate = new Date(emiDate);
        const createdAt = new Date(emiDate);

        // if(instalDate.getDate() >= 23){
        //     if(today.getMonth() === 10){
        //         instalDate.setMonth(0)
        //         instalDate.setFullYear(today.getFullYear()+1)
        //     } else if(today.getMonth() === 11){
        //         instalDate.setMonth(1);
        //         instalDate.setFullYear(today.getFullYear()+1)
        //     } else {
        //         instalDate.setMonth(today.getMonth() + 2);
        //     }
        // } else {
        //     if(today.getMonth() === 11){
        //         instalDate.setMonth(0);
        //         instalDate.setFullYear(today.getFullYear()+1)
        //     } else {
        //         instalDate.setMonth(today.getMonth() + 1);
        //     }
        // }

        if(instalDate.getDate() >= 24){
            if(instalDate.getMonth() === 10){
                instalDate.setMonth(0)
                instalDate.setFullYear(instalDate.getFullYear()+1)
            } else if(instalDate.getMonth() === 11){
                instalDate.setMonth(1);
                instalDate.setFullYear(instalDate.getFullYear()+1)
            } else {
                instalDate.setMonth(instalDate.getMonth() + 2);
            }
        } else {
            if(instalDate.getMonth() === 11){
                instalDate.setMonth(0);
                instalDate.setFullYear(instalDate.getFullYear()+1)
            } else {
                instalDate.setMonth(instalDate.getMonth() + 1);
            }
        }
        instalDate.setDate(process.env.INST_DATE);
        let finDate = new Date(instalDate);
        let finMonth = finDate.getMonth();
        let finYear = finDate.getFullYear();

        for(let i=0; i<mon; i++){
            if(finMonth === 11){
                if(admin.expectedInstal[Number(finYear) - 2023].month.length > finMonth){
                    admin.expectedInstal[Number(finYear) - 2023].month[finMonth] = Number(admin.expectedInstal[Number(finYear) - 2023].month[finMonth]) + Number(emi)
                } else {
                    admin.expectedInstal[Number(finYear) - 2023].month.push(emi);
                }

                if(admin.expectedProfits[Number(finYear) - 2023].month.length > finMonth){
                    admin.expectedProfits[Number(finYear) - 2023].month[finMonth] = Number(admin.expectedProfits[Number(finYear) - 2023].month[finMonth]) + Number(ipm)
                } else {
                    admin.expectedProfits[Number(finYear) - 2023].month.push(ipm);
                }

                finDate.setMonth(0);
                finDate.setFullYear(finYear+1);
                finMonth = 0;
                finYear += 1;

            } else if(finMonth === 0) {
                if(admin.expectedInstal.length > Number(finYear) - 2023){
                    admin.expectedInstal[Number(finYear) - 2023].month[finMonth] = Number(admin.expectedInstal[Number(finYear) - 2023].month[finMonth]) + Number(emi)
                } else {
                    admin.expectedInstal.push({
                        year: finYear,
                        month: [emi]
                    })
                }

                if(admin.expectedProfits.length > Number(finYear) - 2023){
                    admin.expectedProfits[Number(finYear) - 2023].month[finMonth] = Number(admin.expectedProfits[Number(finYear) - 2023].month[finMonth]) + Number(ipm)
                } else {
                    admin.expectedProfits.push({
                        year: finYear,
                        month: [ipm]
                    })
                }

                finDate.setMonth(1);
                finMonth += 1;

            } else {
                if(admin.expectedInstal[Number(finYear) - 2023].month.length > finMonth){
                    admin.expectedInstal[Number(finYear) - 2023].month[finMonth] = Number(admin.expectedInstal[Number(finYear) - 2023].month[finMonth]) + Number(emi)
                } else {
                    admin.expectedInstal[Number(finYear) - 2023].month.push(emi);
                }

                if(admin.expectedProfits[Number(finYear) - 2023].month.length > finMonth){
                    admin.expectedProfits[Number(finYear) - 2023].month[finMonth] = Number(admin.expectedProfits[Number(finYear) - 2023].month[finMonth]) + Number(ipm)
                } else {
                    admin.expectedProfits[Number(finYear) - 2023].month.push(ipm);
                }

                finDate.setMonth(finMonth+1);
                finMonth += 1;
            }
        }

        await admin.save();

        const name = firstName + " " + lastName

        const address = {
            street,
            city,
            state,
            country,
            postal
        }

        const prodOptions = {
            name: prodName,
            price: prodPrice
        }

        const guarantorOptions = {
            name: guarantorName,
            add: guarantorAdd,
            ph: guarantorPh
        }

        const financeOptions = {
            downPay: downPay,
            finAmount,
            month: mon,
            rate: roi,
            netAmount: Number(finAmount)+Number(interest),
            netInterest: interest,
            emi,
            ipm: Number(interest)/Number(mon),
            proFees: Number(downPay) + Number(finAmount) - Number(prodPrice)
        }

        const detailOptions = {
            netPaid: 0,
            netRem: Number(finAmount)+Number(interest),
            amountPaid: 0,
            amountRem: finAmount,
            interestPaid: 0,
            interestRem: interest,
            monComp: 0,
            monRem: Number(mon),
            instalDate,
            nextEMI: emi,
        }

        const productOption = {
            investor: investor._id,
            prod: prodOptions,
            finance: financeOptions,
            details: detailOptions,
        }

        let flag = false;

        if(!customer){
            customer = await Customer.create({
                name,
                email,
                mob,
                guarantor: guarantorOptions,
                address,
                dob,
                gender,
                aadhar,
                instals,
                nextEMIDate: instalDate,
                createdAt,
            });

            admin.customers.push(customer._id);
            await admin.save();

            flag = true;
        }

        const notification = await Notification.create({
            notName: "Customer Added",
            name,
            createdAt: Date.now(),
            amount: finAmount,
            custInfo: prodName
        });

        customer.products.push(productOption);
        await customer.save();
        
        const product = customer.products[customer.products.length - 1];
        const nextDate = new Date(customer.nextEMIDate);
        if(instalDate.getMonth() === nextDate.getMonth() && instalDate.getFullYear
        () === nextDate.getFullYear()){
            customer.amountDue = Number(customer.amountDue) + Number(product.details.netRem);
            customer.netNextEMI = Number(customer.netNextEMI) + Number(product.finance.emi)
            customer.nextMonProfit = Number(customer.nextMonProfit) + Number(product.finance.ipm)
        }

        await customer.save();

        investor.invested.push({
            customer: customer._id,
            product: product._id
        })

        investor.lifetime.moneyInvest = Number(investor.lifetime.moneyInvest) + Number(finAmount);

        investor.current.moneyRem = Number(investor.current.moneyRem) - Number(finAmount);
        investor.current.moneyInvest = Number(investor.current.moneyInvest) + Number(finAmount);
        investor.current.currMoney = Number(investor.current.currMoney) + Number(finAmount);
        await investor.save();

        admin.lifetime.moneyInvest = Number(admin.lifetime.moneyInvest) + Number(finAmount);

        admin.current.activeInvest = Number(admin.current.activeInvest) + Number(finAmount);
        admin.current.moneyRem = Number(admin.current.moneyRem) - Number(finAmount);

        await admin.save()

        res.status(flag ? 201 : 200).json({
            success: true,
            message: (flag ? "Customer Added" : "Product Details added")
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        })
    }
}

export const deleteCustomer = async (req, res) => {
    try {

        let admin = await Admin.findOne();

        // const {email} = req.body;

        let customer = await Customer.findById(req.params.id);
        let investor = await Investor.findById(customer.products[0].investor);

        const instalDate = new Date(customer.nextEMIDate);
        let finDate = new Date(customer.nextEMIDate)
        let finMonth = finDate.getMonth();
        let finYear = finDate.getFullYear();

        let mon = customer.products[0].finance.month
        let emi = customer.products[0].finance.emi
        let ipm = customer.products[0].finance.ipm
        for(let i=0; i<mon; i++){
            if(finMonth === 11){
                if(admin.expectedInstal[Number(finYear) - 2023].month.length > finMonth){
                    admin.expectedInstal[Number(finYear) - 2023].month[finMonth] = Number(admin.expectedInstal[Number(finYear) - 2023].month[finMonth]) - Number(emi)
                }

                if(admin.expectedProfits[Number(finYear) - 2023].month.length > finMonth){
                    admin.expectedProfits[Number(finYear) - 2023].month[finMonth] = Number(admin.expectedProfits[Number(finYear) - 2023].month[finMonth]) - Number(ipm)
                }

                finDate.setMonth(0);
                finDate.setFullYear(finYear+1);
                finMonth = 0;
                finYear += 1;

            } else if(finMonth === 0) {
                if(admin.expectedInstal.length > Number(finYear) - 2023){
                    admin.expectedInstal[Number(finYear) - 2023].month[finMonth] = Number(admin.expectedInstal[Number(finYear) - 2023].month[finMonth]) - Number(emi)
                }

                if(admin.expectedProfits.length > Number(finYear) - 2023){
                    admin.expectedProfits[Number(finYear) - 2023].month[finMonth] = Number(admin.expectedProfits[Number(finYear) - 2023].month[finMonth]) - Number(ipm)
                } 

                finDate.setMonth(1);
                finMonth += 1;

            } else {
                if(admin.expectedInstal[Number(finYear) - 2023].month.length > finMonth){
                    admin.expectedInstal[Number(finYear) - 2023].month[finMonth] = Number(admin.expectedInstal[Number(finYear) - 2023].month[finMonth]) - Number(emi)
                }

                if(admin.expectedProfits[Number(finYear) - 2023].month.length > finMonth){
                    admin.expectedProfits[Number(finYear) - 2023].month[finMonth] = Number(admin.expectedProfits[Number(finYear) - 2023].month[finMonth]) - Number(ipm)
                } 

                finDate.setMonth(finMonth+1);
                finMonth += 1;
            }
        }

        let finAmount = customer.products[0].finance.finAmount

        investor.lifetime.moneyInvest = Number(investor.lifetime.moneyInvest) - Number(finAmount);

        investor.current.moneyRem = Number(investor.current.moneyRem) + Number(finAmount);
        investor.current.moneyInvest = Number(investor.current.moneyInvest) - Number(finAmount);
        investor.current.currMoney = Number(investor.current.currMoney) - Number(finAmount);

        admin.lifetime.moneyInvest = Number(admin.lifetime.moneyInvest) - Number(finAmount);

        admin.current.activeInvest = Number(admin.current.activeInvest) - Number(finAmount);
        admin.current.moneyRem = Number(admin.current.moneyRem) + Number(finAmount);

        const index = investor.invested.indexOf(customer.products[0]._id);
        investor.invested.splice(index, 1);

        const ind = admin.customers.indexOf(customer._id);
        admin.customers.splice(ind, 1)

        await admin.save();
        await investor.save();

        await Customer.findByIdAndDelete(customer._id)

        res.status(200).json({
            success: true,
            message: "Customer Deleted"
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        })
    }
}

export const getAllCustomers = async(req, res) => {
    try {
        const customers = await Customer.find();

        res.status(200).json({
            success: true,
            customers: customers.reverse()
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

export const getCustomer = async(req, res) => {
    try {
        const customer = await Customer.findById(req.params.id);

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

export const afterDueCustomers = async (req, res) => {
    try {
        const currDate = new Date();
        const customers = await Customer.find({ nextEMIDate: { $lt: currDate } });
        const users = customers.filter(customer => customer.amountDue !== 0)

        res.status(200).json({
            success: true,
            users
        })
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        }) 
    }
}

export const updateCustomer = async (req, res) => {
    try {

        const {firstName, lastName, email, mob, street, city, state, country, postal, aadhar, id} = req.body;

        const customer = await Customer.findById(id);

        if(!customer){
            return res.status(404).json({
                success: false,
                message: "Customer not found"
            })
        }


        if(firstName || lastName) customer.name = firstName + " " + lastName;
        if(email) customer.email = email;
        if(mob) customer.mob = mob;
        if(street) customer.address.street = street;
        if(city) customer.address.city = city;
        if(state) customer.address.state = state;
        if(country) customer.address.country = country;
        if(postal) customer.address.postal = postal;
        if(aadhar) customer.aadhar = aadhar;

        await customer.save();

        res.status(200).json({
            success: true,
            message: "Customer Details Updated Successfully",
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}


// Investor controller actions
export const addInvestor = async (req, res) => {
    try {

        let admin = await Admin.findById(req.admin._id);

        const {firstName, lastName, email, mob, street, city, state, country, postal, dob, gender, aadhar, invest} = req.body;

        let investor = await Investor.findOne({email});

        admin.lifetime.moneyTotal = Number(admin.lifetime.moneyTotal) + Number(invest);

        admin.current.netWorth = Number(admin.current.netWorth) + Number(invest);
        admin.current.moneyRem = Number(admin.current.moneyRem) + Number(invest);

        await admin.save();

        const name = firstName + " " + lastName;

        const address = {
            street,
            city,
            state,
            country,
            postal,
        }

        const lifetimeOptions = {
            moneyTotal: invest,
            moneyInvest: 0,
            profit: 0,
            withdrawn: 0
        }

        const currentOptions = {
            currMoney: 0,
            moneyWorth: invest,
            moneyInvest: 0,
            moneyRem: invest,
        }

        if(investor){
            investor.current.moneyWorth = Number(investor.current.moneyWorth) + Number(invest);
            investor.lifetime.moneyWorth = Number(investor.lifetime.moneyWorth) + Number(invest);
            investor.lifetime.moneyRem = Number(investor.lifetime.moneyRem) + Number(invest);
        }

        let flag = false;

        const profits = [{
            year: 2024,
            month: [100, 200, 300]
        }]
        const amounts = [{
            year: 2024,
            month: [100, 200, 300]
        }]

        if(!investor){
            investor = await Investor.create({
                name,
                email,
                mob,
                address,
                dob,
                gender,
                aadhar,
                lifetime: lifetimeOptions,
                current: currentOptions,
                profits,
                amounts
            });

            admin.investors.unshift(investor._id);
            await admin.save();

            flag = true;
        }

        const notification = await Notification.create({
            notName: "Investor Added",
            name,
            createdAt: Date.now(),
            amount: invest
        });


        res.status(flag ? 201 : 200).json({
            success: true,
            message: (flag ? "Investor Added" : "Invested Amount Updated")
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        })
    }
}

export const getAllInvestors = async(req, res) => {
    try {
        const investors = await Investor.find();

        res.status(200).json({
            success: true,
            investors: investors.reverse()
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

export const getInvestor = async(req, res) => {
    try {
        const investor = await Investor.findById(req.params.id);

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

export const updateInvestor = async (req, res) => {
    try {

        const {firstName, lastName, email, mob, street, city, state, country, postal, aadhar, id} = req.body;

        const investor = await Investor.findById(id);

        if(!investor){
            return res.status(404).json({
                success: false,
                message: "Investor not found"
            })
        }


        if(firstName || lastName) investor.name = firstName + " " + lastName;
        if(email) investor.email = email;
        if(mob) investor.mob = mob;
        if(street) investor.address.street = street;
        if(city) investor.address.city = city;
        if(state) investor.address.state = state;
        if(country) investor.address.country = country;
        if(postal) investor.address.postal = postal;
        if(aadhar) investor.aadhar = aadhar;

        await investor.save();

        res.status(200).json({
            success: true,
            message: "Customer Details Updated Successfully",
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}


// Customer controller actions
export const getAllNotifications = async(req, res) => {
    try {
        const notifications = await Notification.find();

        res.status(200).json({
            success: true,
            notifications: notifications.reverse()
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

export const getNotification = async(req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);

        res.status(200).json({
            success: true,
            notification
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}


// Updating Previous Values
export const updatePrevAdmin = async (req, res) => {
    try {

        const admin = await Admin.findById(req.admin._id)

        const today = new Date();
        const date = new Date(admin.updatedAt)

        if(date.getMonth === today.getMonth() && date.getFullYear === today.getFullYear()){
            date.setDate(today.getDate());
            date.setHours(today.getHours());
            date.setMinutes(today.getMinutes());
            date.setSeconds(today.getSeconds());
            admin.updatedAt = date.toISOString();
            await admin.save();
            return res.status(200).json({
                success: true,
                message: "Prev-data Updated Successfully",
            });
        }

        let currMon = today.getMonth();
        let currYear = today.getFullYear();
        let prevMon, prevYear
        if(currMon===0){
            prevMon = 11;
            prevYear = currYear - 1;
        } else {
            prevMon = currMon - 1;
            prevYear = currYear
        }

        admin.lifetime.prevMoneyInvest = admin.lifetime.moneyInvest
        admin.lifetime.prevMoneyTotal = admin.lifetime.moneyTotal
        admin.lifetime.prevProfit = admin.profits[Number(prevYear) - 2023].month[prevMon]

        admin.current.prevActiveInvest = admin.current.activeInvest
        admin.current.prevMoneyRem = admin.current.moneyRem

        await admin.save()

        date.setDate(today.getDate());
        date.setMonth(today.getMonth());
        date.setFullYear(today.getFullYear());
        date.setHours(today.getHours());
        date.setMinutes(today.getMinutes());
        date.setSeconds(today.getSeconds());
        admin.updatedAt = date.toISOString();

        await admin.save();

        res.status(200).json({
            success: true,
            message: "Admin Updated Successfully",
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

export const updatePrevInvestors = async (req, res) => {
    try {

        const investors = await Investor.find()
        const today = new Date();
        let date;

        for(const investor of investors){
            date = new Date(investor.updatedAt)
            if(date.getMonth !== today.getMonth() || date.getFullYear !== today.getFullYear()){
                investor.current.prevMoneyWorth = investor.current.moneyWorth;
                investor.current.prevMonProfit = investor.current.currMonProfit;
            }
            date.setMonth(today.getMonth());
            date.setDate(today.getDate());
            date.setFullYear(today.getFullYear());
            date.setHours(today.getHours());
            date.setMinutes(today.getMinutes());
            date.setSeconds(today.getSeconds());
            investor.updatedAt = date.toISOString();
            await investor.save();
        };

        res.status(200).json({
            success: true,
            message: "Investors Updated Successfully",
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

// Extras
export const testUpdate = async (req, res) => {
    try {

        const admin = await Admin.findOne()
        const investors = await Investor.find()

        const penalty = [
            {
                year: 2024,
                month: [0, 0, 0, 0]
            }
        ]

        admin.penalty = penalty;
        await admin.save();
        for (const investor of investors) {
            investor.penalty = penalty;
            await investor.save()
        }

        res.status(200).json({
            success: true,
            message: "Penalty Updated Successfully",
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

export const testAdd = async (req, res) => {
    try {

        console.log("Working 1...")
        let admin = await Admin.findById(req.admin._id);
        console.log("Working 2...")

        const {firstName, lastName, email, mob, street, city, state, country, postal, dob, gender, aadhar, emiDate, guarantorName, guarantorAdd, guarantorPh, prodName, prodPrice, downPay, finAmount, mon, roi, invEmail} = req.body;

        const instals = [
            {
                year: 2023,
                month: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
            },
            {
                year: 2024,
                month: [0, 0, 0]
            },
        ]

        let customer = await Customer.findOne({email});
        let investor = await Investor.findOne({email: invEmail});
        const interest = Number(Number(finAmount*roi*mon)/100).toFixed(0);
        const ipm = Number(interest)/Number(mon)
        const emi = Number((Number(finAmount) + Number(interest))/mon).toFixed(0);
        const today = new Date();
        // const instalDate = new Date(Date.now());
        const instalDate = new Date(emiDate);
        const createdAt = new Date(emiDate);
        console.log("Working 3...")

        if(instalDate.getDate() >= 24){
            if(instalDate.getMonth() === 10){
                instalDate.setMonth(0)
                instalDate.setFullYear(instalDate.getFullYear()+1)
            } else if(instalDate.getMonth() === 11){
                instalDate.setMonth(1);
                instalDate.setFullYear(instalDate.getFullYear()+1)
            } else {
                instalDate.setMonth(instalDate.getMonth() + 2);
            }
        } else {
            if(instalDate.getMonth() === 11){
                instalDate.setMonth(0);
                instalDate.setFullYear(instalDate.getFullYear()+1)
            } else {
                instalDate.setMonth(instalDate.getMonth() + 1);
            }
        }
        instalDate.setDate(process.env.INST_DATE);
        let finDate = new Date(instalDate);
        let finMonth = finDate.getMonth();
        let finYear = finDate.getFullYear();

        // for(let i=0; i<mon; i++){
        //     if(finMonth === 11){
        //         if(admin.expectedInstal[Number(finYear) - 2023].month.length > finMonth){
        //             admin.expectedInstal[Number(finYear) - 2023].month[finMonth] = Number(admin.expectedInstal[Number(finYear) - 2023].month[finMonth]) + Number(emi)
        //         } else {
        //             admin.expectedInstal[Number(finYear) - 2023].month.push(emi);
        //         }

        //         if(admin.expectedProfits[Number(finYear) - 2023].month.length > finMonth){
        //             admin.expectedProfits[Number(finYear) - 2023].month[finMonth] = Number(admin.expectedProfits[Number(finYear) - 2023].month[finMonth]) + Number(ipm)
        //         } else {
        //             admin.expectedProfits[Number(finYear) - 2023].month.push(ipm);
        //         }

        //         finDate.setMonth(0);
        //         finDate.setFullYear(finYear+1);
        //         finMonth = 0;
        //         finYear += 1;

        //     } else if(finMonth === 0) {
        //         if(admin.expectedInstal.length > Number(finYear) - 2023){
        //             admin.expectedInstal[Number(finYear) - 2023].month[finMonth] = Number(admin.expectedInstal[Number(finYear) - 2023].month[finMonth]) + Number(emi)
        //         } else {
        //             admin.expectedInstal.push({
        //                 year: finYear,
        //                 month: [emi]
        //             })
        //         }

        //         if(admin.expectedProfits.length > Number(finYear) - 2023){
        //             admin.expectedProfits[Number(finYear) - 2023].month[finMonth] = Number(admin.expectedProfits[Number(finYear) - 2023].month[finMonth]) + Number(ipm)
        //         } else {
        //             admin.expectedProfits.push({
        //                 year: finYear,
        //                 month: [ipm]
        //             })
        //         }

        //         finDate.setMonth(1);
        //         finMonth += 1;

        //     } else {
        //         if(admin.expectedInstal[Number(finYear) - 2023].month.length > finMonth){
        //             admin.expectedInstal[Number(finYear) - 2023].month[finMonth] = Number(admin.expectedInstal[Number(finYear) - 2023].month[finMonth]) + Number(emi)
        //         } else {
        //             admin.expectedInstal[Number(finYear) - 2023].month.push(emi);
        //         }

        //         if(admin.expectedProfits[Number(finYear) - 2023].month.length > finMonth){
        //             admin.expectedProfits[Number(finYear) - 2023].month[finMonth] = Number(admin.expectedProfits[Number(finYear) - 2023].month[finMonth]) + Number(ipm)
        //         } else {
        //             admin.expectedProfits[Number(finYear) - 2023].month.push(ipm);
        //         }

        //         finDate.setMonth(finMonth+1);
        //         finMonth += 1;
        //     }
        // }

        await admin.save();
        console.log("Working 4...")

        const name = firstName + " " + lastName

        const address = {
            street,
            city,
            state,
            country,
            postal
        }

        const prodOptions = {
            name: prodName,
            price: prodPrice
        }

        const guarantorOptions = {
            name: guarantorName,
            add: guarantorAdd,
            ph: guarantorPh
        }

        const financeOptions = {
            downPay: downPay,
            finAmount,
            month: mon,
            rate: roi,
            netAmount: Number(finAmount)+Number(interest),
            netInterest: interest,
            emi,
            ipm,
            proFees: Number(downPay) + Number(finAmount) - Number(prodPrice)
        }

        const detailOptions = {
            netPaid: 0,
            netRem: Number(finAmount)+Number(interest),
            amountPaid: 0,
            amountRem: finAmount,
            interestPaid: 0,
            interestRem: interest,
            monComp: 0,
            monRem: Number(mon),
            instalDate,
            nextEMI: emi,
        }

        const productOption = {
            investor: investor._id,
            prod: prodOptions,
            finance: financeOptions,
            details: detailOptions,
        }

        let flag = false;
        console.log("Working 5...")

        if(!customer){
            customer = await Customer.create({
                name,
                email,
                mob,
                guarantor: guarantorOptions,
                address,
                dob,
                gender,
                aadhar,
                instals,
                nextEMIDate: instalDate,
                createdAt,
            });

            // admin.customers.push(customer._id);
            // await admin.save();

            flag = true;
        }

        const notification = await Notification.create({
            notName: "Customer Added",
            name,
            createdAt: Date.now(),
            amount: finAmount,
            custInfo: prodName
        });
        
        customer.products.push(productOption);
        await customer.save();
        
        const product = customer.products[customer.products.length - 1];
        const nextDate = new Date(customer.nextEMIDate);
        if(instalDate.getMonth() === nextDate.getMonth() && instalDate.getFullYear
        () === nextDate.getFullYear()){
            customer.amountDue = Number(customer.amountDue) + Number(product.details.netRem);
            customer.netNextEMI = Number(customer.netNextEMI) + Number(product.finance.emi)
            customer.nextMonProfit = Number(customer.nextMonProfit) + Number(product.finance.ipm)
        }

        await customer.save();

        // investor.invested.push({
        //     customer: customer._id,
        //     product: product._id
        // })

        // investor.lifetime.moneyInvest = Number(investor.lifetime.moneyInvest) + Number(finAmount);

        // investor.current.moneyRem = Number(investor.current.moneyRem) - Number(finAmount);
        // investor.current.moneyInvest = Number(investor.current.moneyInvest) + Number(finAmount);
        // investor.current.currMoney = Number(investor.current.currMoney) + Number(finAmount);
        // await investor.save();

        // admin.lifetime.moneyInvest = Number(admin.lifetime.moneyInvest) + Number(finAmount);

        // admin.current.activeInvest = Number(admin.current.activeInvest) + Number(finAmount);
        // admin.current.moneyRem = Number(admin.current.moneyRem) - Number(finAmount);

        // await admin.save()

        res.status(flag ? 201 : 200).json({
            success: true,
            message: (flag ? "Customer Added" : "Product Details added")
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        })
    }
}

