import express from "express";
import { createInquiry, getInquiriesByUserId, getInquiriesByServiceId } from "../controllers/serviceInqury.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const ServiceInquiryrouter = express.Router();

ServiceInquiryrouter.post("/", protect, createInquiry);

ServiceInquiryrouter.get("/user", protect, getInquiriesByUserId);
ServiceInquiryrouter.get("/service/:serviceId", getInquiriesByServiceId);

export default ServiceInquiryrouter;
