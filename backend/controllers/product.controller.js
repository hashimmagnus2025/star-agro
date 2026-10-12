import {
  insertProduct,
  getAllProducts,
  getProductsByUserId,
  getProductsByOwnerDistrict,
  getProductsByOwnerTaluka,
  getProductsByOwnerTalukaNames,
  getProductsByOwnerVillageNames,
  getProductById,
  updateProduct,
  updateProductStatus,
  updateProductActive,
  deleteProduct,
  getProductsByCategory,
  getProductsBySubCategory,
  getProductsBySubSubCategory,
  markProductForDestroy,
  claimProductDestroy,
  getOpenDestroyListings,
  reactivateCropForNewHarvestCycle,
} from '../models/product.model.js';
import { getAllNotificationTokens } from '../models/tokensave.model.js';
import { getUserById, getUsersByRole } from '../models/user.model.js';
import {
  getJurisdictionByUserId,
  resolveScopeNames,
  getAssignedTalukaNamesForJurisdiction,
  getAssignedVillageNamesForJurisdiction,
} from '../models/jurisdiction.model.js';
import { normalizeVillageManagedUserRole } from '../utils/villageManagedRoles.js';
import { createNotification } from '../models/notification.model.js';
import { sendFCMNotifications } from '../utils/fcm.js';
import { sendWhatsAppMessage } from '../utils/whatsapp.js';
import { compressVideoInPlace, COMPRESS_VIDEO_THRESHOLD_BYTES } from '../utils/videoCompress.js';
import { isBunnyConfigured, uploadFileToBunny } from '../utils/bunny.js';
import fs from 'fs';
import axios from 'axios';
import {
  resolveNotificationLang,
  productApprovedMessage,
  productRejectedMessage,
  destroyAlertMessage as buildDestroyAlertMessage,
  destroyClaimedMessage as buildDestroyClaimedMessage,
} from '../utils/notificationMessages.js';
import path from 'path';
import { isProfileComplete } from '../middleware/profile.middleware.js';

const DESTROY_NOTIFY_ROLE = 'Enterprenure/Treder';

const normalizeNumber = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

// Accepts 'YYYY-MM-DD' or a full ISO datetime string (e.g. from a stale form value) and
// returns a plain date MySQL's DATE columns accept, or null. Guards against
// "Incorrect date value" crashes if a full timestamp ever slips through from the client.
const normalizeDateOnly = (value) => {
  if (!value) return null;
  const str = String(value).slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(str) ? str : null;
};

const DESTROY_ALERT_RADIUS_KM = 25;
const EARTH_RADIUS_KM = 6371;

// Great-circle distance between two lat/long points, in km.
const distanceInKm = (lat1, lon1, lat2, lon2) => {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// A product only becomes publicly visible once its owner has moved past the default
// 'user' role (picked Farmer/Enterprenure-Treder on their profile) AND filled in the same
// profile fields requireCompleteProfile used to gate submission on — submission itself no
// longer blocks on this, so the gate moved here instead.
const isOwnerVerifiedSeller = (product) => {
  const role = String(product?.owner_role || '').trim().toLowerCase();
  if (!role || role === 'user') return false;

  return isProfileComplete({
    first_name: product?.owner_first_name,
    last_name: product?.owner_last_name,
    email: product?.owner_email,
    phone: product?.farmer_phone,
    gender: product?.owner_gender,
    state: product?.seller_state,
    district: product?.seller_district,
    taluka: product?.seller_taluka,
    village: product?.seller_village,
    address: product?.owner_address,
    has_solar_dryer: product?.owner_has_solar_dryer,
    how_know_about_us: product?.owner_how_know_about_us,
  });
};

const isActiveProduct = (product) => {
  const status = String(product?.status || 'Pending').trim().toLowerCase();
  const isActiveFlag = product?.is_active === undefined || product?.is_active === null || Number(product.is_active) === 1;
  return status === 'approved' && isActiveFlag && isOwnerVerifiedSeller(product);
};

export const resolveProductsForRequest = async ({ isAdmin, getAllProductsFn }) => {
  const products = await getAllProductsFn();
  const list = Array.isArray(products) ? products : [];
  if (isAdmin) {
    return list;
  }

  return list.filter(isActiveProduct);
};

// Uploads a locally-saved file to Bunny CDN when configured and removes the local
// copy afterwards; falls back to the local /uploads URL if Bunny isn't set up or
// the upload fails, so a product save never gets blocked by a CDN outage.
const pushToBunnyOrLocal = async (localPath, localFilename, remoteFolder) => {
  if (isBunnyConfigured()) {
    try {
      const cdnUrl = await uploadFileToBunny(localPath, remoteFolder, localFilename);
      fs.unlink(localPath, () => {});
      return cdnUrl;
    } catch (uploadError) {
      console.error('Bunny upload failed, falling back to local storage:', uploadError.message || uploadError);
    }
  }
  return `/uploads/products/${localFilename}`;
};

// Re-encodes the uploaded video down to ~3-4MB when it's meaningfully larger than
// that, then uploads it to Bunny CDN (or /uploads locally as a fallback). Small
// clips are left as-is. Compression failures fall back to the original upload
// rather than blocking the whole product save.
const resolveVideoUrl = async (videoFile, fallbackUrl) => {
  if (!videoFile) {
    return fallbackUrl || null;
  }

  let localPath = videoFile.path;
  let localFilename = videoFile.filename;

  if (videoFile.size > COMPRESS_VIDEO_THRESHOLD_BYTES) {
    try {
      const finalPath = await compressVideoInPlace(videoFile.path);
      localPath = finalPath;
      localFilename = path.basename(finalPath);
    } catch (compressionError) {
      console.error('Video compression failed, keeping original upload:', compressionError.message || compressionError);
    }
  }

  return pushToBunnyOrLocal(localPath, localFilename, 'products/videos');
};

const resolveImageUrl = async (imageFile, fallbackUrl) => {
  if (!imageFile) return fallbackUrl || null;
  return pushToBunnyOrLocal(imageFile.path, imageFile.filename, 'products/images');
};

export const createProduct = async (req, res) => {
  try {
    const {
      name,
      name_hindi,
      name_marathi,
      description,
      price,
      category_id,
      sub_category_id,
      sub_sub_category_id,
      stock_quantity,
      image_url,
      is_dehydrated,
      product_type,
      min_quantity,
      max_quantity,
      quantity_unit,
      is_processed,
      product_video,
      status,
      tags,
      type,
      planting_crops_date,
      harvesting_start_date,
      harvesting_end_date,
      type_of_crop,
      upload_latitude,
      upload_longitude,
      recaptchaToken,
      user_id,
    } = req.body;

    // Admin/super_admin can upload a product on behalf of another user via the admin
    // Products form's user dropdown. A Village Representative can do the same, but only
    // for a user/farmer/trader account within their own assigned village; everyone else
    // always owns what they create.
    const isAdminCreator = req.user?.role === 'admin' || req.user?.role === 'super_admin';
    let ownerUserId = req.user?.id || null;

    if (isAdminCreator && user_id) {
      ownerUserId = Number(user_id);
    } else if (!isAdminCreator && user_id && Number(user_id) !== req.user?.id) {
      const jurisdiction = await getJurisdictionByUserId(req.user.id);
      if (jurisdiction?.scope_type !== 'village') {
        return res.status(403).json({ message: 'You do not have permission to create a product for another user.' });
      }

      const [targetUser, scopeNames] = await Promise.all([
        getUserById(user_id),
        resolveScopeNames(jurisdiction),
      ]);

      const isSameVillage = targetUser
        && targetUser.village === scopeNames.village_name
        && targetUser.taluka === scopeNames.taluka_name
        && targetUser.district === scopeNames.district_name;

      if (!isSameVillage || !normalizeVillageManagedUserRole(targetUser.role)) {
        return res.status(403).json({ message: 'You can only create products for user, farmer, or trader accounts in your own village.' });
      }

      ownerUserId = Number(user_id);
    }

    if (process.env.RECAPTCHA_SECRET_KEY) {
      if (!recaptchaToken) {
        return res.status(400).json({ message: 'Please verify you are not a robot.' });
      }

      const verifyResponse = await axios.post('https://www.google.com/recaptcha/api/siteverify', null, {
        params: { secret: process.env.RECAPTCHA_SECRET_KEY, response: recaptchaToken },
      });

      if (!verifyResponse.data.success) {
        return res.status(400).json({ message: 'reCAPTCHA verification failed. Please try again.' });
      }
    }

    const normalizedType = String(type || '').trim();
    const requiresCategory = normalizedType !== 'Nursery' && normalizedType !== 'Animal' && normalizedType !== 'nursery' && normalizedType !== 'animal';

    if (!name || (requiresCategory && (category_id === undefined || category_id === null || category_id === ''))) {
      return res.status(400).json({ message: 'Product name and category are required' });
    }

    // Handle image upload
    const imageFile = req.files?.image?.[0];
    const resolvedImageUrl = await resolveImageUrl(imageFile, image_url);

    // Handle video upload (re-encoded down to ~3-4MB if the raw upload is bigger)
    const videoFile = req.files?.product_video?.[0];
    const resolvedVideoUrl = await resolveVideoUrl(videoFile, product_video);

    const result = await insertProduct({
      name,
      name_hindi: name_hindi || null,
      name_marathi: name_marathi || null,
      description,
      price: Number(price),
      category_id: normalizeNumber(category_id),
      sub_category_id: normalizeNumber(sub_category_id),
      sub_sub_category_id: normalizeNumber(sub_sub_category_id),
      stock_quantity: normalizeNumber(stock_quantity) || 0,
      image_url: resolvedImageUrl,
      user_id: ownerUserId,
      is_dehydrated: is_dehydrated === 'true' || is_dehydrated === true || is_dehydrated === 1,
      product_type: product_type || null,
      min_quantity: normalizeNumber(min_quantity) || 0,
      max_quantity: normalizeNumber(max_quantity) || 0,
      quantity_unit: quantity_unit || 'kg',
      is_processed: is_processed === 'true' || is_processed === true || is_processed === 1,
      product_video: resolvedVideoUrl,
      status: 'Pending',
      tags: tags ? (typeof tags === 'string' ? tags.split(',').map(t => t.trim()) : tags) : null,
      type: type || 'Product',
      planting_crops_date: normalizeDateOnly(planting_crops_date),
      harvesting_start_date: normalizeDateOnly(harvesting_start_date),
      harvesting_end_date: normalizeDateOnly(harvesting_end_date),
      type_of_crop: type_of_crop || null,
      upload_latitude: normalizeNumber(upload_latitude),
      upload_longitude: normalizeNumber(upload_longitude),
    });

    const productId = result[0].insertId;

    try {
      const notificationTokens = await getAllNotificationTokens();
      const targetTokens = notificationTokens
        .filter((item) => item.fcm_token)
        .filter((item) => item.user_id !== req.user?.id)
        .map((item) => item.fcm_token);

      if (targetTokens.length) {
        const isCrop = String(type || '').toLowerCase() === 'crop';
        await sendFCMNotifications(
          targetTokens,
          isCrop ? 'New crop added' : 'New product added',
          `${req.user?.name || 'A seller'} added a new ${isCrop ? 'crop' : 'product'}: ${name}`,
          {
            productId,
            type: isCrop ? 'new_crop' : 'new_product',
          }
        );
      }
    } catch (notificationError) {
      console.error('Failed to send new product notifications:', notificationError);
    }

    return res.status(201).json({
      message: 'Product created successfully',
      productId,
      product: {
        id: productId,
        name,
        name_hindi: name_hindi || null,
        name_marathi: name_marathi || null,
        description: description || null,
        price: Number(price),
        category_id: normalizeNumber(category_id),
        sub_category_id: normalizeNumber(sub_category_id),
        sub_sub_category_id: normalizeNumber(sub_sub_category_id),
        stock_quantity: normalizeNumber(stock_quantity) || 0,
        image_url: resolvedImageUrl,
        user_id: ownerUserId,
        is_dehydrated: is_dehydrated === 'true' || is_dehydrated === true || is_dehydrated === 1,
        product_type: product_type || null,
        min_quantity: normalizeNumber(min_quantity) || 0,
        max_quantity: normalizeNumber(max_quantity) || 0,
        quantity_unit: quantity_unit || 'kg',
        is_processed: is_processed === 'true' || is_processed === true || is_processed === 1,
        product_video: resolvedVideoUrl,
        status: 'Pending',
        tags: tags ? (typeof tags === 'string' ? tags.split(',').map(t => t.trim()) : tags) : null,
        type: type || 'Product',
        planting_crops_date: normalizeDateOnly(planting_crops_date),
        harvesting_start_date: normalizeDateOnly(harvesting_start_date),
        harvesting_end_date: normalizeDateOnly(harvesting_end_date),
        type_of_crop: type_of_crop || null,
        upload_latitude: normalizeNumber(upload_latitude),
        upload_longitude: normalizeNumber(upload_longitude),
      },
    });
  } catch (error) {
    console.error('Error creating product:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getProducts = async (req, res) => {
  try {
    // If query filters are provided, return filtered products (publicly accessible)
    const { category_id, sub_category_id, sub_sub_category_id, user_id } = req.query;
    if (category_id) {
      const products = await getProductsByCategory(category_id);
      return res.status(200).json(products);
    }

    if (sub_category_id) {
      const products = await getProductsBySubCategory(sub_category_id);
      return res.status(200).json(products);
    }
    if (sub_sub_category_id) {
      const products = await getProductsBySubSubCategory(sub_sub_category_id);
      return res.status(200).json(products);
    }
    if (user_id) {
      const isAdmin = req.user && (req.user.role === 'admin' || req.user.role === 'super_admin');
      const products = await getProductsByUserId(user_id);
      const visibleProducts = isAdmin ? products : products.filter(isActiveProduct);
      return res.status(200).json(visibleProducts);
    }

    const isAdmin = req.user && (req.user.role === 'admin' || req.user.role === 'super_admin');
    const products = await resolveProductsForRequest({
      isAdmin,
      getAllProductsFn: getAllProducts,
    });

    return res.status(200).json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await getProductById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    return res.status(200).json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getMyProducts = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const products = await getProductsByUserId(req.user.id);
    return res.status(200).json(products);
  } catch (error) {
    console.error('Error fetching user products:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// "My Team Products" — a District or Taluka Representative with product.approve sees every
// product from users in their own district/taluka (admin/super_admin see every product, same
// as the main admin Products page) so they can approve/reject without needing site-wide
// admin access.
export const getDistrictTeamProducts = async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin' || req.user.role === 'super_admin';
    if (isAdmin) {
      const products = await getAllProducts();
      return res.status(200).json(products);
    }

    const jurisdiction = req.userJurisdiction || await getJurisdictionByUserId(req.user.id);
    if (!jurisdiction || (jurisdiction.scope_type !== 'district' && jurisdiction.scope_type !== 'taluka')) {
      return res.status(403).json({ message: 'You do not have a district or taluka assigned.' });
    }

    const scopeNames = await resolveScopeNames(jurisdiction);
    let products;
    if (jurisdiction.scope_type === 'district') {
      // If this rep has been narrowed to a specific taluka subset, match that — not their
      // whole district — otherwise (no subset configured) fall back to the whole district.
      const talukaNames = await getAssignedTalukaNamesForJurisdiction(jurisdiction.id);
      products = talukaNames.length > 0
        ? await getProductsByOwnerTalukaNames(talukaNames)
        : await getProductsByOwnerDistrict(scopeNames.district_name);
    } else {
      const villageNames = await getAssignedVillageNamesForJurisdiction(jurisdiction.id);
      products = villageNames.length > 0
        ? await getProductsByOwnerVillageNames(villageNames)
        : await getProductsByOwnerTaluka(scopeNames.taluka_name);
    }
    return res.status(200).json(products);
  } catch (error) {
    console.error('Error fetching district team products:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateProductController = async (req, res) => {
  try {
    const { id } = req.params;

    const existingProduct = await getProductById(id);
    if (!existingProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const isOwner = req.user && existingProduct.user_id && String(existingProduct.user_id) === String(req.user.id);
    const isAdmin = req.user && (req.user.role === 'admin' || req.user.role === 'super_admin');

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'You are not authorized to update this product' });
    }

    const {
      name,
      description,
      price,
      category_id,
      sub_category_id,
      sub_sub_category_id,
      stock_quantity,
      image_url,
      is_dehydrated,
      product_type,
      min_quantity,
      max_quantity,
      quantity_unit,
      is_processed,
      product_video,
      status,
      tags,
      type,
      planting_crops_date,
      harvesting_start_date,
      harvesting_end_date,
      type_of_crop,
      name_hindi,
      name_marathi,
      description_hindi,
      description_marathi,
      upload_latitude,
      upload_longitude,
    } = req.body;

    const normalizedType = String(type || '').trim();
    const requiresCategory = normalizedType !== 'Nursery' && normalizedType !== 'Animal' && normalizedType !== 'nursery' && normalizedType !== 'animal';

    if (!name || (requiresCategory && (category_id === undefined || category_id === null || category_id === ''))) {
      return res.status(400).json({ message: 'Product name and category are required' });
    }

    // Handle image upload
    const imageFile = req.files?.image?.[0];
    const resolvedImageUrl = await resolveImageUrl(imageFile, image_url);

    // Handle video upload (re-encoded down to ~3-4MB if the raw upload is bigger)
    const videoFile = req.files?.product_video?.[0];
    const resolvedVideoUrl = await resolveVideoUrl(videoFile, product_video);

    const result = await updateProduct(id, {
      name,
      description,
      price: Number(price),
      category_id: normalizeNumber(category_id),
      sub_category_id: normalizeNumber(sub_category_id),
      sub_sub_category_id: normalizeNumber(sub_sub_category_id),
      stock_quantity: normalizeNumber(stock_quantity) || 0,
      image_url: resolvedImageUrl,
      name_hindi: name_hindi || null,
      name_marathi: name_marathi || null,
      is_dehydrated: is_dehydrated === 'true' || is_dehydrated === true || is_dehydrated === 1,
      product_type: product_type || null,
      min_quantity: normalizeNumber(min_quantity) || 0,
      max_quantity: normalizeNumber(max_quantity) || 0,
      quantity_unit: quantity_unit || 'kg',
      is_processed: is_processed === 'true' || is_processed === true || is_processed === 1,
      product_video: resolvedVideoUrl,
      status: isAdmin ? (status || existingProduct.status || 'Pending') : (existingProduct.status || 'Pending'),
      tags: tags ? (typeof tags === 'string' ? tags.split(',').map(t => t.trim()) : tags) : null,
      type: type || 'Product',
      planting_crops_date: normalizeDateOnly(planting_crops_date),
      harvesting_start_date: normalizeDateOnly(harvesting_start_date),
      harvesting_end_date: normalizeDateOnly(harvesting_end_date),
      type_of_crop: type_of_crop || null,
      upload_latitude: normalizeNumber(upload_latitude) ?? existingProduct.upload_latitude,
      upload_longitude: normalizeNumber(upload_longitude) ?? existingProduct.upload_longitude,
    });

    if (result[0].affectedRows === 0) {
      return res.status(404).json({ message: 'Product not found or no changes made' });
    }

    // If the farmer set a new (future) harvest end date on a crop, bring it back live and
    // clear any old destroy-listing state. Never resets a genuine admin decision
    // (Pending/Rejected/Approved); only clears the system-set 'Inactive' status.
    let reactivated = false;
    const resolvedType = String(type || existingProduct.type || 'Product').toLowerCase();
    if (resolvedType === 'crop' && harvesting_end_date) {
      const newEndDate = new Date(harvesting_end_date);
      const startOfToday = new Date(new Date().toDateString());
      if (!Number.isNaN(newEndDate.getTime()) && newEndDate.getTime() >= startOfToday.getTime()) {
        try {
          await reactivateCropForNewHarvestCycle(id);
          reactivated = true;
        } catch (reactivateError) {
          console.error('Failed to reactivate crop for new harvest cycle:', reactivateError.message || reactivateError);
        }
      }
    }

    return res.status(200).json({
      message: 'Product updated successfully',
      product: {
        id,
        name,
        name_hindi: name_hindi || null,
        name_marathi: name_marathi || null,
        description: description || null,
        description_hindi: description_hindi || null,
        description_marathi: description_marathi || null,
        price: Number(price),
        category_id: normalizeNumber(category_id),
        sub_category_id: normalizeNumber(sub_category_id),
        sub_sub_category_id: normalizeNumber(sub_sub_category_id),
        stock_quantity: normalizeNumber(stock_quantity) || 0,
        image_url: resolvedImageUrl,
        is_dehydrated: is_dehydrated === 'true' || is_dehydrated === true || is_dehydrated === 1,
        product_type: product_type || null,
        min_quantity: normalizeNumber(min_quantity) || 0,
        max_quantity: normalizeNumber(max_quantity) || 0,
        quantity_unit: quantity_unit || 'kg',
        is_processed: is_processed === 'true' || is_processed === true || is_processed === 1,
        product_video: resolvedVideoUrl,
        status: isAdmin ? (status || existingProduct.status || 'Pending') : (existingProduct.status || 'Pending'),
        tags: tags ? (typeof tags === 'string' ? tags.split(',').map(t => t.trim()) : tags) : null,
        type: type || 'Product',
        planting_crops_date: normalizeDateOnly(planting_crops_date),
        harvesting_start_date: normalizeDateOnly(harvesting_start_date),
        harvesting_end_date: normalizeDateOnly(harvesting_end_date),
        type_of_crop: type_of_crop || null,
      },
    });
  } catch (error) {
    console.error('Error updating product:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateProductStatusController = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = ['Pending', 'Approved', 'Rejected'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: `Status must be one of: ${allowedStatuses.join(', ')}` });
    }

    const existingProduct = await getProductById(id);
    if (!existingProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // A District or Taluka Representative with the product.approve permission can only
    // approve/reject products whose owner is in their own assigned district/taluka (not a
    // hardcoded role check — admin/super_admin already short-circuit the
    // hasPermission('product.approve') route guard).
    const isAdminApprover = req.user.role === 'admin' || req.user.role === 'super_admin';
    if (!isAdminApprover) {
      const jurisdiction = req.userJurisdiction || await getJurisdictionByUserId(req.user.id);
      if (!jurisdiction || (jurisdiction.scope_type !== 'district' && jurisdiction.scope_type !== 'taluka')) {
        return res.status(403).json({ message: 'You do not have a district or taluka assigned to approve products.' });
      }
      const scopeNames = await resolveScopeNames(jurisdiction);
      let isInScope;
      if (jurisdiction.scope_type === 'district') {
        // If this rep has been narrowed to a specific taluka subset, the product's taluka
        // must be in that subset — not just anywhere in their whole district.
        const talukaNames = await getAssignedTalukaNamesForJurisdiction(jurisdiction.id);
        isInScope = talukaNames.length > 0
          ? talukaNames.includes(existingProduct.seller_taluka)
          : Boolean(existingProduct.seller_district) && existingProduct.seller_district === scopeNames.district_name;
      } else {
        const villageNames = await getAssignedVillageNamesForJurisdiction(jurisdiction.id);
        isInScope = villageNames.length > 0
          ? villageNames.includes(existingProduct.seller_village)
          : Boolean(existingProduct.seller_taluka) && existingProduct.seller_taluka === scopeNames.taluka_name;
      }
      if (!isInScope) {
        return res.status(403).json({ message: 'You can only approve products from users in your own district or taluka.' });
      }
    }

    await updateProductStatus(id, status);

    if (status === 'Approved' || status === 'Rejected') {
      const isCrop = String(existingProduct.type || '').toLowerCase() === 'crop';
      const itemLabel = isCrop ? 'crop' : 'product';
      const owner = existingProduct.user_id ? await getUserById(existingProduct.user_id) : null;
      const lang = resolveNotificationLang(owner?.language);
      const message = status === 'Approved'
        ? productApprovedMessage(lang, itemLabel, existingProduct.name)
        : productRejectedMessage(lang, itemLabel, existingProduct.name);

      if (existingProduct.user_id) {
        try {
          await createNotification({
            userId: existingProduct.user_id,
            type: status === 'Approved' ? 'approval' : 'rejection',
            title: status === 'Approved' ? 'Item Approved' : 'Item Rejected',
            message,
            productId: id,
            data: { itemLabel, name: existingProduct.name },
          });
        } catch (notificationError) {
          console.error('Failed to save product status notification:', notificationError.message || notificationError);
        }
      }

      try {
        if (owner?.phone) {
          await sendWhatsAppMessage(owner.phone, `Star Agro: ${message}`);
        }
      } catch (notificationError) {
        console.error('Failed to send product status WhatsApp notification:', notificationError?.message || notificationError);
      }
    }

    return res.status(200).json({ message: `Product ${status.toLowerCase()} successfully`, status });
  } catch (error) {
    console.error('Error updating product status:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateProductActiveController = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    const existingProduct = await getProductById(id);
    if (!existingProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const isOwner = req.user && existingProduct.user_id && String(existingProduct.user_id) === String(req.user.id);
    const isAdmin = req.user && (req.user.role === 'admin' || req.user.role === 'super_admin');

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'You are not authorized to update this product' });
    }

    const nextActive = is_active === true || is_active === 'true' || is_active === 1 || is_active === '1';

    await updateProductActive(id, nextActive);

    return res.status(200).json({
      message: nextActive ? 'Product activated successfully' : 'Product deactivated successfully',
      is_active: nextActive,
    });
  } catch (error) {
    console.error('Error updating product active status:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteProductController = async (req, res) => {
  try {
    const { id } = req.params;

    const existingProduct = await getProductById(id);
    if (!existingProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const isOwner = req.user && existingProduct.user_id && String(existingProduct.user_id) === String(req.user.id);
    const isAdmin = req.user && (req.user.role === 'admin' || req.user.role === 'super_admin');

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'You are not authorized to delete this product' });
    }

    const result = await deleteProduct(id);
    if (result[0].affectedRows === 0) {
      return res.status(404).json({ message: 'Product not found or already deleted' });
    }
    return res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Farmer marks a crop as available for pickup/disposal. Notifies Enterprenure/Treder users
// within DESTROY_ALERT_RADIUS_KM of the farmer's saved profile location.
export const markProductDestroyController = async (req, res) => {
  try {
    const { id } = req.params;

    const existingProduct = await getProductById(id);
    if (!existingProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const isOwner = req.user && existingProduct.user_id && String(existingProduct.user_id) === String(req.user.id);
    if (!isOwner) {
      return res.status(403).json({ message: 'You are not authorized to destroy-list this item' });
    }

    if (String(existingProduct.type || '').toLowerCase() !== 'crop') {
      return res.status(400).json({ message: 'Only crops can be marked for destroy' });
    }

    const result = await markProductForDestroy(id);
    if (result.affectedRows === 0) {
      return res.status(400).json({ message: 'This crop is already listed for destroy' });
    }

    const farmerName = req.user.name || `${req.user.first_name || ''} ${req.user.last_name || ''}`.trim() || 'A farmer';
    const farmerPhone = req.user.phone || 'not available';
    const farmerLat = normalizeNumber(req.user.latitude);
    const farmerLng = normalizeNumber(req.user.longitude);

    try {
      const allTraders = await getUsersByRole([DESTROY_NOTIFY_ROLE]);

      // Only alert traders within DESTROY_ALERT_RADIUS_KM of the farmer's saved profile
      // location. If the farmer has no saved location, we can't compute distance, so no
      // one is notified (rather than falling back to blasting everyone).
      const traders = farmerLat === null || farmerLng === null
        ? []
        : allTraders.filter((trader) => {
          const traderLat = normalizeNumber(trader.latitude);
          const traderLng = normalizeNumber(trader.longitude);
          if (traderLat === null || traderLng === null) return false;
          return distanceInKm(farmerLat, farmerLng, traderLat, traderLng) <= DESTROY_ALERT_RADIUS_KM;
        });

      const resolveLang = resolveNotificationLang;

      await Promise.all(
        traders.map(async (trader) => {
          const message = buildDestroyAlertMessage(resolveLang(trader.language), farmerName, farmerPhone, existingProduct.name);

          try {
            await createNotification({
              userId: trader.id,
              type: 'destroy_alert',
              title: 'Crop available for pickup',
              message,
              productId: id,
              data: { farmerName, farmerPhone, cropName: existingProduct.name },
            });
          } catch (notificationError) {
            console.error('Failed to save destroy-alert notification:', notificationError.message || notificationError);
          }

          if (trader.phone) {
            try {
              await sendWhatsAppMessage(trader.phone, `Star Agro: ${message}`);
            } catch (whatsappError) {
              console.error('Failed to send destroy-alert WhatsApp:', whatsappError?.message || whatsappError);
            }
          }
        })
      );

      // Group by resolved language so each group gets its own translated FCM push
      const tradersByLang = traders.reduce((acc, trader) => {
        if (!trader.fcm_token) return acc;
        const lang = resolveLang(trader.language);
        (acc[lang] = acc[lang] || []).push(trader.fcm_token);
        return acc;
      }, {});

      for (const [lang, tokens] of Object.entries(tradersByLang)) {
        const message = buildDestroyAlertMessage(lang, farmerName, farmerPhone, existingProduct.name);
        await sendFCMNotifications(tokens, 'Crop available for pickup', message, {
          productId: id,
          type: 'destroy_alert',
        });
      }
    } catch (notifyError) {
      console.error('Failed to notify traders about destroy listing:', notifyError?.message || notifyError);
    }

    return res.status(200).json({ message: 'Crop listed for destroy/pickup. Traders have been notified.' });
  } catch (error) {
    console.error('Error marking product for destroy:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Trader/Enterprenure claims a destroy-listed crop. First claim wins.
export const claimProductDestroyController = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.user || req.user.role !== DESTROY_NOTIFY_ROLE) {
      return res.status(403).json({ message: 'Only Enterprenure/Treder users can claim this crop' });
    }

    const existingProduct = await getProductById(id);
    if (!existingProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const result = await claimProductDestroy(id, req.user.id);
    if (result.affectedRows === 0) {
      return res.status(409).json({ message: 'This crop has already been claimed or is no longer available' });
    }

    const claimerName = req.user.name || `${req.user.first_name || ''} ${req.user.last_name || ''}`.trim() || 'A trader';
    const claimerPhone = req.user.phone || 'not available';

    if (existingProduct.user_id) {
      const farmer = await getUserById(existingProduct.user_id);
      const message = buildDestroyClaimedMessage(
        resolveNotificationLang(farmer?.language),
        claimerName,
        claimerPhone,
        existingProduct.name
      );

      try {
        await createNotification({
          userId: existingProduct.user_id,
          type: 'destroy_claimed',
          title: 'Your crop was claimed',
          message,
          productId: id,
          data: { claimerName, claimerPhone, cropName: existingProduct.name },
        });
      } catch (notificationError) {
        console.error('Failed to save destroy-claim notification:', notificationError.message || notificationError);
      }

      try {
        if (farmer?.phone) {
          await sendWhatsAppMessage(farmer.phone, `Star Agro: ${message}`);
        }
      } catch (whatsappError) {
        console.error('Failed to send destroy-claim WhatsApp:', whatsappError?.message || whatsappError);
      }
    }

    return res.status(200).json({ message: 'Crop claimed successfully. The farmer has been notified.' });
  } catch (error) {
    console.error('Error claiming destroy product:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getDestroyListingsController = async (req, res) => {
  try {
    const listings = await getOpenDestroyListings();
    return res.status(200).json(listings);
  } catch (error) {
    console.error('Error fetching destroy listings:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
