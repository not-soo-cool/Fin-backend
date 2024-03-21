import jwt from 'jsonwebtoken'
import { Customer } from '../models/customerModel.js';

export const isCustomerAuthenticated = async(req, res, next) => {
    try {

        const {token} = await req.cookies;

        if(!token){
            return res.status(400).json({
                success: false,
                message: "Please login first"
            });
        }

        const decodedData = jwt.verify(token, process.env.JWT_SECRET);
        
        req.customer = await Customer.findById(decodedData.id);

        next();
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}