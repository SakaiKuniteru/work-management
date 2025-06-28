const express = require('express');
const routerUser = express.Router();
const siteUserController = require('../../app/controllers/UserControllers/SiteController');

routerUser.get('/', siteUserController.home);

module.exports = routerUser;
