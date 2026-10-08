import { upsertNotificationDevice } from '../models/tokensave.model.js';

export const saveToken = async (req, res) => {
  try {
    const { fcmToken, deviceId, userId } = req.body || {};

    if (!fcmToken) {
      return res.status(400).json({ success: false, message: 'FCM token is required' });
    }

    const savedDevice = await upsertNotificationDevice({
      userId: userId || req.user?.id || null,
      deviceId,
      fcmToken,
    });

    return res.status(200).json({
      success: true,
      message: 'Notification token saved successfully',
      data: savedDevice,
    });
  } catch (error) {
    console.error('Failed to save notification token', error);
    return res.status(500).json({ success: false, message: 'Failed to save notification token' });
  }
};
