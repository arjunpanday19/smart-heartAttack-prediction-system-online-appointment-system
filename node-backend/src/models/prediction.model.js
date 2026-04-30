import mongoose, { Schema } from "mongoose";

const predictionSchema = new Schema(
    {
        patientId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        inputs: {
            age: Number,
            gender: Number,
            bmi: Number,
            smoking: Number,
            alcohol: Number,
            physical_activity: Number,
            systolic_bp: Number,
            diastolic_bp: Number,
            heart_rate: Number,
            stress_level: Number,
            family_history: Number,
            sleep_hours: Number,
        },
        result: {
            prediction: String,
            risk: Number,
            probability: Number,
        },
    },
    { timestamps: true }
);

export const Prediction = mongoose.model("Prediction", predictionSchema);
