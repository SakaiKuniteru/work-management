const express = require('express');
const routerUser = express.Router();
const siteUserController = require('../../app/controllers/UserControllers/SiteController');

routerUser.get('/information', siteUserController.noCache, siteUserController.requireLogin, siteUserController.information);
routerUser.get('/password-security', siteUserController.noCache, siteUserController.requireLogin, siteUserController.password_security);
routerUser.get('/setting/', siteUserController.noCache, siteUserController.requireLogin, siteUserController.setting);
routerUser.get('/profile/:id/edit', siteUserController.noCache, siteUserController.requireLogin, siteUserController.edit);
routerUser.put('/profile/:id', siteUserController.noCache, siteUserController.requireLogin, siteUserController.update);
// routerUser.post('/profile/:id/update-avatar', siteUserController.noCache, siteUserController.requireLogin, siteUserController.uploadAvatar, siteUserController.updateAvatar);
// routerUser.post('/profile/:id/update-cover', siteUserController.noCache, siteUserController.requireLogin, siteUserController.uploadCover, siteUserController.updateCoverPhoto);
routerUser.get('/profile/:id/photos', siteUserController.noCache, siteUserController.requireLogin, siteUserController.photos);
routerUser.get('/profile/:id/dashboard', siteUserController.noCache, siteUserController.requireLogin, siteUserController.dashboard);
routerUser.get('/profile/:id/about', siteUserController.noCache, siteUserController.requireLogin, siteUserController.about);
routerUser.get('/profile/:id/posts', siteUserController.noCache, siteUserController.requireLogin, siteUserController.posts);
routerUser.get('/profile/:id', (req, res) => {
    if (req.session && req.session.user && req.session.user.id) {
        return res.redirect(`/profile/${req.session.user.id}/posts`);
    }
    return res.redirect('/login?redirect=true');
});
routerUser.get('/project-detail', siteUserController.noCache, siteUserController.requireLogin, siteUserController.projectDetail);
routerUser.get('/projects-list', siteUserController.noCache, siteUserController.requireLogin, siteUserController.projectsList);
routerUser.get('/projects', siteUserController.noCache, siteUserController.requireLogin, siteUserController.projects);
routerUser.get('/tasks-detail', siteUserController.noCache, siteUserController.requireLogin, siteUserController.taskDetail);
routerUser.get('/tasks-list', siteUserController.noCache, siteUserController.requireLogin, siteUserController.tasksList);
routerUser.get('/tasks', siteUserController.noCache, siteUserController.requireLogin, siteUserController.tasks);
routerUser.get('/logout', siteUserController.logout);
routerUser.get('/forgot-password', siteUserController.forgotPassword);
routerUser.get('/login', siteUserController.login);
routerUser.post('/login', siteUserController.handleLogin);
routerUser.post('/register/resend-otp', siteUserController.resendOTP);
routerUser.post('/register', siteUserController.handleRegister);
routerUser.post('/register/verify-otp', siteUserController.verifyOTP);
routerUser.get('/register', siteUserController.register);
routerUser.get('/', siteUserController.noCache, siteUserController.requireLogin, siteUserController.home);



module.exports = routerUser;