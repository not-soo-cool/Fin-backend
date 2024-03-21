import mongoose from 'mongoose';

export const connectDatabase = () => {
    mongoose
        .connect(process.env.DB_URI)
        .then((c) => {
            console.log(`Mongodb connected to: ${c.connection.host}`);
        })
        .catch((e) => {
            console.log(e);
        });
};