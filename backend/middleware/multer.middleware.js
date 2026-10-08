import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ==============================
// BASE UPLOAD PATH (GLOBAL)
// ==============================
const BASE_UPLOAD_PATH = path.join(__dirname, '../uploads');


// ==============================
// FUNCTION TO CREATE MULTER INSTANCE
// ==============================
   const createUploader = (folderName, maxFileSize = 30 * 1024 * 1024) => {

    const uploadPath = path.join(BASE_UPLOAD_PATH, folderName);

    // auto create folder if not exists
    if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
    }

    const storage = multer.diskStorage({

        destination: function (req, file, cb) {
            cb(null, uploadPath);
        },

        filename: function (req, file, cb) {

            const uniqueName =
                Date.now() + '-' + Math.round(Math.random() * 1E9);

            cb(null, uniqueName + path.extname(file.originalname));
        }

    });

    return multer({
        storage,
        limits: {
            fileSize: maxFileSize
        }
    });

};

export default createUploader;