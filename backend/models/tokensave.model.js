import pool from '../config/db.js';

export const createNotificationDevicesTable = async () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS notification_devices (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      user_id BIGINT UNSIGNED DEFAULT NULL,
      device_id VARCHAR(255) DEFAULT NULL,
      fcm_token VARCHAR(512) NOT NULL,
      created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY unique_token (fcm_token),
      INDEX idx_notification_devices_user_id (user_id),
      INDEX idx_notification_devices_device_id (device_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  await pool.query(sql);

  try {
    await pool.query('ALTER TABLE notification_devices ADD UNIQUE KEY uq_device_id (device_id)');
  } catch (alterError) {
    if (!/Duplicate key|already exists/i.test(alterError.message)) {
      throw alterError;
    }
  }
};

const findExistingDeviceRow = async (deviceId, fcmToken) => {
  const [rows] = await pool.query(
    'SELECT id FROM notification_devices WHERE device_id = ? OR fcm_token = ? LIMIT 1',
    [deviceId, fcmToken]
  );

  return rows[0] || null;
};

const updateExistingDevice = async (id, userId, deviceId, fcmToken) => {
  await pool.query(
    `UPDATE notification_devices
     SET user_id = ?, device_id = ?, fcm_token = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [userId, deviceId, fcmToken, id]
  );
};

export const upsertNotificationDevice = async ({ userId, deviceId, fcmToken }) => {
  const normalizedUserId = userId ? Number(userId) : null;
  const normalizedDeviceId = deviceId || null;

  const existing = await findExistingDeviceRow(normalizedDeviceId, fcmToken);
  if (existing) {
    await updateExistingDevice(existing.id, normalizedUserId, normalizedDeviceId, fcmToken);
    return { id: existing.id, updated: true };
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO notification_devices (user_id, device_id, fcm_token)
       VALUES (?, ?, ?)`,
      [normalizedUserId, normalizedDeviceId, fcmToken]
    );

    return { id: result.insertId, updated: false };
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      const existingAfterError = await findExistingDeviceRow(normalizedDeviceId, fcmToken);
      if (existingAfterError) {
        await updateExistingDevice(existingAfterError.id, normalizedUserId, normalizedDeviceId, fcmToken);
        return { id: existingAfterError.id, updated: true };
      }
    }

    throw error;
  }
};

export const getAllNotificationTokens = async () => {
  const [rows] = await pool.query(
    `SELECT fcm_token, user_id FROM notification_devices WHERE fcm_token IS NOT NULL AND fcm_token != ''`
  );
  return rows;
};
