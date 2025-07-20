const Users = require('../../models/Users');
const Tasks = require('../../models/Tasks');
const Projects = require('../../models/Projects');
const { mongooseToObject } = require('../../../util/mongoose')

class SiteAdminController {
    // [GET] /search
    home(req, res) {
        res.render('admin/home', {
            layout: 'admin/index',
            title: 'Trang chủ'
        });
    }

    customer(req, res) {
        res.render('admin/user/customers/index', {
            layout: 'admin/index',
        });
    }

    editCustomer(req, res) {
        res.render('admin/user/customers/edit', {
            layout: 'admin/index',
        });
    }

    createCustomer(req, res) {
        res.render('admin/user/customers/create', {
            layout: 'admin/index',
        });
    }
}

module.exports = new SiteAdminController();
