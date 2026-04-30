import mongoose, {Schema} from "mongoose"

const appointmentSchema = new Schema({
    patientId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    doctorId: {
        type: Schema.Types.ObjectId,
        ref: "Doctor",
        required: true
    },
    date: {
        type: String, // e.g. YYYY-MM-DD
        required: true
    },
    time: {
        type: String, // e.g. 14:00
        required: true
    },
    status: {
        type: String,
        enum: ["pending", "confirmed", "completed", "cancelled", "rejected"],
        default: "pending"
    },
    reason: {
        type: String
    },
    notes: {
        type: String
    },
    tokenNumber: {
        type: Number
    },
    appointmentType: {
        type: String,
        enum: ["Physical Visit", "Video Call"],
        default: "Physical Visit"
    },
    location: {
        type: String
    },
    locationCoords: {
        latitude: Number,
        longitude: Number
    }
}, {timestamps: true})

export const Appointment = mongoose.model("Appointment", appointmentSchema)
