import mongoose from 'mongoose';

const instalSchema = new mongoose.Schema({
    ID: {
        type: String,
        unique: true,
        default: "FIN001"
    },
    customer :{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer"
    },
    month: {
        type: String,
        default: "Jan"
    },
    year: {
        type: Number,
        default: 2021
    },
    expecAmount: {
        type: Number,
        default: 0
    },
    expecProfit: {
        type: Number,
        default: 0
    },
    profit: {
        type: Number,
        default: 0
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

instalSchema.pre('save', async function(next) {
    try {
        if (this.isNew) {
            let lastInstalment = await this.constructor.findOne({}, {}, { sort: { 'ID': -1 } });
            let lastID = "FIN0001"; // Default ID if no instalments exist yet

            if (lastInstalment) {
                // Extract the numeric part of the last ID, increment it by 1, and pad it with zeros
                const lastIDNumber = parseInt(lastInstalment.ID.substring(3));
                lastID = `FIN${(lastIDNumber + 1).toString().padStart(4, '0')}`;
            }

            // Set the generated ID for the new instalment
            this.ID = lastID;
        }
        next();
    } catch (error) {
        next(error);
    }
});

export const Instalment = mongoose.model("Instalment", instalSchema);