const express = require('express');
const routerUser = express.Router();
const siteUserController = require('../../app/controllers/UserControllers/SiteController');

routerUser.get('/forgot-password', siteUserController.forgotPassword);
routerUser.get('/login', siteUserController.login);
routerUser.get('/register', siteUserController.register);
routerUser.get('/', siteUserController.home);

module.exports = routerUser;
