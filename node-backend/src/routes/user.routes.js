import { Router } from "express";
import { 
    registerUser, 
    loginUser, 
    logoutUser, 
    getCurrentUser,
    getMe,
    getAllDoctors,
    getPendingDoctors,
    approveDoctor,
    getAllUsers,
    updateProfile
} from "../controllers/user.controller.js";
import { upload, uploadImage } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
    upload.fields([
        { name: "profileImage", maxCount: 1 },
        { name: "govtIdPhoto", maxCount: 1 },
        { name: "medicalLicense", maxCount: 1 },
        { name: "registrationCert", maxCount: 1 }
    ]),
    registerUser
);

router.route("/login").post(loginUser);

// secured routes
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/current-user").get(verifyJWT, getCurrentUser);
router.route("/me").get(getMe); // public route to check fresh user status
router.route("/doctors").get(getAllDoctors); // public route for listing doctors
router.route("/all").get(verifyJWT, getAllUsers);

// profile update (both patient and doctor) — multipart/form-data
router.route("/update-profile").patch(
    verifyJWT,
    uploadImage.single("profileImage"),  // images only (jpeg, png, webp), max 5MB
    updateProfile
);

// admin routes
router.route("/admin/pending-doctors").get(verifyJWT, getPendingDoctors);
router.route("/admin/approve-doctor/:doctorId").patch(verifyJWT, approveDoctor);

export default router;
