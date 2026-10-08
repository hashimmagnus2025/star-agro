import { getProductInquiriesByProductId, getProductInquiriesByUserId, createProductInquiry } from "../models/productInqury.model.js";
import { getProductById } from "../models/product.model.js";
import { getUserById } from "../models/user.model.js";
import { createNotification } from "../models/notification.model.js";
import { sendWhatsAppMessage } from "../utils/whatsapp.js";
import { resolveNotificationLang, newInquiryWhatsAppMessage } from "../utils/notificationMessages.js";

const FRONTEND_URL = (process.env.FRONTEND_URL );

export const createInquiry = async (req, res) => {
    try {
        const { product_id, name, email, phone, message } = req.body;
        const user_id = req.user.id; // Assuming you have user authentication and the user ID is available in req.user

        const targetProduct = await getProductById(product_id);
        if (!targetProduct) {
            return res.status(404).json({ message: "Product not found" });
        }
        if (targetProduct.user_id && String(targetProduct.user_id) === String(user_id)) {
            return res.status(400).json({ message: "You can't send an inquiry for your own product or crop" });
        }

        const inquiryData = {
            product_id,
            user_id,
            name,
            email,
            phone,
            message,
        };

        const inquiryId = await createProductInquiry(inquiryData);

        const product = targetProduct;
        const owner = product ? await getUserById(product.user_id) : null;
        const ownerPhone = owner?.phone || owner?.mobile || owner?.phone_number;
        const productName = product?.name || 'your product';

        if (owner) {
            try {
                await createNotification({
                    userId: owner.id,
                    type: 'inquiry',
                    title: 'New Inquiry Received',
                    message: `${name || 'Someone'} sent an inquiry for "${productName}": ${message}`,
                    productId: product_id,
                    data: { name: name || 'Someone', productName, message },
                });
            } catch (notificationError) {
                console.warn('Failed to save inquiry notification:', notificationError.message || notificationError);
            }
        }

        if (owner && ownerPhone) {
            const lang = resolveNotificationLang(owner.language);
            const inquiryMessage = newInquiryWhatsAppMessage(
                lang,
                productName,
                message,
                `${FRONTEND_URL}/user/my-inquiries`
            );

            try {
                await sendWhatsAppMessage(ownerPhone, `Star Agro: ${inquiryMessage}`);
            } catch (whatsappError) {
                console.warn('Failed to send inquiry WhatsApp notification:', whatsappError?.response?.data || whatsappError.message || whatsappError);
            }
        }

        res.status(201).json({ message: "Inquiry created successfully", inquiryId });
    }
    catch (error) {
        console.error("Error creating inquiry:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getInquiriesByProductId = async (req, res) => {
    try {
        const { productId } = req.params;
        const inquiries = await getProductInquiriesByProductId(productId);
        res.status(200).json(inquiries);
    }
    catch (error) {
        console.error("Error fetching inquiries by product ID:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getInquiriesByUserId = async (req, res) => {
    try {
        const userId = req.user.id; // Assuming you have user authentication and the user ID is available in req.user
        const inquiries = await getProductInquiriesByUserId(userId);
        res.status(200).json(inquiries);
    }
    catch (error) {
        console.error("Error fetching inquiries by user ID:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};



