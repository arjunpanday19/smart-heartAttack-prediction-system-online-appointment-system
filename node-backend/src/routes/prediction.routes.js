import { Router } from "express";
import { savePrediction, getPatientPredictions } from "../controllers/prediction.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT); // Protect all prediction routes

router.route("/").post(savePrediction);
router.route("/patient").get(getPatientPredictions);

export default router;
