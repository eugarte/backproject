const express = require('express');
const productController = require('../controllers/productController');
const categoryController = require('../controllers/categoryController');
const attributeController = require('../controllers/attributeController');

const router = express.Router();

// Products
router.get('/products', productController.list);
router.post('/products', productController.create);
router.get('/products/:id', productController.getById);
router.put('/products/:id', productController.update);
router.delete('/products/:id', productController.delete);

// Product slug
router.get('/products/slug/:slug', productController.getBySlug);

// Product reviews
router.get('/products/:id/reviews', productController.getReviews);
router.post('/products/:id/reviews', productController.addReview);

// Product favorites
router.post('/products/:id/favorite', productController.addToFavorites);
router.delete('/products/:id/favorite', productController.removeFromFavorites);
router.get('/products/:id/favorite', productController.isFavorite);

// Client favorites
router.get('/clients/:clientId/favorites', productController.getClientFavorites);

// Client view history
router.get('/clients/:clientId/views', productController.getViewHistory);

// Price alerts
router.post('/products/:id/price-alert', productController.createPriceAlert);
router.get('/clients/:clientId/price-alerts', productController.getPriceAlerts);

// Categories
router.get('/categories', categoryController.list);
router.post('/categories', categoryController.create);
router.get('/categories/:id', categoryController.getById);
router.put('/categories/:id', categoryController.update);
router.delete('/categories/:id', categoryController.delete);

// Attributes
router.get('/attributes', attributeController.list);
router.post('/attributes', attributeController.create);
router.get('/attributes/:id', attributeController.getById);
router.put('/attributes/:id', attributeController.update);
router.delete('/attributes/:id', attributeController.delete);

module.exports = router;