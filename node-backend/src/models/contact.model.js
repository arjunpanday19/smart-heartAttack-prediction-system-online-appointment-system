import mongoose, {Schema} from "mongoose"

const contactSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ["complaint", "feedback"],
        default: "complaint"
    },
    userRole: {
        type: String,
        enum: ["patient", "doctor", "guest"],
        default: "guest"
    },
    rating: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ["new", "read", "resolved"],
        default: "new"
    },
    adminReply: {
        type: String,
        default: ""
    }
}, {timestamps: true})

export const Contact = mongoose.model("Contact", contactSchema)
