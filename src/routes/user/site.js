const express = require('express');
const routerUser = express.Router();
const siteUserController = require('../../app/controllers/UserControllers/SiteController');

routerUser.get('/dashboard', siteUserController.dashboard);
routerUser.get('/project-detail', siteUserController.projectDetail);
routerUser.get('/projects-list', siteUserController.projectsList);
routerUser.get('/projects', siteUserController.projects);
routerUser.get('/tasks-detail', siteUserController.taskDetail);
routerUser.get('/tasks-list', siteUserController.tasksList);
routerUser.get('/tasks', siteUserController.tasks);
routerUser.get('/forgot-password', siteUserController.forgotPassword);
routerUser.get('/login', siteUserController.login);
routerUser.get('/register', siteUserController.register);
routerUser.get('/', siteUserController.home);

module.exports = routerUser;
