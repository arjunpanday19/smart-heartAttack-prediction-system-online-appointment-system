import mongoose from "mongoose";
import dotenv from "dotenv";
import { DB_NAME } from "../constants.js";
dotenv.config({ path: "./.env" });

const diag = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, { dbName: DB_NAME });
        const db = mongoose.connection.db;
        
        const usersCount = await db.collection("users").countDocuments();
        const doctorsCount = await db.collection("doctors").countDocuments();
        const docsWithRoleDoctor = await db.collection("users").countDocuments({ role: "doctor" });
        
        console.log(`Summary for DB: ${DB_NAME}`);
        console.log(`-------------------------`);
        console.log(`Total Users: ${usersCount}`);
        console.log(`Users with role 'doctor': ${docsWithRoleDoctor}`);
        console.log(`Total Doctor Profiles: ${doctorsCount}`);
        
        if (doctorsCount > 0) {
            console.log("\nSample Doctor Profile:");
            const sample = await db.collection("doctors").findOne({});
            console.log(JSON.stringify(sample, null, 2));
        }

        const sampleUser = await db.collection("users").findOne({ role: "doctor" });
        if (sampleUser) {
            console.log("\nSample User (Doctor):");
            console.log(JSON.stringify(sampleUser, null, 2));
        }
        
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};
diag();
