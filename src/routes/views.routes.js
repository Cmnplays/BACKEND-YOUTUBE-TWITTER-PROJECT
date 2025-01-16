import { Router } from "express";
const router = Router();
import {
  increamentVideoViews,
  increamentTweetViews
} from "../controllers/views.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

router.use(verifyJWT);
router.route("/v/:videoId").get(increamentVideoViews);
router.route("/t/:tweetId").get(increamentTweetViews);
export default router;
