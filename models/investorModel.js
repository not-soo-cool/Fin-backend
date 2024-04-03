import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto'


const investorSchema = new mongoose.Schema({
    name:{
        type:String,
        required:[true, "Please Enter your name"],
        maxLength:[30, "Name can not exceed 30 characters"],
        minLength:[4, "Name should have at least 4 characters"],
    },
    email: {
        type: String,
        unique: true,
        required: [true, "Please Enter Email"],
    },
    password: {
        type: String,
        required: [true, "Please Enter Password"],
        default: '12345678',
        select: false,
    },
    mob: {
        type: Number,
        required: [true, "Please Enter Mobile Number"],
        default: 91,
    },
    dob: {
        type: Date,
        default: Date.now()
    },
    gender: {
        type: String,
        default: "Male"
    },
    address: {
        street: {
            type: String,
            default: "Ward No.1, Madhogarh"
        },
        city: {
            type: String,
            default: "Jalaun"
        },
        state: {
            type: String,
            default: "U.P."
        },
        country: {
            type: String,
            default: "India"
        },
        postal: {
            type: Number,
            default: 285126
        },
    },
    lifetime: {
        moneyTotal: {
            type: Number,
            default: 0,
        },
        moneyInvest: {
            type: Number,
            default: 0,
        },
        profit: {
            type: Number,
            default: 0,
        },
        withdrawn: {
            type: Number,
            default: 0,
        },
    },
    current: {
        currMoney: {
            type: Number,
            default: 0,
        },
        moneyInvest: {
            type: Number,
            default: 0,
        },
        moneyWorth: {
            type: Number,
            default: 0,
        },
        prevMoneyWorth: {
            type: Number,
            default: 0,
        },
        moneyRem: {
            type: Number,
            default: 0,
        },
        nextMonProfit: {
            type: Number,
            default: 0,
        },
        currMonProfit: {
            type: Number,
            default: 0,
        },
        prevMonProfit: {
            type: Number,
            default: 0,
        },
    },
    invested : [
        {
            customer: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Customer"
            },
            product: String
        }
    ],
    profits: [
        {
            year: {
                type: Number,
                default: 2023
            },
            month : [
                {
                    type: Number,
                    default: 0
                }
            ]
        }
    ],
    penalty: [
        {
            year: {
                type: Number,
                default: 2024
            },
            month : [
                {
                    type: Number,
                    default: 0
                }
            ]
        }
    ],
    amounts: [
        {
            year: {
                type: Number,
                default: 2023
            },
            month : [
                {
                    type: Number,
                    default: 0
                }
            ]
        }
    ],
    withdrawl: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Withdrawl"
        }
    ],
    aadhar: {
        type: Number,
        default: 0,
    },
    updatedAt:{
        type: Date,
        default: Date.now,
    },
    createdAt:{
        type: Date,
        default: Date.now,
    },
    isVerified: {
        type: Boolean,
        default: false,
    },

    resetPasswordToken: String,
    resetPasswordExpire: Date,
    
});

investorSchema.pre("save", async function(next) {
    if(this.isModified("password")){
        this.password = await bcrypt.hash(this.password, 10);
    }

    next();
})

investorSchema.methods.matchPassword = async function(enterPassword) {

    let isMatch = false;
    if(enterPassword === this.password)
        isMatch = true;
    // const isMatch = await bcrypt.compare(enterPassword, this.password);

    return isMatch;
}

investorSchema.methods.generateToken = function() {
    return jwt.sign({id: this._id}, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE,
    });
};

investorSchema.methods.getResetPasswordToken = function() {

    const resetToken = crypto.randomBytes(20).toString("hex");

    this.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    this.resetPasswordExpire = Date.now() + 15*60*1000;

    return resetToken;

}

export const Investor = mongoose.model("Investor", investorSchema);