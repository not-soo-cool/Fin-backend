import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto'


const adminSchema = new mongoose.Schema({
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
        select: false,
    },
    mob: {
        type: Number,
        required: [true, "Please Enter Mobile Number"],
        default: 90,
    },
    lifetime: {
        moneyTotal: {
            type: Number,
            default: 100,
        },
        moneyInvest: {
            type: Number,
            default: 70,
        },
        profit: {
            type: Number,
            default: 20,
        },
        totalWithdrawn: {
            type: Number,
            default: 50,
        },
        prevMoneyTotal: {
            type: Number,
            default: 0,
        },
        prevMoneyInvest: {
            type: Number,
            default: 0,
        },
        prevProfit: {
            type: Number,
            default: 0,
        },
    },
    current: {
        netWorth: {
            type: Number,
            default: 15,
        },
        activeInvest: {
            type: Number,
            default: 10,
        },
        prevActiveInvest: {
            type: Number,
            default: 0,
        },
        moneyRem: {
            type: Number,
            default: 4,
        },
        prevMoneyRem: {
            type: Number,
            default: 4,
        },
        currMonInstal: {
            type: Number,
            default: 2,
        },
        expectedCurrMonInstal: {
            type: Number,
            default: 2,
        },
        activeProfit: {
            type: Number,
            default: 1,
        },
    },
    profits: [
        {
            year: {
                type: Number,
                default: 2021
            },
            month : [
                {
                    type: Number,
                    default: 0
                }
            ]
        }
    ],
    expectedProfits: [
        {
            year: {
                type: Number,
                default: 2021
            },
            month : [
                {
                    type: Number,
                    default: 0
                }
            ]
        }
    ],
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
    receivedInstal: [
        {
            year: {
                type: Number,
                default: 2021
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
    expectedInstal: [
        {
            year: {
                type: Number,
                default: 2021
            },
            month : [
                {
                    type: Number,
                    default: 0
                }
            ]
        }
    ],
    investors: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Investor"
        }
    ],
    customers: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Customer"
        }
    ],
    afterDueCustomers: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Customer"
        }
    ],
    instalHistory: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Instalment"
        }
    ],
    withdrawlHistory: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Withdrawl"
        }
    ],
    updatedAt:{
        type: Date,
        default: Date.now,
    },
    createdAt:{
        type: Date,
        default: Date.now,
    },

    resetPasswordToken: String,
    resetPasswordExpire: Date,
    
});

adminSchema.pre("save", async function(next) {
    
    if(this.isModified("password")){
        this.password = await bcrypt.hash(this.password, 10);
    }

    next();
})

adminSchema.methods.matchPassword = async function (enterPassword) {

    const isMatch = await bcrypt.compare(enterPassword, this.password);

    // return bcrypt.compare(enterPassword, this.password);
    return isMatch;
}

adminSchema.methods.generateToken = function() {
    return jwt.sign({id: this._id}, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE,
    });
};

adminSchema.methods.getResetPasswordToken = function() {

    const resetToken = crypto.randomBytes(20).toString("hex");

    this.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    this.resetPasswordExpire = Date.now() + process.env.RESET_PASS_EXPIRE*60*1000;

    return resetToken;

}

export const Admin = mongoose.model("Admin", adminSchema);