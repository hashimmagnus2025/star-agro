import pool from '../config/db.js';

export const createProductsTable = async () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS products (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      name_hindi VARCHAR(255) DEFAULT NULL,
      name_marathi VARCHAR(255) DEFAULT NULL,
      description TEXT DEFAULT NULL,
      price DECIMAL(10, 2) NOT NULL,
      category_id INT DEFAULT NULL,
      sub_category_id INT DEFAULT NULL,
      sub_sub_category_id INT DEFAULT NULL,
      user_id BIGINT UNSIGNED DEFAULT NULL,
      stock_quantity INT DEFAULT 0,
      image_url VARCHAR(255) DEFAULT NULL,
      \`type\` VARCHAR(50) DEFAULT 'Product',
      planting_crops_date DATE DEFAULT NULL,
      harvesting_start_date DATE DEFAULT NULL,
      harvesting_end_date DATE DEFAULT NULL,
      type_of_crop VARCHAR(255) DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
      FOREIGN KEY (sub_category_id) REFERENCES sub_categories(id) ON DELETE SET NULL,
      FOREIGN KEY (sub_sub_category_id) REFERENCES sub_sub_categories(id) ON DELETE SET NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;
  await pool.query(sql);
  try {
    await pool.query('ALTER TABLE products ADD COLUMN sub_sub_category_id INT DEFAULT NULL');
  } catch (alterError) {
    if (!/Duplicate column name|Column 'sub_sub_category_id' already exists/i.test(alterError.message)) {
      throw alterError;
    }
  }
  try {
    await pool.query('ALTER TABLE products ADD COLUMN user_id BIGINT UNSIGNED DEFAULT NULL');
  } catch (alterError) {
    if (!/Duplicate column name|Column 'user_id' already exists/i.test(alterError.message)) {
      throw alterError;
    }
  }
  try {
    await pool.query('ALTER TABLE products ADD CONSTRAINT fk_product_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL');
  } catch (alterError) {
    if (!/Duplicate key|already exists|Duplicate foreign key/i.test(alterError.message)) {
      // ignore
    }
  }
  // Add new columns
  try {
    await pool.query('ALTER TABLE products ADD COLUMN is_dehydrated BOOLEAN DEFAULT 0');
  } catch (alterError) {
    if (!/Duplicate column name|Column 'is_dehydrated' already exists/i.test(alterError.message)) {
      // ignore
    }
  }
  try {
    await pool.query('ALTER TABLE products ADD COLUMN product_type VARCHAR(100) DEFAULT NULL');
  } catch (alterError) {
    if (!/Duplicate column name|Column 'product_type' already exists/i.test(alterError.message)) {
      // ignore
    }
  }
  try {
    await pool.query('ALTER TABLE products ADD COLUMN `type` VARCHAR(50) DEFAULT \'Product\'');
  } catch (alterError) {
    if (!/Duplicate column name|Column 'type' already exists/i.test(alterError.message)) {
      // ignore
    }
  }
  try {
    await pool.query('ALTER TABLE products ADD COLUMN planting_crops_date DATE DEFAULT NULL');
  } catch (alterError) {
    if (!/Duplicate column name|Column \'planting_crops_date\' already exists/i.test(alterError.message)) {
      // ignore
    }
  }
  try {
    await pool.query('ALTER TABLE products ADD COLUMN harvesting_start_date DATE DEFAULT NULL');
  } catch (alterError) {
    if (!/Duplicate column name|Column \'harvesting_start_date\' already exists/i.test(alterError.message)) {
      // ignore
    }
  }
  try {
    await pool.query('ALTER TABLE products ADD COLUMN harvesting_end_date DATE DEFAULT NULL');
  } catch (alterError) {
    if (!/Duplicate column name|Column \'harvesting_end_date\' already exists/i.test(alterError.message)) {
      // ignore
    }
  }
  try {
    await pool.query('ALTER TABLE products ADD COLUMN type_of_crop VARCHAR(255) DEFAULT NULL');
  } catch (alterError) {
    if (!/Duplicate column name|Column \'type_of_crop\' already exists/i.test(alterError.message)) {
      // ignore
    }
  }
  try {
    await pool.query('ALTER TABLE products ADD COLUMN min_quantity INT DEFAULT 0');
  } catch (alterError) {
    if (!/Duplicate column name|Column 'min_quantity' already exists/i.test(alterError.message)) {
      // ignore
    }
  }
  try {
    await pool.query('ALTER TABLE products ADD COLUMN max_quantity INT DEFAULT 0');
  } catch (alterError) {
    if (!/Duplicate column name|Column 'max_quantity' already exists/i.test(alterError.message)) {
      // ignore
    }
  }
  try {
    await pool.query('ALTER TABLE products ADD COLUMN is_processed BOOLEAN DEFAULT 0');
  } catch (alterError) {
    if (!/Duplicate column name|Column 'is_processed' already exists/i.test(alterError.message)) {
      // ignore
    }
  }
  try {
    await pool.query("ALTER TABLE products ADD COLUMN quantity_unit VARCHAR(20) DEFAULT 'kg'");
  } catch (alterError) {
    if (!/Duplicate column name|Column 'quantity_unit' already exists/i.test(alterError.message)) {
      // ignore
    }
  }
  try {
    await pool.query('ALTER TABLE products ADD COLUMN product_video VARCHAR(255) DEFAULT NULL');
  } catch (alterError) {
    if (!/Duplicate column name|Column 'product_video' already exists/i.test(alterError.message)) {
      // ignore
    }
  }
  try {
    await pool.query('ALTER TABLE products ADD COLUMN status VARCHAR(50) DEFAULT "Active"');
  } catch (alterError) {
    if (!/Duplicate column name|Column 'status' already exists/i.test(alterError.message)) {
      // ignore
    }
  }
  try {
    await pool.query('ALTER TABLE products ADD COLUMN tags JSON DEFAULT NULL');
  } catch (alterError) {
    if (!/Duplicate column name|Column 'tags' already exists/i.test(alterError.message)) {
      // ignore
    }
  }

    try {
    await pool.query('ALTER TABLE products ADD COLUMN name_hindi VARCHAR(255) DEFAULT NULL');
  } catch (alterError) {
    if (!/Duplicate column name|Column 'name_hindi' already exists/i.test(alterError.message)) {
      // ignore
    }
  }
  try {
    await pool.query('ALTER TABLE products ADD COLUMN name_marathi VARCHAR(255) DEFAULT NULL');
  } catch (alterError) {
    if (!/Duplicate column name|Column 'name_marathi' already exists/i.test(alterError.message)) {
      // ignore
    }
  }

  try {
    await pool.query("UPDATE products SET status = 'Approved' WHERE LOWER(status) = 'active'");
  } catch (migrationError) {
    console.error('Failed to migrate legacy Active product statuses:', migrationError.message);
  }

  // Destroy/dispose-crop flow columns
  try {
    await pool.query("ALTER TABLE products ADD COLUMN destroy_status VARCHAR(20) DEFAULT NULL");
  } catch (alterError) {
    if (!/Duplicate column name|Column 'destroy_status' already exists/i.test(alterError.message)) {
      // ignore
    }
  }
  try {
    await pool.query("ALTER TABLE products ADD COLUMN destroy_requested_at TIMESTAMP NULL DEFAULT NULL");
  } catch (alterError) {
    if (!/Duplicate column name|Column 'destroy_requested_at' already exists/i.test(alterError.message)) {
      // ignore
    }
  }
  try {
    await pool.query("ALTER TABLE products ADD COLUMN destroy_expires_at TIMESTAMP NULL DEFAULT NULL");
  } catch (alterError) {
    if (!/Duplicate column name|Column 'destroy_expires_at' already exists/i.test(alterError.message)) {
      // ignore
    }
  }
  try {
    await pool.query("ALTER TABLE products ADD COLUMN destroy_claimed_by BIGINT UNSIGNED DEFAULT NULL");
  } catch (alterError) {
    if (!/Duplicate column name|Column 'destroy_claimed_by' already exists/i.test(alterError.message)) {
      // ignore
    }
  }
  try {
    await pool.query("ALTER TABLE products ADD COLUMN destroy_claimed_at TIMESTAMP NULL DEFAULT NULL");
  } catch (alterError) {
    if (!/Duplicate column name|Column 'destroy_claimed_at' already exists/i.test(alterError.message)) {
      // ignore
    }
  }

  try {
    await pool.query('ALTER TABLE products ADD COLUMN is_active BOOLEAN DEFAULT 1');
  } catch (alterError) {
    if (!/Duplicate column name|Column 'is_active' already exists/i.test(alterError.message)) {
      // ignore
    }
  }

  // Captures where the user physically was when they uploaded the product image (device GPS),
  // separate from their declared profile address (users.state/district/taluka/village).
  try {
    await pool.query('ALTER TABLE products ADD COLUMN upload_latitude DECIMAL(10, 7) DEFAULT NULL');
  } catch (alterError) {
    if (!/Duplicate column name|Column 'upload_latitude' already exists/i.test(alterError.message)) {
      // ignore
    }
  }
  try {
    await pool.query('ALTER TABLE products ADD COLUMN upload_longitude DECIMAL(10, 7) DEFAULT NULL');
  } catch (alterError) {
    if (!/Duplicate column name|Column 'upload_longitude' already exists/i.test(alterError.message)) {
      // ignore
    }
  }
};

export const insertProduct = async (product) => {
  const sql = `
    INSERT INTO products (name, name_hindi, name_marathi, description, price, category_id, sub_category_id, sub_sub_category_id, stock_quantity, image_url, user_id, is_dehydrated, product_type, min_quantity, max_quantity, quantity_unit, is_processed, product_video, status, tags, \`type\`, planting_crops_date, harvesting_start_date, harvesting_end_date, type_of_crop, upload_latitude, upload_longitude)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  return pool.query(sql, [
    product.name,
    product.name_hindi || null,
    product.name_marathi || null,
    product.description || null,
    product.price,
    product.category_id || null,
    product.sub_category_id || null,
    product.sub_sub_category_id || null,
    product.stock_quantity || 0,
    product.image_url || null,
    product.user_id || null,
    product.is_dehydrated ? 1 : 0,
    product.product_type || null,
    product.min_quantity || 0,
    product.max_quantity || 0,
    product.quantity_unit || 'kg',
    product.is_processed ? 1 : 0,
    product.product_video || null,
    product.status || 'Active',
    product.tags ? JSON.stringify(product.tags) : null,
    product.type || 'Product',
    product.planting_crops_date || null,
    product.harvesting_start_date || null,
    product.harvesting_end_date || null,
    product.type_of_crop || null,
    product.upload_latitude ?? null,
    product.upload_longitude ?? null,
  ]);
};

const PRODUCT_WITH_USER_LOCATION_SELECT = `
  SELECT p.*,
    COALESCE(NULLIF(TRIM(u.name), ''), NULLIF(TRIM(CONCAT_WS(' ', u.first_name, u.last_name)), '')) AS farmer_name,
    u.phone AS farmer_phone,
    u.state AS seller_state, u.district AS seller_district, u.taluka AS seller_taluka, u.village AS seller_village, u.document_status AS seller_document_status,
    u.role AS owner_role, u.first_name AS owner_first_name, u.last_name AS owner_last_name,
    u.email AS owner_email, u.gender AS owner_gender, u.address AS owner_address,
    u.has_solar_dryer AS owner_has_solar_dryer, u.how_know_about_us AS owner_how_know_about_us,
    c.name AS destroy_claimed_by_name, c.phone AS destroy_claimed_by_phone
  FROM products p
  LEFT JOIN users u ON p.user_id = u.id
  LEFT JOIN users c ON p.destroy_claimed_by = c.id
`;

export const getAllProducts = async () => {
  const [rows] = await pool.query(`${PRODUCT_WITH_USER_LOCATION_SELECT} ORDER BY p.created_at DESC`);
  return rows;
};

export const getProductsByCategory = async (categoryId) => {
  const [rows] = await pool.query(`${PRODUCT_WITH_USER_LOCATION_SELECT} WHERE p.category_id = ? ORDER BY p.created_at DESC`, [categoryId]);
  return rows;
};

export const getProductsBySubCategory = async (subCategoryId) => {
  const [rows] = await pool.query(`${PRODUCT_WITH_USER_LOCATION_SELECT} WHERE p.sub_category_id = ? ORDER BY p.created_at DESC`, [subCategoryId]);
  return rows;
};

export const getProductsBySubSubCategory = async (subSubCategoryId) => {
  const [rows] = await pool.query(`${PRODUCT_WITH_USER_LOCATION_SELECT} WHERE p.sub_sub_category_id = ? ORDER BY p.created_at DESC`, [subSubCategoryId]);
  return rows;
};

export const getProductsByUserId = async (userId) => {
  const [rows] = await pool.query(`${PRODUCT_WITH_USER_LOCATION_SELECT} WHERE p.user_id = ? ORDER BY p.created_at DESC`, [userId]);
  return rows;
};

export const getProductById = async (id) => {
  const [rows] = await pool.query(`${PRODUCT_WITH_USER_LOCATION_SELECT} WHERE p.id = ?`, [id]);
  return rows[0] || null;
};

export const updateProduct = async (id, product) => {
  const sql = `
    UPDATE products
    SET name = ?, name_hindi = ?, name_marathi = ?, description = ?, price = ?, category_id = ?, sub_category_id = ?, sub_sub_category_id = ?, stock_quantity = ?, image_url = ?, is_dehydrated = ?, product_type = ?, min_quantity = ?, max_quantity = ?, quantity_unit = ?, is_processed = ?, product_video = ?, status = ?, tags = ?, \`type\` = ?, planting_crops_date = ?, harvesting_start_date = ?, harvesting_end_date = ?, type_of_crop = ?, upload_latitude = ?, upload_longitude = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;
  return pool.query(sql, [
    product.name,
    product.name_hindi || null,
    product.name_marathi || null,
    product.description || null,
    product.price,
    product.category_id || null,
    product.sub_category_id || null,
    product.sub_sub_category_id || null,
    product.stock_quantity || 0,
    product.image_url || null,
    product.is_dehydrated ? 1 : 0,
    product.product_type || null,
    product.min_quantity || 0,
    product.max_quantity || 0,
    product.quantity_unit || 'kg',
    product.is_processed ? 1 : 0,
    product.product_video || null,
    product.status || 'Active',
    product.tags ? JSON.stringify(product.tags) : null,
    product.type || 'Product',
    product.planting_crops_date || null,
    product.harvesting_start_date || null,
    product.harvesting_end_date || null,
    product.type_of_crop || null,
    product.upload_latitude ?? null,
    product.upload_longitude ?? null,
    id
  ]);
};

export const deleteProduct = async (id) => {
  const sql = 'DELETE FROM products WHERE id = ?';
  return pool.query(sql, [id]);
};

export const updateProductStatus = async (id, status) => {
  const sql = 'UPDATE products SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
  return pool.query(sql, [status, id]);
};

export const updateProductActive = async (id, isActive) => {
  const sql = 'UPDATE products SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
  return pool.query(sql, [isActive ? 1 : 0, id]);
};

// Farmer set a new (future) harvest cycle for a crop that had gone inactive/destroy-listed.
// Bring it back live and clear the old destroy listing without re-triggering admin approval.
// 'Inactive' is a system-set side effect of an unclaimed destroy listing (not an admin
// rejection), so it's safe to flip back to 'Approved'; a genuine 'Rejected'/'Pending' status
// (real admin decisions) is left untouched.
export const reactivateCropForNewHarvestCycle = async (id) => {
  const sql = `
    UPDATE products
    SET is_active = 1, destroy_status = NULL, destroy_requested_at = NULL,
        destroy_expires_at = NULL, destroy_claimed_by = NULL, destroy_claimed_at = NULL,
        status = IF(status = 'Inactive', 'Approved', status),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;
  return pool.query(sql, [id]);
};

export const getExpiredHarvestCrops = async () => {
  const [rows] = await pool.query(
    `SELECT id FROM products
     WHERE \`type\` = 'Crop' AND is_active = 1
       AND harvesting_end_date IS NOT NULL AND harvesting_end_date <= CURDATE()`
  );
  return rows;
};

export const expireHarvestedCrops = async () => {
  const [result] = await pool.query(
    `UPDATE products SET is_active = 0
     WHERE \`type\` = 'Crop' AND is_active = 1
       AND harvesting_end_date IS NOT NULL AND harvesting_end_date <= CURDATE()`
  );
  return result;
};

const DESTROY_LISTING_DAYS = 3;

// Mark a crop for destroy/disposal. Only succeeds if it isn't already an open/claimed destroy listing.
export const markProductForDestroy = async (id) => {
  const [result] = await pool.query(
    `UPDATE products
     SET destroy_status = 'pending', destroy_requested_at = CURRENT_TIMESTAMP,
         destroy_expires_at = DATE_ADD(CURRENT_TIMESTAMP, INTERVAL ${DESTROY_LISTING_DAYS} DAY),
         destroy_claimed_by = NULL, destroy_claimed_at = NULL
     WHERE id = ? AND (destroy_status IS NULL OR destroy_status = 'expired')`,
    [id]
  );
  return result;
};

// First-claim-wins: only succeeds if the listing is still open (not already claimed/expired).
export const claimProductDestroy = async (id, userId) => {
  const [result] = await pool.query(
    `UPDATE products
     SET destroy_status = 'claimed', destroy_claimed_by = ?, destroy_claimed_at = CURRENT_TIMESTAMP
     WHERE id = ? AND destroy_status = 'pending' AND destroy_expires_at > CURRENT_TIMESTAMP`,
    [userId, id]
  );
  return result;
};

export const getOpenDestroyListings = async () => {
  const [rows] = await pool.query(
    `SELECT p.*, u.name AS farmer_name, u.phone AS farmer_phone,
         u.state AS seller_state, u.district AS seller_district, u.taluka AS seller_taluka, u.village AS seller_village,
         sc.image AS sub_category_image, c.image_url AS category_image
     FROM products p
     LEFT JOIN users u ON p.user_id = u.id
       LEFT JOIN sub_categories sc ON p.sub_category_id = sc.id
       LEFT JOIN categories c ON p.category_id = c.id
     WHERE p.destroy_status = 'pending' AND p.destroy_expires_at > CURRENT_TIMESTAMP
     ORDER BY p.destroy_requested_at DESC`
  );
  return rows;
};

export const getExpiredUnclaimedDestroyListings = async () => {
  const [rows] = await pool.query(
    `SELECT id FROM products WHERE destroy_status = 'pending' AND destroy_expires_at <= CURRENT_TIMESTAMP`
  );
  return rows;
};

export const expireDestroyListings = async () => {
  const [result] = await pool.query(
    `UPDATE products SET destroy_status = 'expired', status = 'Inactive'
     WHERE destroy_status = 'pending' AND destroy_expires_at <= CURRENT_TIMESTAMP`
  );
  return result;
};
