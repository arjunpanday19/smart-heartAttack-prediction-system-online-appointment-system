import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  getNotifications,
  markReadOne,
  markReadAll,
} from "../controllers/notification.controller.js";

const router = Router();

// All notification routes require authentication
router.use(verifyJWT);

router.get("/",             getNotifications); // GET  /api/v1/notifications
router.patch("/read-all",   markReadAll);      // PATCH /api/v1/notifications/read-all
router.patch("/:id/read",   markReadOne);      // PATCH /api/v1/notifications/:id/read

export default router;
