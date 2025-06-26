// Import with temporary names to avoid case conflicts
const Admin = require('./AdminModel');
const User = require('./User');
const Property = require('./PropertyModel');
const Transaction = require('./TransactionModel');

module.exports = {
  Admin,
  User,
  Property,
  Transaction
};