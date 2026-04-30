import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

const check = async () => {
    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.db;
    const doctors = await db.collection("users").find({ role: "doctor" }).toArray();
    console.log(`Found ${doctors.length} doctors.`);
    if (doctors.length > 0) {
        console.log("First doctor sample:", JSON.stringify(doctors[0], null, 2));
    }
    process.exit(0);
};
check();
