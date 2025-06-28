const siteAdminRouter = require('./site');

function routeAdmin(app) {
    
    app.use('/admin', siteAdminRouter);

}

module.exports = routeAdmin;
