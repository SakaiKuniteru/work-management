const express = require('express');
const routerAdmin = express.Router();
const siteAdminController = require('../../app/controllers/AdminControllers/SiteController');

routerAdmin.get('/customers/create', siteAdminController.createCustomer);
routerAdmin.get('/customers/edit', siteAdminController.editCustomer);
routerAdmin.get('/customers', siteAdminController.customer);
routerAdmin.get('/', siteAdminController.home);

module.exports = routerAdmin;
