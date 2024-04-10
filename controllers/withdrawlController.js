import { Admin } from "../models/adminModel.js";
import { Investor } from "../models/investorModel.js";
import { Notification } from "../models/notificationModel.js";
import { Withdrawl } from "../models/withdrawlModel.js";

export const addWithdrawl = async(req, res) => {
    try {
        const admin = await Admin.findById(req.admin._id);

        const { email, amount } = req.body;
        const investor = await Investor.findOne({ email });
        
        admin.lifetime.totalWithdrawn = Number(admin.lifetime.totalWithdrawn) + Number(amount)
        
        admin.current.netWorth = Number(admin.current.netWorth) - Number(amount)
        admin.current.moneyRem = Number(admin.current.moneyRem) - Number(amount)

        await admin.save();

        const withdrawl = await Withdrawl.create({
            investor: investor._id,
            amount
        });

        const notification = await Notification.create({
            notName: "Withdrawl Added",
            name: investor.name,
            createdAt: Date.now(),
            amount
        });

        investor.lifetime.withdrawn = Number(investor.lifetime.withdrawn) + Number(amount) 
        investor.current.moneyRem = Number(investor.current.moneyRem) - Number(amount);
        investor.current.moneyWorth = Number(investor.current.moneyWorth) - Number(amount);
        investor.withdrawl.unshift(withdrawl._id);
        await investor.save();
        
        admin.withdrawlHistory.unshift(withdrawl._id);
        await admin.save();

        res.status(201).json({
            success: true,
            message: "Amount Withdrawn successfully"
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

export const getAllWithdrawls = async(req, res) => {
    try {
        const admin = await Admin.findById(req.admin._id);

        if(!admin){
            res.status(404).json({
                success: false,
                message: "Admin not logged in"
            })
        }

        const withdrawls = await Withdrawl.find().populate("investor");

        res.status(200).json({
            success: true,
            withdrawls: withdrawls.reverse()
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

export const getUserWithdrawls = async(req, res) => {
    try {
        const admin = await Admin.findById(req.admin._id);

        if(!admin){
            res.status(404).json({
                success: false,
                message: "Admin not logged in"
            })
        }

        const investor = await Investor.findById(req.params.id);
        if(!investor){
            res.status(404).json({
                success: false,
                message: "Investor not found"
            })
        }

        const withdrawls = await Withdrawl.find({ 'investor': req.params.id }).populate("investor");

        res.status(200).json({
            success: true,
            withdrawls
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

export const getWithdrawl = async(req, res) => {
    try {
        const admin = await Admin.findById(req.admin._id);

        if(!admin){
            res.status(404).json({
                success: false,
                message: "Admin not logged in"
            })
        }

        const withdrawl = await Withdrawl.findById(req.params.id).populate("investor");

        res.status(200).json({
            success: true,
            withdrawl
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

