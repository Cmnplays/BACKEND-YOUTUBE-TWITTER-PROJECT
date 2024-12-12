import { v2 as cloudinary } from "cloudinary";
import fs from "fs"
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
});


const uploadOnCloudinary=async (localFilePath)=>{
    try {
        if (!localFilePath) {
            console.log("file path not correct")
            return null
        }
        const uploadRes=await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        console.log("file is uploaded on cloudinary ", uploadRes.url)
        return uploadRes
    } catch (error) {
        fs.unlinkSync(localFilePath)
        console.log("file unlinked or deleted")
        return null
    }
}

export default uploadOnCloudinary