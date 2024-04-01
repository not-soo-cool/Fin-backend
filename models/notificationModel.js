import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    notName: {
        type: String,
        default: " "
    },
    name :{
        type: String,
        default: " "
    },
    createdAt: {
        type: Date,
        default: Date.now()
    },
    amount: {
        type: Number,
        default: 0
    },
    custInfo: {
        type: String,
        default: " "
    }
});

// instalSchema.pre('save', async function(next) {
//     try {
//         if (this.isNew) {
//             let lastInstalment = await this.constructor.findOne({}, {}, { sort: { 'ID': -1 } });
//             let lastID = "FIN001"; // Default ID if no instalments exist yet

//             if (lastInstalment) {
//                 // Extract the numeric part of the last ID, increment it by 1, and pad it with zeros
//                 const lastIDNumber = parseInt(lastInstalment.ID.substring(3));
//                 lastID = `FIN${(lastIDNumber + 1).toString().padStart(3, '0')}`;
//             }

//             // Set the generated ID for the new instalment
//             this.ID = lastID;
//         }
//         next();
//     } catch (error) {
//         next(error);
//     }
// });

export const Notification = mongoose.model("Notification", notificationSchema);