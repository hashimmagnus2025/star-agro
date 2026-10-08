import { getServiceInquiriesByServiceId, getServiceInquiriesByUserId, createServiceInquiry } from "../models/serviceInqury.model.js";
import { getServiceById } from "../models/service.model.js";
import { getUserById } from "../models/user.model.js";
import { createNotification } from "../models/notification.model.js";
import { sendWhatsAppMessage } from "../utils/whatsapp.js";
import { resolveNotificationLang, newInquiryWhatsAppMessage } from "../utils/notificationMessages.js";

const FRONTEND_URL = (process.env.FRONTEND_URL);

export const createInquiry = async (req, res) => {
    try {
        const { service_id, name, email, phone, message } = req.body;
        const user_id = req.user.id;

        const targetService = await getServiceById(service_id);
        if (!targetService) {
            return res.status(404).json({ message: "Service not found" });
        }
        if (targetService.user_id && String(targetService.user_id) === String(user_id)) {
            return res.status(400).json({ message: "You can't send an inquiry for your own service" });
        }

        const inquiryData = {
            service_id,
            user_id,
            name,
            email,
            phone,
            message,
        };

        const inquiryId = await createServiceInquiry(inquiryData);

        const owner = targetService.user_id ? await getUserById(targetService.user_id) : null;
        const ownerPhone = owner?.phone || owner?.mobile || owner?.phone_number;
        const serviceName = targetService?.name || 'your service';

        if (owner) {
            try {
                await createNotification({
                    userId: owner.id,
                    type: 'inquiry',
                    title: 'New Inquiry Received',
                    message: `${name || 'Someone'} sent an inquiry for "${serviceName}": ${message}`,
                    data: { name: name || 'Someone', serviceName, message },
                });
            } catch (notificationError) {
                console.warn('Failed to save inquiry notification:', notificationError.message || notificationError);
            }
        }

        if (owner && ownerPhone) {
            const lang = resolveNotificationLang(owner.language);
            const inquiryMessage = newInquiryWhatsAppMessage(
                lang,
                serviceName,
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
        console.error("Error creating service inquiry:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getInquiriesByServiceId = async (req, res) => {
    try {
        const { serviceId } = req.params;
        const inquiries = await getServiceInquiriesByServiceId(serviceId);
        res.status(200).json(inquiries);
    }
    catch (error) {
        console.error("Error fetching inquiries by service ID:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getInquiriesByUserId = async (req, res) => {
    try {
        const userId = req.user.id;
        const inquiries = await getServiceInquiriesByUserId(userId);
        res.status(200).json(inquiries);
    }
    catch (error) {
        console.error("Error fetching inquiries by user ID:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
