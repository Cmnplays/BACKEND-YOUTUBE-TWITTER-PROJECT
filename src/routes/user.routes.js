import { Router } from "express"
const router = Router()
import {upload} from "../middlewares/multer.middleware.js"
import { verifyJwt } from "../middlewares/auth.middleware.js"

import {loginUser, logoutUser, registerUser,refreshAccessToken,changeCurrentPassword,getCurrentUser,updateAccountDetails,updateAvatar,getUserChannelProfile,getWatchHistory} from "../controllers/user.controller.js"


router
.route("/register")
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

router
.route("/login")
.post(loginUser)


//*Protected routes
router
.route("/logout")
.post(
    verifyJwt,
    logoutUser
)

router
.route("/refresh-token")
.post(refreshAccessToken)

router
.route("/change-password")
.post(
    verifyJwt,
    changeCurrentPassword
)

router
.route("/current-user")
.post(
    verifyJwt, 
    getCurrentUser
)

router
.route("/update-account")
.patch(verifyJwt,
    updateAccountDetails
)

router
.route("/update-avater")
.patch(
     verifyJwt,
     upload.single("avatar"),
     updateAvatar
    )

router
.route("/cover-image")
.patch(
    verifyJwt,
     upload.single("coverImage")
    )

router
.route("/channel/:username")
.get(
    verifyJwt,
    getUserChannelProfile
)

router
.route("/history")
.get(
    verifyJwt,
    getWatchHistory
    )
export default router