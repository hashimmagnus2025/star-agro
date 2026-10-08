import express from 'express';
import cors from 'cors';
import pool, { testConnection } from './config/db.js';
import dotenv from 'dotenv';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import UserRoutes from './routes/user.routes.js';
import MigrationRoutes from './routes/migration.routes.js';
import PermissionRoutes from './routes/permission.routes.js';
import RoleRoutes from './routes/role.routes.js';
import JurisdictionRoutes from './routes/jurisdiction.routes.js';
import { createJurisdictionTable } from './models/jurisdiction.model.js';
import CmsRoutes from './routes/cms.routes.js';
import ContactRoutes from './routes/contact.routes.js';
import CategoriesRoutes from './routes/categories.routes.js';
import SubCategoriesRoutes from './routes/sub-categories.routes.js';
import SubSubCategoriesRoutes from './routes/sub-sub-categories.routes.js';
import ProductRoutes from './routes/product.routes.js';
import ProductInquiryRoutes from './routes/productInqury.routes.js';
import ServiceInquiryRoutes from './routes/serviceInqury.routes.js';
import FavoriteRoutes from './routes/favorite.routes.js';
import GeneralSettingsRoutes from './routes/generalSettings.routes.js';
import WalletRoutes from './routes/wallet.routes.js';
import AdvertisementRoutes from './routes/advertisement.routes.js';
import AdvertisementSizeRoutes from './routes/advertisement.size.routes.js';
import AdvertisementDurationRoutes from './routes/advertisement.duration.routes.js';
import AdvertisementPriceRoutes from './routes/advertisement.price.routes.js';
import AdvertisementInquiryRoutes from './routes/advertisement-inquiry.routes.js';
import GalleryRoutes from './routes/gallery.routes.js';
import productTypeRouter from './routes/product-type.routes.js';
import typeRouter from './routes/type.routes.js';
import faqRouter from './routes/faq.routes.js';
import FaqCategoriesRoutes from './routes/faq-categories.routes.js';
import { createFaqTable } from './models/faq.model.js';
import { createFaqCategoriesTable } from './models/faq-categories.model.js';
import { createProductTypeTable } from './models/product-type.model.js';
import { createTypeTable } from './models/type.model.js';
import { createCategoriesTable } from './models/categories.model.js';
import { createSubCategoriesTable } from './models/sub-categories.model.js';
import { createSubSubCategoriesTable } from './models/sub-sub-categories.model.js';
import { createProductsTable } from './models/product.model.js';
import { createUserTable } from './models/user.model.js';
import { createPermissionsTable, seedDefaultPermissions } from './models/permissions.model.js';
import { createRolesTable, seedDefaultRoles } from './models/role.model.js';
import { createProductInquiriesTable } from './models/productInqury.model.js';
import { createServiceInquiriesTable } from './models/serviceInqury.model.js';
import { createFavoritesTable } from './models/favorite.model.js';
import { createGeneralSettingsTable } from './models/generalSettings.model.js';
import { createWalletTables } from './models/wallet.model.js';
import { createAdvertisementTable } from './models/advertisement.model.js';
import { createAdvertisementSizeTable } from './models/advertisement.size.model.js';
import { createAdvertisementDurationTable } from './models/advertisement.duration.model.js';
import { createAdvertisementPriceTable } from './models/advertisement.price.model.js';
import { createAdvertisementInquiryTable } from './models/advertisement-inquiry.model.js';
import { createGalleryTable } from './models/gallery.model.js';
import { createNotificationDevicesTable } from './models/tokensave.model.js';
import TokenSaveRoutes from './routes/tokensave.routes.js';
import CityRoutes from './routes/city.routes.js';
import { createCitiesTable } from './models/city.model.js';
import StateRoutes from './routes/state.routes.js';
import { createStatesTable } from './models/state.model.js';
import CountriesRoutes from './routes/countries.routes.js';
import { createCountriesTable } from './models/countries.model.js';
import DistrictRoutes from './routes/district.routes.js';
import { createDistrictsTable } from './models/district.model.js';
import TalukaRoutes from './routes/taluka.routes.js';
import { createTalukasTable } from './models/taluka.model.js';
import VillageRoutes from './routes/village.routes.js';
import { createVillagesTable } from './models/village.model.js';
import NotificationRoutes from './routes/notification.routes.js';
import { createNotificationsTable } from './models/notification.model.js';
import { startDestroyExpiryJob } from './cron/destroyExpiry.js';
import { startHarvestExpiryJob } from './cron/harvestExpiry.js';
import { createJobsTable } from './models/jobs.model.js';
import JobsRouter from './routes/jobs.routes.js';
import { createReferralsTable } from './models/referral.model.js';
import ReferralRoutes from './routes/referral.routes.js';
import HowToUseRoutes from './routes/howToUse.routes.js';
import { createHowToUseTable } from './models/howToUse.model.js';
import ServiceRoutes from './routes/service.routes.js';
import ReviewRoutes from './routes/review.routes.js';
import { createServicesTable } from './models/service.model.js';
import { createReviewsTable } from './models/review.model.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5000;
const trustProxyHops = Number.parseInt(process.env.TRUST_PROXY_HOPS || '1', 10);

const backendRequire = createRequire(import.meta.url);
const frontendDir = process.env.FRONTEND_DIR
  ? path.resolve(process.env.FRONTEND_DIR)
  : path.resolve(__dirname, '../frontend');

// const frontendDir = process.env.FRONTEND_DIR
//   ? path.resolve(process.env.FRONTEND_DIR)
//   : path.resolve(__dirname, './frontend');

const frontendRequire = createRequire(path.join(frontendDir, 'package.json'));
const useNextDev = process.env.NEXT_DEV
  ? process.env.NEXT_DEV === 'true'
  : process.env.npm_lifecycle_event === 'dev';

process.env.NODE_ENV = useNextDev ? 'development' : 'production';

let frontendHandlerPromise;

const loadNext = () => {
  try {
    return frontendRequire('next');
  } catch (frontendErr) {
    try {
      return backendRequire('next');
    } catch (backendErr) {
      throw new Error(
        `Next.js dependency not found. Run "npm install" in ${frontendDir} or ${__dirname}. Frontend error: ${frontendErr.message}. Backend error: ${backendErr.message}`
      );
    }
  }
};

const prepareFrontend = async () => {
  if (!fs.existsSync(path.join(frontendDir, 'package.json'))) {
    throw new Error(`Frontend directory not found: ${frontendDir}`);
  }

  const next = loadNext();
  const nextApp = next({
    dev: useNextDev,
    dir: frontendDir,
  });

  await nextApp.prepare();
  return nextApp.getRequestHandler();
};

const getFrontendHandler = () => {
  if (!frontendHandlerPromise) {
    frontendHandlerPromise = prepareFrontend();
  }

  return frontendHandlerPromise;
};

app.set('trust proxy', Number.isNaN(trustProxyHops) ? 1 : trustProxyHops);
app.disable('x-powered-by');
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false,
  crossOriginResourcePolicy: false,
}));
app.use(morgan('dev'));
app.use(cors());

app.use(
  cors({
    origin: [
      "http://localhost:3001",
      "http://192.168.1.11:3000",

    ],
    credentials: true,
  })
);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

await testConnection();
await createUserTable();
await createReferralsTable();
await createPermissionsTable();
await createRolesTable();
await seedDefaultPermissions();
await seedDefaultRoles();
await createNotificationDevicesTable();
await createCategoriesTable();
await createSubCategoriesTable();
await createSubSubCategoriesTable();
await createProductsTable();
await createProductInquiriesTable();
await createServiceInquiriesTable();
await createFavoritesTable();
await createGeneralSettingsTable();
await createWalletTables();
await createAdvertisementTable();
await createAdvertisementSizeTable();
await createAdvertisementDurationTable();
await createAdvertisementPriceTable();
await createAdvertisementInquiryTable();
await createGalleryTable();
await createProductTypeTable();
await createTypeTable();
await createFaqTable();
await createFaqCategoriesTable();
await createCountriesTable();
await createStatesTable();
await createCitiesTable();
await createDistrictsTable();
await createTalukasTable();
await createVillagesTable();
await createJurisdictionTable();
await createNotificationsTable();

startDestroyExpiryJob();
startHarvestExpiryJob();
await createJobsTable();
await createHowToUseTable();
await createServicesTable();
await createReviewsTable();

const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX, 10) || (useNextDev ? 1000 : 200),
  message: { success: false, message: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api', apiLimiter);
app.use('/api', express.json());
app.use('/api/user', UserRoutes);
app.use('/api/migration', MigrationRoutes);
app.use('/api/permission', PermissionRoutes);
app.use('/api/role', RoleRoutes);
app.use('/api/jurisdictions', JurisdictionRoutes);
app.use('/api/cms', CmsRoutes);
app.use('/api/contact', ContactRoutes);
app.use('/api/categories', CategoriesRoutes);
app.use('/api/sub-categories', SubCategoriesRoutes);
app.use('/api/sub-sub-categories', SubSubCategoriesRoutes);
app.use('/api/products', ProductRoutes);
app.use('/api/product-inquiries', ProductInquiryRoutes);
app.use('/api/service-inquiries', ServiceInquiryRoutes);
app.use('/api/product-types', productTypeRouter);
app.use('/api/types', typeRouter);
app.use('/api/favorites', FavoriteRoutes);
app.use('/api/general-settings', GeneralSettingsRoutes);
app.use('/api/wallet', WalletRoutes);
app.use('/api/advertisements', AdvertisementRoutes);
app.use('/api/advertisement-sizes', AdvertisementSizeRoutes);
app.use('/api/advertisement-durations', AdvertisementDurationRoutes);
app.use('/api/advertisement-prices', AdvertisementPriceRoutes);
app.use('/api/advertisement-inquiries', AdvertisementInquiryRoutes);
app.use('/api/gallery', GalleryRoutes);
app.use('/api/token-save', TokenSaveRoutes);
app.use('/api/faq', faqRouter);
app.use('/api/faq-categories', FaqCategoriesRoutes);
app.use('/api/countries', CountriesRoutes);
app.use('/api/states', StateRoutes);
app.use('/api/cities', CityRoutes);
app.use('/api/districts', DistrictRoutes);
app.use('/api/talukas', TalukaRoutes);
app.use('/api/villages', VillageRoutes);
app.use('/api/notifications', NotificationRoutes);
app.use('/api/jobs', JobsRouter);
app.use('/api/referral', ReferralRoutes);
app.use('/api/how-to-use', HowToUseRoutes);
app.use('/api/services', ServiceRoutes);
app.use('/api/reviews', ReviewRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Star Agro API is running',
    timestamp: new Date().toISOString(),
  });
});

app.get('/test', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT 1 as connected');
    res.json({
      status: 'MySQL Connected Successfully!',
      data: rows,
      timestamp: new Date().toISOString(),
    });

  } catch (err) {
    res.status(500).json({
      status: 'MySQL Connection Failed',
      error: err.message,
      timestamp: new Date().toISOString(),
    });
  }
});

app.all(/.*/, async (req, res, next) => {
  try {
    const handle = await getFrontendHandler();
    return handle(req, res);
  } catch (err) {
    return next(err);
  }
});

app.use((err, req, res, next) => {
  console.error(err);

  if (res.headersSent) {
    return next(err);
  }

  if (req.path.startsWith('/api')) {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal server error';
    return res.status(statusCode).json({
      success: false,
      message,
    });
  }

  return res.status(500).send('Internal server error');
});

await getFrontendHandler();

app.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}`);
  console.log(`Frontend directory: ${frontendDir}`);
  console.log(`Next.js frontend is running in ${useNextDev ? 'development' : 'production'} mode`);
});
