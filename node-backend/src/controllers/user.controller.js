import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { Doctor } from "../models/doctor.model.js";
import { Availability } from "../models/availability.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { createNotification } from "./notification.controller.js";
import { sendOTPEmail } from "../utils/brevo.js";

const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

const generateAccessTokens = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        return { accessToken }
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating access token")
    }
}

const registerUser = asyncHandler(async (req, res) => {
    console.log("--- REGISTER USER DEBUG ---");
    console.log("req.files:", req.files);
    const {
        fullName, email, password, role, dateOfBirth, gender, mobileNo, address, pincode, locationCoords,
        specialty, timing, govtIdType, govtIdNumber, medicalCouncil, regYear, medicalRegNumber
    } = req.body;

    if ([fullName, email, password, dateOfBirth, gender, mobileNo].some((field) => !field || field.trim() === "")) {
        throw new ApiError(400, "Basic fields are required (fullName, email, password, dateOfBirth, gender, mobileNo)");
    }

    const existedUser = await User.findOne({ email });
    if (existedUser) {
        if (existedUser.isVerified) {
            throw new ApiError(409, "User with email already exists and is verified. Please login.");
        }
        // If not verified, we can allow them to "register" again which effectively resends the OTP
        // We'll delete the old unverified user to start fresh
        await User.findByIdAndDelete(existedUser._id);
        if (existedUser.role === "doctor") {
            await Doctor.findOneAndDelete({ user: existedUser._id });
        }
    }

    // handle files if any
    let profileImageLocalPath;
    if (req.files && Array.isArray(req.files.profileImage) && req.files.profileImage.length > 0) {
        profileImageLocalPath = req.files.profileImage[0].path;
    }

    const profileImageUpload = await uploadOnCloudinary(profileImageLocalPath);
    const profileImageUrl = profileImageUpload?.secure_url || profileImageUpload?.url || "";

    // If doctor, handle doctor specific files
    let govtIdPhotoLocalPath, medicalLicenseLocalPath, registrationCertLocalPath;
    let govtIdPhotoUpload, medicalLicenseUpload, registrationCertUpload;

    if (role === "doctor") {
        if (req.files && Array.isArray(req.files.govtIdPhoto) && req.files.govtIdPhoto.length > 0) {
            govtIdPhotoLocalPath = req.files.govtIdPhoto[0].path;
            govtIdPhotoUpload = await uploadOnCloudinary(govtIdPhotoLocalPath);
        }
        if (req.files && Array.isArray(req.files.medicalLicense) && req.files.medicalLicense.length > 0) {
            medicalLicenseLocalPath = req.files.medicalLicense[0].path;
            medicalLicenseUpload = await uploadOnCloudinary(medicalLicenseLocalPath);
        }
        if (req.files && Array.isArray(req.files.registrationCert) && req.files.registrationCert.length > 0) {
            registrationCertLocalPath = req.files.registrationCert[0].path;
            registrationCertUpload = await uploadOnCloudinary(registrationCertLocalPath);
        }
    }

    // safely parse location coords if sent as string (from FormData)
    let parsedCoords = locationCoords;
    if (typeof locationCoords === 'string') {
        try { parsedCoords = JSON.parse(locationCoords); } catch (e) {}
    }
    
    // safely parse timing if sent as string
    let parsedTiming = timing;
    if(typeof timing === 'string') {
        try { parsedTiming = JSON.parse(timing); } catch (e) {}
    }


    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    const user = await User.create({
        name: fullName,
        email,
        password,
        role: role || "patient",
        dateOfBirth,
        gender,
        mobileNo,
        address,
        pincode,
        locationCoords: parsedCoords,
        profileImage: profileImageUrl,
        status: "active",
        otp,
        otpExpiry,
        isVerified: false
    });

    let doctorProfile = null;
    if (role === "doctor") {
        doctorProfile = await Doctor.create({
            user: user._id,
            specialty,
            timing: parsedTiming,
            govtIdType,
            govtIdNumber,
            govtIdPhoto: govtIdPhotoUpload?.secure_url || govtIdPhotoUpload?.url || "",
            medicalCouncil,
            regYear,
            medicalRegNumber,
            medicalLicense: medicalLicenseUpload?.secure_url || medicalLicenseUpload?.url || "",
            registrationCert: registrationCertUpload?.secure_url || registrationCertUpload?.url || "",
            status: "pending"
        });


        // Initialize availability for the next 7 days if timing is provided
        if (parsedTiming && parsedTiming.days && parsedTiming.startTime && parsedTiming.endTime) {
            const today = new Date();
            for (let i = 0; i < 7; i++) {
                const date = new Date(today);
                date.setDate(today.getDate() + i);
                const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });

                if (parsedTiming.days.includes(dayName)) {
                    const dateString = date.toISOString().split('T')[0];
                    
                    // Simple slot generation logic (every 30 mins)
                    const slots = [];
                    let [startH, startM] = parsedTiming.startTime.split(':').map(Number);
                    let [endH, endM] = parsedTiming.endTime.split(':').map(Number);
                    
                    let current = new Date(0,0,0, startH, startM);
                    const end = new Date(0,0,0, endH, endM);
                    
                    while (current < end) {
                        slots.push({
                            time: current.toTimeString().substring(0, 5),
                            isBooked: false
                        });
                        current.setMinutes(current.getMinutes() + 30);
                    }

                    await Availability.create({
                        doctorId: doctorProfile._id,
                        date: dateString,
                        slots
                    });
                }
            }
        }
    }

    // Send OTP Email
    try {
        await sendOTPEmail(email, fullName, otp);
    } catch (error) {
        console.error("Failed to send OTP email during registration:", error);
    }

    const createdUser = await User.findById(user._id).select("-password -otp -otpExpiry");

    return res.status(201)
        .json(new ApiResponse(201, { user: createdUser, doctor: doctorProfile }, "Registration successful. Please verify your email with the OTP sent."));
});

const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
        throw new ApiError(400, "email and password is required");
    }

    const user = await User.findOne({ email });
    if (!user) {
        throw new ApiError(404, "User does not exist");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials");
    }

    if (!user.isVerified) {
        throw new ApiError(403, "Please verify your email before logging in. Check your email for OTP.");
    }

    const { accessToken } = await generateAccessTokens(user._id);

    const loggedInUser = await User.findById(user._id).select("-password");

    const isProduction = process.env.NODE_ENV === "production";
    const options = { httpOnly: true, secure: isProduction };

    let doctorProfile = null;
    if (user.role === "doctor") {
        doctorProfile = await Doctor.findOne({ user: user._id });
    }

    // Build a combined user object for the frontend (includes doctorProfile inline)
    const userData = loggedInUser.toObject ? loggedInUser.toObject() : { ...loggedInUser };
    if (doctorProfile) {
        userData.doctorProfile = doctorProfile;
    }

    return res.status(200)
        .cookie("accessToken", accessToken, options)
        .json(new ApiResponse(200, { user: userData, doctor: doctorProfile, accessToken }, "User logged In Successfully"));
});

const logoutUser = asyncHandler(async (req, res) => {
    const isProduction = process.env.NODE_ENV === "production";
    const options = { httpOnly: true, secure: isProduction };
    return res.status(200)
        .clearCookie("accessToken", options)
        .json(new ApiResponse(200, {}, "User logged Out"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
    let user = req.user.toObject();
    if (user.role === "doctor") {
        const doctorProfile = await Doctor.findOne({ user: user._id }).lean();
        if (doctorProfile) {
            user.doctorProfile = doctorProfile;
        }
    }
    return res.status(200).json(new ApiResponse(200, user, "Current user fetched successfully"));
});

const getMe = asyncHandler(async (req, res) => {
    const { email } = req.query;
    if (!email) {
        throw new ApiError(400, "Email query parameter is required");
    }

    const user = await User.findOne({ email }).select("-password").lean();
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    if (user.role === "doctor") {
        const doctorProfile = await Doctor.findOne({ user: user._id }).lean();
        if (doctorProfile) {
            user.doctorProfile = doctorProfile;
        }
    }

    return res.status(200).json(new ApiResponse(200, user, "User fetched successfully"));
});

const getAllDoctors = asyncHandler(async(req, res) => {
    const doctors = await Doctor.find({ status: "approved" }).populate("user", "-password");
    return res.status(200).json(new ApiResponse(200, doctors, "Doctors fetched successfully"));
})

const getPendingDoctors = asyncHandler(async(req, res) => {
    const doctors = await Doctor.find({ status: "pending" }).populate("user", "-password");
    return res.status(200).json(new ApiResponse(200, doctors, "Pending doctors fetched"));
})

const approveDoctor = asyncHandler(async(req, res) => {
    const { doctorId } = req.params; // This is the Doctor record ID
    const { status } = req.body; // "approved", "rejected", or "pending"
    const newStatus = status || "approved";
    const doctor = await Doctor.findByIdAndUpdate(doctorId, { status: newStatus }, { new: true }).populate("user", "-password");
    if (!doctor) {
        throw new ApiError(404, "Doctor profile not found");
    }

    // Notify the doctor about the status change
    if (doctor.user?._id && (newStatus === "approved" || newStatus === "rejected")) {
        const isApproved = newStatus === "approved";
        createNotification({
            userId:  doctor.user._id,
            icon:    isApproved ? "🎉" : "❌",
            type:    "profile_status",
            message: isApproved
                ? "🎉 Your doctor profile has been APPROVED by the admin! You can now receive patient appointments."
                : "Your doctor profile has been REJECTED by the admin. Please contact support for more information.",
        }).catch(e => console.error("notify doctor:", e.message));
    }

    return res.status(200).json(new ApiResponse(200, doctor, `Doctor status updated to ${newStatus}`));
})


const getAllUsers = asyncHandler(async(req, res) => {
    // Fetch all users and for those with role 'doctor', link their doctor profile
    const users = await User.find({}).select("-password").lean();
    
    const usersWithProfiles = await Promise.all(users.map(async (user) => {
        if (user.role === "doctor") {
            const doctorProfile = await Doctor.findOne({ user: user._id }).lean();
            return { ...user, doctorProfile };
        }
        return user;
    }));

    return res.status(200).json(new ApiResponse(200, usersWithProfiles, "Users fetched successfully"));
})

const verifyOTP = asyncHandler(async (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        throw new ApiError(400, "Email and OTP are required");
    }

    const user = await User.findOne({ email });

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    if (user.isVerified) {
        throw new ApiError(400, "User is already verified");
    }

    console.log(`Verifying OTP for ${email}. Provided: [${otp}], Stored: [${user.otp}]`);

    if (String(user.otp) !== String(otp)) {
        throw new ApiError(400, "Invalid OTP");
    }

    if (user.otpExpiry < new Date()) {
        throw new ApiError(400, "OTP has expired. Please request a new one.");
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save({ validateBeforeSave: false });

    // Generate token so they are logged in after verification
    const { accessToken } = await generateAccessTokens(user._id);
    const options = { httpOnly: true, secure: process.env.NODE_ENV === "production" };

    // Create welcome notification since they are now verified
    createNotification({
        userId: user._id,
        icon: "👋",
        type: "welcome",
        message: `Welcome to Aurelyf Care, ${user.name}! Your email has been verified.`,
    }).catch(err => console.error("Welcome notification error:", err));

    let doctorProfile = null;
    if (user.role === "doctor") {
        doctorProfile = await Doctor.findOne({ user: user._id });
    }

    return res.status(200)
        .cookie("accessToken", accessToken, options)
        .json(new ApiResponse(200, { user, doctor: doctorProfile, accessToken }, "Email verified successfully"));
});

const resendOTP = asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email) {
        throw new ApiError(400, "Email is required");
    }

    const user = await User.findOne({ email });

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    if (user.isVerified) {
        throw new ApiError(400, "User is already verified");
    }

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save({ validateBeforeSave: false });

    try {
        await sendOTPEmail(email, user.name, otp);
    } catch (error) {
        throw new ApiError(500, "Failed to send OTP email");
    }

    return res.status(200).json(new ApiResponse(200, {}, "OTP resent successfully"));
});

const updateProfile = asyncHandler(async (req, res) => {
    // This route accepts multipart/form-data via multer
    // req.file  = profileImage (if sent)
    // req.body  = other text fields (address, pincode, mobileNo, consultingFee, timing)

    const user = await User.findById(req.user._id);
    if (!user) throw new ApiError(404, "User not found");

    console.log("Updating profile for user:", user.email, "Role:", user.role);

    // ── Upload profile image to Cloudinary if provided ────────────────────────
    if (req.file) {
        console.log("File received by multer:", req.file.path);
        const uploaded = await uploadOnCloudinary(req.file.path);
        const imageUrl = uploaded?.secure_url || uploaded?.url;
        if (imageUrl) {
            console.log("Cloudinary upload success:", imageUrl);
            user.profileImage = imageUrl;
        } else {
            console.error("Cloudinary upload failed or returned no URL/secure_url");
        }
    }

    // ── Update plain text fields (only if provided in body) ──────────────────
    if (req.body.address   !== undefined) user.address   = req.body.address;
    if (req.body.pincode   !== undefined) user.pincode   = req.body.pincode;
    if (req.body.mobileNo  !== undefined) user.mobileNo  = req.body.mobileNo;

    console.log("Fields to save:", {
        profileImage: user.profileImage,
        address: user.address,
        pincode: user.pincode,
        mobileNo: user.mobileNo
    });

    await user.save({ validateBeforeSave: false });
    console.log("User model saved successfully");

    // ── If doctor, also update Doctor profile fields ──────────────────────────
    if (user.role === "doctor") {
        const doctor = await Doctor.findOne({ user: user._id });
        if (doctor) {
            if (req.body.address !== undefined) {
                doctor.address = req.body.address;
            }
            if (req.body.consultingFee !== undefined) {
                doctor.consultingFee = req.body.consultingFee === "" ? null : Number(req.body.consultingFee);
            }
            if (req.body.timing) {
                let timing = req.body.timing;
                if (typeof timing === "string") {
                    try { timing = JSON.parse(timing); } catch (e) {}
                }
                doctor.timing = timing;
            }
            await doctor.save();
        }
    }

    // Return fresh user (with doctorProfile merged in)
    const fresh = await User.findById(user._id).select("-password").lean();
    if (fresh.role === "doctor") {
        const dp = await Doctor.findOne({ user: fresh._id }).lean();
        if (dp) fresh.doctorProfile = dp;
    }

    return res.status(200).json(new ApiResponse(200, fresh, "Profile updated successfully"));
});

export { 
    registerUser, 
    loginUser, 
    logoutUser, 
    getCurrentUser,
    getMe,
    getAllDoctors,
    getPendingDoctors,
    approveDoctor,
    getAllUsers,
    updateProfile,
    verifyOTP,
    resendOTP
};
