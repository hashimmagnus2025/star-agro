import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { imageSize } from 'image-size';
import { insertAdvertisement, getAdvertisementById, getAllAdvertisements, getActiveAdvertisements, updateAdvertisement, deleteAdvertisement } from "../models/advertisement.model.js";
import { getAdvertisementSizeById } from "../models/advertisement.size.model.js";
import { getAdvertisementDurationById } from "../models/advertisement.duration.model.js";
import { getAdvertisementPriceBySizeAndDuration } from "../models/advertisement.price.model.js";
import { resolveUploadedFileUrl } from "../utils/bunny.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IMAGE_SIZE_TOLERANCE_PX = 5;

const parseImageSizeValue = (sizeValue) => {
    const match = /^(\d+)x(\d+)$/.exec(sizeValue || '');
    if (!match) return null;
    return { width: Number(match[1]), height: Number(match[2]) };
};

const getSavedImageDimensions = (imagePath) => {
    const absolutePath = path.join(__dirname, '..', imagePath);
    const buffer = fs.readFileSync(absolutePath);
    const { width, height } = imageSize(buffer);
    return { width, height };
};

const validateImageMatchesSize = (imagePath, image_size) => {
    // Already-uploaded CDN images (Bunny) were dimension-checked when first saved;
    // there's no local file left to re-read here, so only validate local uploads.
    if (/^https?:\/\//i.test(imagePath || '')) {
        return null;
    }

    const expected = parseImageSizeValue(image_size);
    if (!expected) {
        return 'Please select a valid image size';
    }

    const actual = getSavedImageDimensions(imagePath);
    if (
        Math.abs(actual.width - expected.width) > IMAGE_SIZE_TOLERANCE_PX ||
        Math.abs(actual.height - expected.height) > IMAGE_SIZE_TOLERANCE_PX
    ) {
        return `Selected size is ${expected.width}x${expected.height}px, but the image is ${actual.width}x${actual.height}px. Please upload an image matching the selected size.`;
    }

    return null;
};

const resolveSizeDurationPrice = async (adSizeId, adDurationId) => {
    if (!adSizeId || !adDurationId) {
        return { error: 'Please select a size and duration' };
    }

    const size = await getAdvertisementSizeById(adSizeId);
    if (!size || size.status !== 'Active') {
        return { error: 'Selected size is not available' };
    }

    const durationRow = await getAdvertisementDurationById(adDurationId);
    if (!durationRow || durationRow.status !== 'Active') {
        return { error: 'Selected duration is not available' };
    }

    const priceRow = await getAdvertisementPriceBySizeAndDuration(adSizeId, adDurationId);
    if (!priceRow) {
        return { error: 'No price configured for this size and duration combination' };
    }

    return {
        image_size: `${size.width}x${size.height}`,
        duration: durationRow.duration ? `${durationRow.duration} ${durationRow.label}` : durationRow.label,
        price: priceRow.price,
    };
};

export const createAdvertisement = async (req, res) => {
    try {
        const { title, description, keywords, status, startdate, enddate, tags, ad_size_id, ad_duration_id } = req.body;
        const uploadedFile = req.file;
        const localImage = uploadedFile ? `/uploads/advertisements/${uploadedFile.filename}` : null;

        const resolved = await resolveSizeDurationPrice(ad_size_id, ad_duration_id);
        if (resolved.error) {
            if (uploadedFile) fs.unlinkSync(uploadedFile.path);
            return res.status(400).json({ message: resolved.error });
        }

        if (localImage) {
            const validationError = validateImageMatchesSize(localImage, resolved.image_size);
            if (validationError) {
                fs.unlinkSync(uploadedFile.path);
                return res.status(400).json({ message: validationError });
            }
        }

        // Dimensions are validated against the local copy above (before it's pushed
        // to Bunny/removed), then this resolves to the CDN URL that actually gets saved.
        const image = uploadedFile ? await resolveUploadedFileUrl(uploadedFile, 'advertisements') : null;

        const advertisementId = await insertAdvertisement({
            title, description, image, image_size: resolved.image_size, keywords,
            duration: resolved.duration, price: resolved.price, status, startdate, enddate, tags,
            adSizeId: ad_size_id, adDurationId: ad_duration_id,
        });
        return res.status(201).json({ message: 'Advertisement created successfully', advertisementId });
    } catch (error) {
        console.error('Error creating advertisement:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export const getAdvertisements = async (req, res) => {
    try {
        const advertisements = await getAllAdvertisements();
        return res.status(200).json(advertisements);
    } catch (error) {
        console.error('Error fetching advertisements:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export const getActiveAdvertisementsController = async (req, res) => {
    try {
        const advertisements = await getActiveAdvertisements();
        return res.status(200).json(advertisements);
    } catch (error) {
        console.error('Error fetching active advertisements:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export const getAdvertisementByIds = async (req, res) => {
    try {
        const { id } = req.params;
        const advertisement = await getAdvertisementById(id);
        if (!advertisement) {
            return res.status(404).json({ message: 'Advertisement not found' });
        }
        return res.status(200).json(advertisement);
    } catch (error) {
        console.error('Error fetching advertisement:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

export const updateAdvertisementController = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, keywords, status, startdate, enddate, tags, ad_size_id, ad_duration_id } = req.body;
        const uploadedFile = req.file;

        const existingAdvertisement = await getAdvertisementById(id);
        if (!existingAdvertisement) {
            if (uploadedFile) fs.unlinkSync(uploadedFile.path);
            return res.status(404).json({ message: 'Advertisement not found' });
        }

        const finalSizeId = ad_size_id || existingAdvertisement.ad_size_id;
        const finalDurationId = ad_duration_id || existingAdvertisement.ad_duration_id;

        const resolved = await resolveSizeDurationPrice(finalSizeId, finalDurationId);
        if (resolved.error) {
            if (uploadedFile) fs.unlinkSync(uploadedFile.path);
            return res.status(400).json({ message: resolved.error });
        }

        const localImage = uploadedFile ? `/uploads/advertisements/${uploadedFile.filename}` : existingAdvertisement.image;

        if (localImage) {
            const validationError = validateImageMatchesSize(localImage, resolved.image_size);
            if (validationError) {
                if (uploadedFile) fs.unlinkSync(uploadedFile.path);
                return res.status(400).json({ message: validationError });
            }
        }

        const image = uploadedFile ? await resolveUploadedFileUrl(uploadedFile, 'advertisements') : existingAdvertisement.image;

        await updateAdvertisement(id, {
            title, description, image, image_size: resolved.image_size, keywords,
            duration: resolved.duration, price: resolved.price, status: status || existingAdvertisement.status,
            startdate, enddate, tags, adSizeId: finalSizeId, adDurationId: finalDurationId,
        });
        return res.status(200).json({ message: 'Advertisement updated successfully' });
    } catch (error) {
        console.error('Error updating advertisement:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export const deleteAdvertisementController = async (req, res) => {
    try {
        const { id } = req.params;
        const existingAdvertisement = await getAdvertisementById
            (id);
        if (!existingAdvertisement) {
            return res.status(404).json({ message: 'Advertisement not found' });
        }
        await deleteAdvertisement(id);
        return res.status(200).json({ message: 'Advertisement deleted successfully' });
    } catch (error) {
        console.error('Error deleting advertisement:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};





