// Central place for all outgoing (WhatsApp/notification) message templates in en/hi/mr.
// Recipient's saved profile language (users.language) decides which translation they get.
const SUPPORTED_LANGS = ['en', 'hi', 'mr'];

export const resolveNotificationLang = (lang) => (SUPPORTED_LANGS.includes(lang) ? lang : 'en');

const template = (byLang) => (lang, ...args) => {
  const fn = byLang[resolveNotificationLang(lang)] || byLang.en;
  return fn(...args);
};

const ITEM_LABEL_BY_LANG = {
  crop: { en: 'crop', hi: 'फसल', mr: 'पीक' },
  product: { en: 'product', hi: 'उत्पाद', mr: 'उत्पादन' },
};
const localizedItemLabel = (itemLabel, lang) =>
  (ITEM_LABEL_BY_LANG[itemLabel] || ITEM_LABEL_BY_LANG.product)[resolveNotificationLang(lang)];

export const productApprovedMessage = template({
  en: (itemLabel, name) => `Your ${localizedItemLabel(itemLabel, 'en')} "${name}" has been approved and is now live.`,
  hi: (itemLabel, name) => `आपका ${localizedItemLabel(itemLabel, 'hi')} "${name}" स्वीकृत हो गया है और अब लाइव है।`,
  mr: (itemLabel, name) => `तुमचे ${localizedItemLabel(itemLabel, 'mr')} "${name}" मंजूर झाले असून आता लाइव्ह आहे.`,
});

export const productRejectedMessage = template({
  en: (itemLabel, name) => `Your ${localizedItemLabel(itemLabel, 'en')} "${name}" has been rejected. Please check the details or contact support.`,
  hi: (itemLabel, name) => `आपका ${localizedItemLabel(itemLabel, 'hi')} "${name}" अस्वीकृत कर दिया गया है। कृपया विवरण जांचें या सहायता से संपर्क करें।`,
  mr: (itemLabel, name) => `तुमचे ${localizedItemLabel(itemLabel, 'mr')} "${name}" नाकारले गेले आहे. कृपया तपशील तपासा किंवा सपोर्टशी संपर्क साधा.`,
});

export const serviceApprovedMessage = template({
  en: (name) => `Your service "${name}" has been approved and is now live.`,
  hi: (name) => `आपकी सेवा "${name}" स्वीकृत हो गई है और अब लाइव है।`,
  mr: (name) => `तुमची सेवा "${name}" मंजूर झाली असून आता लाइव्ह आहे.`,
});

export const serviceRejectedMessage = template({
  en: (name) => `Your service "${name}" has been rejected. Please check the details or contact support.`,
  hi: (name) => `आपकी सेवा "${name}" अस्वीकृत कर दी गई है। कृपया विवरण जांचें या सहायता से संपर्क करें।`,
  mr: (name) => `तुमची सेवा "${name}" नाकारली गेली आहे. कृपया तपशील तपासा किंवा सपोर्टशी संपर्क साधा.`,
});

export const documentVerifiedMessage = template({
  en: () => `Your uploaded document has been verified.`,
  hi: () => `आपका अपलोड किया गया दस्तावेज़ सत्यापित हो गया है।`,
  mr: () => `तुम्ही अपलोड केलेले कागदपत्र सत्यापित झाले आहे.`,
});

export const documentRejectedMessage = template({
  en: () => `Your uploaded document has been rejected. Please upload a valid document.`,
  hi: () => `आपका अपलोड किया गया दस्तावेज़ अस्वीकृत कर दिया गया है। कृपया एक मान्य दस्तावेज़ अपलोड करें।`,
  mr: () => `तुम्ही अपलोड केलेले कागदपत्र नाकारले गेले आहे. कृपया वैध कागदपत्र अपलोड करा.`,
});

export const newInquiryWhatsAppMessage = template({
  en: (productName, message, link) => `A new inquiry has arrived for ${productName}.\nMessage: ${message}\nView inquiry: ${link}`,
  hi: (productName, message, link) => `${productName} के लिए एक नई पूछताछ आई है।\nसंदेश: ${message}\nपूछताछ देखें: ${link}`,
  mr: (productName, message, link) => `${productName} साठी नवीन चौकशी आली आहे.\nसंदेश: ${message}\nचौकशी पहा: ${link}`,
});

export const destroyAlertMessage = template({
  en: (farmerName, farmerPhone, cropName) =>
    `${farmerName} (${farmerPhone}) wants to give away the crop "${cropName}". Do you want to take it? It's available for the next 3 days on Star Agro.`,
  hi: (farmerName, farmerPhone, cropName) =>
    `${farmerName} (${farmerPhone}) अपनी फसल "${cropName}" नष्ट करना हैं। क्या आप इसे लेना चाहेंगे? यह फसल Star Agro पर अगले 3 दिनों तक उपलब्ध है।`,
  mr: (farmerName, farmerPhone, cropName) =>
    `${farmerName} (${farmerPhone}) यांना त्यांचे पीक "${cropName}" नष्ट करायचे आहे. तुम्हाला हे पीक घ्यायचे आहे का? हे पीक Star Agro वर पुढील 3 दिवस उपलब्ध आहे.`,
});

export const destroyClaimedMessage = template({
  en: (claimerName, claimerPhone, cropName) =>
    `${claimerName} (${claimerPhone}) will take your crop "${cropName}". Please contact them to arrange pickup.`,
  hi: (claimerName, claimerPhone, cropName) =>
    `${claimerName} (${claimerPhone}) आपकी फसल "${cropName}" लेंगे। कृपया पिकअप की व्यवस्था के लिए उनसे संपर्क करें।`,
  mr: (claimerName, claimerPhone, cropName) =>
    `${claimerName} (${claimerPhone}) तुमचे पीक "${cropName}" घेतील. कृपया पिकअपची व्यवस्था करण्यासाठी त्यांच्याशी संपर्क साधा.`,
});
