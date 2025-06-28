const siteUserRouter = require('./site');

function routeUser(app) {
    
    app.use('/', siteUserRouter);

}

module.exports = routeUser;
