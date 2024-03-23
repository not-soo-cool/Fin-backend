import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto'


const customerSchema = new mongoose.Schema({
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
        // required: [true, "Please Enter Password"],
        default: '12345678',
        // select: false,
    },
    mob: {
        type: Number,
        required: [true, "Please Enter Mobile Number"],
        default: 91,
    },
    guarantor: {
        name: String,
        add: String,
        ph: Number
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
    instals: [
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
    dob: {
        type: Date,
        default: Date.now()
    },
    gender: {
        type: String,
        default: "Male"
    },
    aadhar: {
        type: String,
        default: "123456780123"
    },
    instalment: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Instalment"
        }
    ],
    netNextEMI: {
        type: Number,
        default: 0
    },
    nextMonProfit: {
        type: Number,
        default: 0
    },
    nextEMIDate: {
        type: Date,
        default: Date.now()
    },
    amountDue: {
        type: Number,
        default: 0
    },
    penalty: {
        type: Number,
        default: 0
    },
    buffer: {
        type: Number,
        default: 0
    },
    products: [
        {
            investor: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Investor",
            },
            prod: {
                name: {
                    type: String,
                    default: " "
                },
                price: {
                    type: Number,
                    default: 0
                },
            },
            finance: {
                downPay: {
                    type: Number,
                    default: 0
                },
                finAmount: {
                    type: Number,
                    default: 0
                },
                proFees: {
                    type: Number,
                    default: 0
                },
                month: {
                    type: Number,
                    default: 0
                },
                rate: {
                    type: Number,
                    default: 0
                },
                netInterest: {
                    type: Number,
                    default: 0
                },
                netAmount: {
                    type: Number,
                    default: 0
                },
                emi: {
                    type: Number,
                    default: 0
                },
                ipm: {
                    type: Number,
                    default: 0
                },
            },
            details: {
                netPaid: {
                    type: Number,
                    default: 0
                },
                netRem: {
                    type: Number,
                    default: 0
                },
                amountPaid: {
                    type: Number,
                    default: 0
                },
                amountRem: {
                    type: Number,
                    default: 0
                },
                interestPaid: {
                    type: Number,
                    default: 0
                },
                interestRem: {
                    type: Number,
                    default: 0
                },
                monComp: {
                    type: Number,
                    default: 0
                },
                monRem: {
                    type: Number,
                    default: 0
                },
                instalDate: {
                    type: Date,
                    default: Date.now()
                },
                nextEMI: {
                    type: Number,
                    default: 0
                },
            },
            pruchaseDate: {
                type: Date,
                default: Date.now()
            }
        }
    ],
    inProgress: {
        type: Boolean,
        default: false
    },
    createdAt:{
        type: Date,
        default: Date.now,
    },
    
});

customerSchema.pre("save", async function(next) {
    if(this.isModified("password")){
        this.password = await bcrypt.hash(this.password, 10);
    }

    next();
})

customerSchema.methods.matchPassword = async function(enterPassword) {

    let isMatch = false;
    if(enterPassword === this.password)
        isMatch = true;
    // const isMatch = await bcrypt.compare(enterPassword, this.password);

    return isMatch;
}

customerSchema.methods.generateToken = function() {
    return jwt.sign({id: this._id}, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE,
    });
};

customerSchema.methods.getResetPasswordToken = function() {

    const resetToken = crypto.randomBytes(20).toString("hex");

    this.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    this.resetPasswordExpire = Date.now() + 15*60*1000;

    return resetToken;

}

export const Customer = mongoose.model("Customer", customerSchema);