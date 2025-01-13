import { Router } from "express";
const router = Router();
import { increamentViews } from "../controllers/views.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

router.use(verifyJWT);
router.route("/increament/:videoId").get(increamentViews);
export default router;
