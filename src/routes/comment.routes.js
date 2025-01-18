import { Router } from "express";
import {
  addComment,
  addTweetComment,
  deleteComment,
  getVideoComments,
  updateComment,
  getTweetComments,
  updateTweetComment,
  deleteTweetComment
} from "../controllers/comment.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router.route("/:videoId").get(getVideoComments).post(addComment);
router.route("/c/:commentId").delete(deleteComment).patch(updateComment);
router.route("/t/:tweetId").post(addTweetComment).get(getTweetComments);
router
  .route("/t/:commentId")
  .delete(deleteTweetComment)
  .patch(updateTweetComment);

export default router;
