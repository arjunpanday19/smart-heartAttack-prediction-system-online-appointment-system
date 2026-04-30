import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Contact } from "../models/contact.model.js";

const createContact = asyncHandler(async (req, res) => {
    const { name, email, message, type, rating, userRole } = req.body;
    
    if(!name || !email || !message){
        throw new ApiError(400, "All fields are required")
    }

    const contact = await Contact.create({ 
        name, 
        email, 
        message, 
        type: type || "complaint", 
        rating: rating || 0,
        userRole: userRole || "guest"
    });
    return res.status(201).json(new ApiResponse(201, contact, "Message sent successfully"));
});

const getContacts = asyncHandler(async (req, res) => {
    const contacts = await Contact.find({}).sort({ createdAt: -1 });
    return res.status(200).json(new ApiResponse(200, contacts, "Contacts fetched"));
});

const updateContact = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { adminReply, status } = req.body;

    const updateFields = {};
    if (status) updateFields.status = status;
    if (adminReply !== undefined) {
        updateFields.adminReply = adminReply;
        updateFields.status = "resolved";
    }

    const contact = await Contact.findByIdAndUpdate(id, updateFields, { new: true });
    if (!contact) throw new ApiError(404, "Contact not found");

    // If admin just replied, send a notification to the user (non-blocking)
    if (adminReply && contact.email && contact.email !== "unknown") {
        try {
            const { User } = await import("../models/user.model.js");
            const { createNotification } = await import("./notification.controller.js");
            const user = await User.findOne({ email: contact.email }).select("_id");
            if (user) {
                createNotification({
                    userId:  user._id,
                    icon:    "📬",
                    type:    "admin_reply",
                    message: `Admin replied to your ${contact.type}: "${adminReply}"`,
                }).catch(e => console.error("notify admin reply:", e.message));
            }
        } catch (e) {
            console.error("contact reply notification:", e.message);
        }
    }

    return res.status(200).json(new ApiResponse(200, contact, "Contact updated successfully"));
});


const updateContactStatus = asyncHandler(async (req, res) => {
    const { contactId } = req.params;
    const { status, adminReply } = req.body;

    const updateFields = {};
    if (status) updateFields.status = status;
    if (adminReply !== undefined) {
        updateFields.adminReply = adminReply;
        updateFields.status = "resolved"; // Automatically resolve if replied
    }

    const contact = await Contact.findByIdAndUpdate(contactId, updateFields, { new: true });
    return res.status(200).json(new ApiResponse(200, contact, "Contact updated successfully"));
});

export { createContact, getContacts, updateContact, updateContactStatus };
