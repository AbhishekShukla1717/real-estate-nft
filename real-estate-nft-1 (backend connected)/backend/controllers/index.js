// controllers/index.js
const userController = require('./userController');
const adminController = require('./adminController');
const propertyController = require('./propertyController');

module.exports = {
  userController,
  adminController,
  propertyController
};