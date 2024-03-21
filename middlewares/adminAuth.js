import jwt from 'jsonwebtoken'
import { Admin } from '../models/adminModel.js';
import { Investor } from '../models/investorModel.js';
import { Customer } from '../models/customerModel.js';

export const isAuthenticated = async(req, res, next) => {
    try {

        const {token} = await req.cookies;

        if(!token){
            return res.status(400).json({
                success: false,
                message: "Please login first"
            });
        }

        const decodedData = jwt.verify(token, process.env.JWT_SECRET);
        
        req.admin = await Admin.findById(decodedData.id);

        // if(!req.admin){
        //     return res.status(404).json({
        //         success: false,
        //         message: "Admin not found"
        //     });
        // }

        next();
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

export const isAdminOrInvestorAuthenticated = async(req, res, next) => {
    try {

        const {token} = await req.cookies;

        if(!token){
            return res.status(400).json({
                success: false,
                message: "Please login first"
            });
        }

        const decodedData = jwt.verify(token, process.env.JWT_SECRET);
        
        req.admin = await Admin.findById(decodedData.id);

        if(!req.admin){
            req.investor = await Investor.findById(decodedData.id);

            if(!req.investor){
                return res.status(404).json({
                    success: false,
                    message: "Access denied"
                });
            }
        }

        next();
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

export const isAnyAuthenticated = async(req, res, next) => {
    try {

        const {token} = await req.cookies;

        if(!token){
            return res.status(400).json({
                success: false,
                message: "Please login first"
            });
        }

        const decodedData = jwt.verify(token, process.env.JWT_SECRET);
        
        req.admin = await Admin.findById(decodedData.id);

        if(!req.admin){
            req.investor = await Investor.findById(decodedData.id);

            if(!req.investor){
                req.customer = await Customer.findById(decodedData.id)

                if(!req.customer){
                    return res.status(404).json({
                        success: false,
                        message: "Access denied"
                    });
                }
            }
        }

        next();
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}