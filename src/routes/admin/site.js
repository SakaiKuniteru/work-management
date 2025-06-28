const express = require('express');
const routerAdmnin = express.Router();
const siteAdminController = require('../../app/controllers/AdminControllers/SiteController');

routerAdmnin.get('/', siteAdminController.home);

module.exports = routerAdmnin;
