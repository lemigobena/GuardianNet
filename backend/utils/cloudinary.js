import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

cloudinary.config({
    // Automatically picks up CLOUDINARY_URL from .env
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'guardian_evidence',
        allowedFormats: ['jpg', 'png', 'pdf', 'mp4'],
    },
});

export const uploadAction = multer({ storage: storage });
export default cloudinary;
