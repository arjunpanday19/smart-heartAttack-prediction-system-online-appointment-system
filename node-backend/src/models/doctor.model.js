import mongoose, {Schema} from "mongoose"

const doctorSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true
    },
    specialty: {
        type: String,
        required: true,
        trim: true
    },
    degree: {
        type: String,
        default: ""
    },
    experience: {
        type: Number,
        default: 0
    },
    biography: {
        type: String,
        default: ""
    },
    timing: {
        days: [String],
        startTime: String,
        endTime: String
    },
    availabilitySettings: {
        days: { type: [String], default: ["Monday","Tuesday","Wednesday","Thursday","Friday"] },
        morning: {
            enabled: { type: Boolean, default: true },
            start: { type: String, default: "09:00" },
            end: { type: String, default: "12:00" }
        },
        evening: {
            enabled: { type: Boolean, default: true },
            start: { type: String, default: "17:00" },
            end: { type: String, default: "20:00" }
        },
        slotDuration: { type: Number, default: 60 },
        capacityPerSlot: { type: Number, default: 2 }
    },
    govtIdType: {
        type: String
    },
    govtIdNumber: {
        type: String
    },
    govtIdPhoto: {
        type: String // cloudinary url
    },
    medicalCouncil: {
        type: String
    },
    regYear: {
        type: Number
    },
    medicalRegNumber: {
        type: String
    },
    medicalLicense: {
        type: String // cloudinary url
    },
    registrationCert: {
        type: String // cloudinary url
    },
    status: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending"
    },
    consultingFee: {
        type: Number,
        default: null
    },
    address: {
        type: String,
        default: ""
    }
}, {timestamps: true})

export const Doctor = mongoose.model("Doctor", doctorSchema)
