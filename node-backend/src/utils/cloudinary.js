import {v2 as cloudinary} from "cloudinary"
import fs from "fs"
import dotenv from "dotenv"

dotenv.config()

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) {
            console.warn("uploadOnCloudinary: No localFilePath provided");
            return null;
        }
        
        console.log("uploadOnCloudinary: Attempting upload for", localFilePath);
        
        //upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        
        console.log("uploadOnCloudinary: Upload successful, public_id:", response.public_id);
        
        if (fs.existsSync(localFilePath)) fs.unlinkSync(localFilePath)
        return response;

    } catch (error) {
        console.error("uploadOnCloudinary: Upload failed", error.message);
        if (fs.existsSync(localFilePath)) fs.unlinkSync(localFilePath) // remove the locally saved temporary file as the upload operation got failed
        return null;
    }
}

export {uploadOnCloudinary}
