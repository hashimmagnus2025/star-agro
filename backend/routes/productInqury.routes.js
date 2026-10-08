import express from "express";
import { createInquiry, getInquiriesByUserId,getInquiriesByProductId } from "../controllers/productInqury.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const ProductInquiryrouter = express.Router();

ProductInquiryrouter.post("/", protect, createInquiry);

ProductInquiryrouter.get("/user", protect, getInquiriesByUserId);
ProductInquiryrouter.get("/product/:productId", getInquiriesByProductId);


export default ProductInquiryrouter;
