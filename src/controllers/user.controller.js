import asyncHandler from "../utils/asyncHandler.js"
import apiError from "../utils/apiError.js"
import {User} from "../models/user.model.js"
import uploadOnCloudinary from "../utils/cloudinary.js"
import apiResponse from "../utils/apiResponse.js"

const generateAccessAndRefreshTokens = async (userId)=>{
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        console.log({
            accessToken
        })
        const refreshToken =user.generateRefreshToken()
        user.refreshToken = refreshToken
        await user.save({validateBeforeSave : false})
        return {accessToken, refreshToken}
    } catch (error) {
        throw new apiError(500, error.message)
    }
}


const registerUser = asyncHandler(async (req,res)=>{
    const {
        username,
        email,
        fullName,
        password,
    }=req.body;

    //   if (!username || !email || !fullName || !password) {
    //     throw new apiError(400, "All fields are required")
    //     }
    
    //* below is given a better approach for that same thing

    if (
        [fullName,email,username,password].some((field)=>field?.trim() === "")
    ) {
        throw new apiError(400, "All fields are required")
    }
    
    //* checking format of the email using regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if(!emailRegex.test(email)){
        throw new apiError(422, "please enter a valid email address")
    }
    //* checking format of the passwprd using regex
    // const passwordRegex= /^[a-zA-Z0-9]+$/;
    // if(!passwordRegex.test(password)){
    //     throw new apiError(422, "please use a alphanumeric password ")
    // }

    //* checking if the user already exists
    const existingUser = await User.findOne({
        $or: [{username}, {email}]
    })

    if(existingUser){
        throw new apiError(409, "User with email or username already exists")
    }
    // const avatarLocalPath = req.files?.avatar[0]?.path;
    let avatarLocalPath;
    if (req.files && Array.isArray(req.files.avatar) && req.files.avatar.length>0) {
        avatarLocalPath = req.files.avatar[0].path
    }
    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0 ){
        coverImageLocalPath=req.files.coverImage[0].path
    }

    if (!avatarLocalPath) {
        throw new apiError(400, "Avatar image is required")
    }

    const avatarCloudinaryPath = await uploadOnCloudinary(avatarLocalPath)
    const coverImageCloudinaryPath= await uploadOnCloudinary(coverImageLocalPath)

    if (!avatarCloudinaryPath) {
        throw new apiError(400,"Avatar field is required")
    }

    //*creating user
    const user =await User.create({
        fullName,
        avatar: avatarCloudinaryPath.url,
        coverImage: coverImageCloudinaryPath?.url,
        email: email.toLowerCase(),
        username: username.toLowerCase(),
        password
    })

    const createdUser = await User.findById(user._id).select("-password -refreshToken")

    if (!createdUser) {
        throw new apiError(500, "Error while registering user")
    }

    return res.status(201).json(new apiResponse(201,createdUser,"User registered successfully"))
})

const loginUser = asyncHandler( async (req,res)=>{
    const {username, email, password} = req.body;
    if (!(username || email)) {
        throw new apiError(400, "Username or email is missing")
    }
    const user =await User.findOne({
        $or:[{username}, {email}]
    })

    if (!user) {
        throw new apiError(404, "User does not exist")
    }

    const isPasswordCorrect = await user.isPasswordCorrect(password)

    if (!isPasswordCorrect) {
        throw new apiError(401,"Invalid user credentails")
    }

    const {accessToken, refreshToken}=await generateAccessAndRefreshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly : true,
        secure: true
    }

    return res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new apiResponse(200,{
            user: loggedInUser, accessToken, refreshToken
        },
        "User logged in successfully"
        )
    )
})

const logoutUser = asyncHandler(async (req,res)=>{
   const userId = req.user._id;
   await User.findByIdAndUpdate(
    userId,
    {
        $set: {
            refreshToken: undefined
        }
    },
    {
        new: true
    }
   )

   const options = {
    httpOnly: true,
    secure : true
   }

   return res
   .status(200)
   .clearCookie("accessToken",options)
   .clearCookie("refreshToken",options)
   .json(
    new apiResponse(200,{}, "User logged out successfully")
   )
})


export {registerUser, loginUser, logoutUser}