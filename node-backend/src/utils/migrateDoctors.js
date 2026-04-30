import mongoose from "mongoose";
import dotenv from "dotenv";
import { User } from "../models/user.model.js";
import { Doctor } from "../models/doctor.model.js";
import { Appointment } from "../models/appointment.model.js";
import { Availability } from "../models/availability.model.js";
import { DB_NAME } from "../constants.js";

dotenv.config({ path: "./.env" });

const migrate = async () => {
    try {
        console.log(`Connecting to MongoDB (DB: ${DB_NAME})...`);
        await mongoose.connect(process.env.MONGODB_URI, { dbName: DB_NAME });
        const db = mongoose.connection.db;
        console.log("Connected Successfully.");

        const users = await db.collection("users").find({ role: "doctor" }).toArray();
        console.log(`Found ${users.length} doctors in User collection.`);

        for (const user of users) {
            console.log(`Processing doctor: ${user.name} (${user.email})`);

            let doctorProfile = await Doctor.findOne({ user: user._id });

            if (!doctorProfile) {
                doctorProfile = await Doctor.create({
                    user: user._id,
                    specialty: user.specialty || "General",
                    timing: user.timing || {},
                    govtIdType: user.govtIdType,
                    govtIdNumber: user.govtIdNumber,
                    govtIdPhoto: user.govtIdPhoto,
                    medicalCouncil: user.medicalCouncil,
                    regYear: user.regYear,
                    medicalRegNumber: user.medicalRegNumber,
                    medicalLicense: user.medicalLicense,
                    registrationCert: user.registrationCert,
                    status: user.status === "approved" || user.status === "pending" || user.status === "rejected" ? user.status : "approved"
                });
                console.log(`Created Doctor profile: ${doctorProfile._id}`);
            }

            // Fix refs
            await Availability.updateMany({ doctorId: user._id }, { $set: { doctorId: doctorProfile._id } });
            await Appointment.updateMany({ doctorId: user._id }, { $set: { doctorId: doctorProfile._id } });

            // Raw update to remove fields from Users collection
            await db.collection("users").updateOne(
                { _id: user._id },
                { 
                    $unset: { 
                        specialty: "",
                        timing: "",
                        govtIdType: "",
                        govtIdNumber: "",
                        govtIdPhoto: "",
                        medicalCouncil: "",
                        regYear: "",
                        medicalRegNumber: "",
                        medicalLicense: "",
                        registrationCert: ""
                    },
                    $set: { status: "active" }
                }
            );
            console.log(`Cleaned up raw User record for ${user.name}.`);
        }

        console.log("Migration and Cleanup completed!");
        process.exit(0);
    } catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    }
};

migrate();
