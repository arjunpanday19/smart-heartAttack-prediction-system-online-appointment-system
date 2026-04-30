import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { createContact, getContacts, updateContact, updateContactStatus } from "../controllers/contact.controller.js";

const router = Router();

router.route("/").post(createContact);
router.route("/").get(getContacts);           // Admin fetches without user JWT
router.route("/:id").patch(updateContact);    // Admin sends reply
router.route("/:contactId/status").patch(verifyJWT, updateContactStatus);

export default router;
