import mongoose from "mongoose";
import dotenv from "dotenv";
import { User } from "../src/models/user.model.js";
import { DB_NAME } from "../src/constants.js";

dotenv.config();

const normalizeEmails = async () => {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGODB_URI, {
            dbName: DB_NAME
        });
        console.log("Connected Successfully.");

        const users = await User.find({});
        console.log(`Found ${users.length} users. Normalizing...`);

        for (let user of users) {
            const originalEmail = user.email;
            const normalizedEmail = originalEmail.toLowerCase();
            
            if (originalEmail !== normalizedEmail) {
                user.email = normalizedEmail;
                await user.save();
                console.log(`Normalized: ${originalEmail} -> ${normalizedEmail}`);
            }
        }

        console.log("Normalization complete.");
        process.exit(0);
    } catch (error) {
        console.error("Error during normalization:", error);
        process.exit(1);
    }
};

normalizeEmails();
