import axios from 'axios';

const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL || 'http://whatsappnew.bestsms.co.in/wapp/v2/api/send';
const WHATSAPP_API_KEY = process.env.WHATSAPP_API_KEY || 'fa6dfd2e20c240a29752e9ccc124e6ff';

const formatPhoneForWhatsApp = (phone) => {
  if (!phone) return null;
  let digits = String(phone).replace(/\D/g, '');
  if (!digits) return null;
  if (digits.length === 10) digits = '91' + digits;
  return digits;
};

export const sendWhatsAppMessage = async (phone, msg) => {
  const mobile = formatPhoneForWhatsApp(phone);
  if (!mobile) throw new Error('Invalid WhatsApp phone number');

  const params = new URLSearchParams({
    apikey: WHATSAPP_API_KEY,
    mobile,
    msg,
  });

  const url = `${WHATSAPP_API_URL}?${params.toString()}`;
  return axios.get(url);
};
