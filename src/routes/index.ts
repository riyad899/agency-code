import { Express } from 'express';

// Core routes
import adminRoutes from './adminRoutes';
import authRoutes from './authRoutes';
import productRoutes from './productRoutes';
import userRoutes from './userRoutes';

// Module routes
import pricingRoutes from '../models/pricing/pricing.routes';
import productsRoutes from '../models/products/product.routes';
import projectsRoutes from '../models/projects/project.routes';
import servicesRoutes from '../models/services/service.routes';
import teamRoutes from '../models/team/team.routes';
import userManagementRoutes from '../models/user/user.routes';
import orderRoutes from '../models/order/order.routes';

// Home module routes
import bannerRoutes from '../models/Home/Banner/banner.routes';
import testimonialRoutes from '../models/Home/Testimonials/testimonial.routes';
import faqRoutes from '../models/Home/FAQ/faq.routes';

/**
 * Register all application routes
 * Routes are organized by category and mounted in a specific order
 */
export const registerRoutes = (app: Express) => {
  // ==========================================
  // CORE ROUTES (Authentication & Admin)
  // ==========================================
  app.use('/api', adminRoutes);           // Admin operations
  app.use('/api', authRoutes);            // Auth: register, login, logout, profile, me

  // ==========================================
  // USER MANAGEMENT
  // ==========================================
  app.use('/api/users', userManagementRoutes);  // MongoDB-based user management

  // ==========================================
  // E-COMMERCE & PRODUCTS
  // ==========================================
  app.use('/api/products', productRoutes);      // Legacy product routes
  app.use('/api/products-module', productsRoutes); // Products module
  app.use('/api/orders', orderRoutes);          // Order management

  // ==========================================
  // PRICING
  // ==========================================
  app.use('/api/pricing', pricingRoutes);       // Pricing plans

  // ==========================================
  // PORTFOLIO & SERVICES
  // ==========================================
  app.use('/api/projects', projectsRoutes);     // Portfolio projects
  app.use('/api/services', servicesRoutes);     // Services offered

  // ==========================================
  // TEAM
  // ==========================================
  app.use('/api/team', teamRoutes);             // Team members

  // ==========================================
  // HOME PAGE CONTENT
  // ==========================================
  app.use('/api/banner', bannerRoutes);         // Hero banner
  app.use('/api/testimonials', testimonialRoutes); // Client testimonials
  app.use('/api/faqs', faqRoutes);              // FAQ section
};

/**
 * Route Summary:
 *
 * Authentication & Admin:
 *   - /api/admin/* - Admin operations
 *   - /api/register, /api/login, /api/logout, /api/profile, /api/me
 *
 * Users:
 *   - /api/users/* - User management
 *
 * E-commerce:
 *   - /api/products/* - Products
 *   - /api/products-module/* - Products module
 *   - /api/orders/* - Orders
 *
 * Content:
 *   - /api/pricing/* - Pricing plans
 *   - /api/projects/* - Portfolio projects
 *   - /api/services/* - Services
 *   - /api/team/* - Team members
 *
 * Home Page:
 *   - /api/banner/* - Hero banner
 *   - /api/testimonials/* - Testimonials
 *   - /api/faqs/* - FAQs
 */
