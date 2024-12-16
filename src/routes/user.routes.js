import { Router } from "express"
const router = Router()
import {upload} from "../middlewares/multer.middleware.js"
import { verifyJwt } from "../middlewares/auth.middleware.js"

import {loginUser, logoutUser, registerUser} from "../controllers/user.controller.js"


router.route("/register")
.post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser
)

router.route("/login").post(loginUser)


//*Protected routes
router.route("/logout").post(
    verifyJwt,
    logoutUser
)
export default router