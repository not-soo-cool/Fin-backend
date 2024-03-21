import mongoose from 'mongoose';

const withdrawlSchema = new mongoose.Schema({
    ID: {
        type: String,
        unique: true,
        default: "WIT0001"
    },
    investor :{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Investor"
    },
    amount: {
        type: Number,
        default: 0
    },
    createdAt:{
        type: Date,
        default: Date.now,
    },
});

withdrawlSchema.pre('save', async function(next) {
    try {
        if (this.isNew) {
            let lastWithdrawl = await this.constructor.findOne({}, {}, { sort: { 'ID': -1 } });
            let lastID = "WIT0001"; // Default ID if no withdrawls exist yet

            if (lastWithdrawl) {
                // Extract the numeric part of the last ID, increment it by 1, and pad it with zeros
                const lastIDNumber = parseInt(lastWithdrawl.ID.substring(3));
                lastID = `WIT${(lastIDNumber + 1).toString().padStart(4, '0')}`;
            }

            // Set the generated ID for the new withdrawl
            this.ID = lastID;
        }
        next();
    } catch (error) {
        next(error);
    }
});

export const Withdrawl = mongoose.model("Withdrawl", withdrawlSchema);