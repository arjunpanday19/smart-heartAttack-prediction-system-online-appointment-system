import mongoose, {Schema} from "mongoose"

const availabilitySchema = new Schema({
    doctorId: {
        type: Schema.Types.ObjectId,
        ref: "Doctor",
        required: true
    },
    date: {
        type: String,
        required: true
    },
    slots: [{
        time: String,
        isBooked: {
            type: Boolean,
            default: false
        }
    }]
}, {timestamps: true})

export const Availability = mongoose.model("Availability", availabilitySchema)
