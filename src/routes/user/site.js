const express = require('express');
const routerUser = express.Router();
const siteUserController = require('../../app/controllers/UserControllers/SiteController');


routerUser.get('/information', siteUserController.information);
routerUser.get('/password-security', siteUserController.password_security);
routerUser.get('/setting/', siteUserController.setting);
routerUser.get('/profile', siteUserController.profile);
routerUser.get('/project-detail', siteUserController.projectDetail);
routerUser.get('/projects-list', siteUserController.projectsList);
routerUser.get('/projects', siteUserController.projects);
routerUser.get('/tasks-detail', siteUserController.taskDetail);
routerUser.get('/tasks-list', siteUserController.tasksList);
routerUser.get('/tasks', siteUserController.tasks);
routerUser.get('/forgot-password', siteUserController.forgotPassword);
routerUser.get('/login', siteUserController.login);
routerUser.post('/register/resend-otp', siteUserController.resendOTP);
routerUser.post('/register', siteUserController.handleRegister);
routerUser.post('/register/verify-otp', siteUserController.verifyOTP);
routerUser.get('/register', siteUserController.register);
routerUser.get('/', siteUserController.home);

module.exports = routerUser;
