// const Course = require('../models/Course');
// const { muntipleMongooseToObject } = require('../../util/mongoose')

class SiteUserController {
    // [GET] /
    // index(req, res, next) {
    //     Course.find({})
    //     .then(courses => {
    //       res.render('home', { 
    //         courses: muntipleMongooseToObject(courses) 
    //       })
    //     })
    //     .catch(next);
    // }

    // [GET] /search
    home(req, res) {
        res.render('user/home', {
            layout: 'user/index',
            title: 'Trang chủ'
        });
    }

    login(req, res) {
        res.render('user/login', {
            layout: false,
        });
    }

    register(req, res) {
        res.render('user/register', {
            layout: false,
        });
    }

    forgotPassword(req, res) {
        res.render('user/forgotPasword', {
            layout: false,
        });
    }

    tasks(req, res) {
        res.render('user/tasks/index', {
            layout: 'user/index',
            title: 'Nhiệm vụ của tôi'
        });
    }

    tasksList(req, res) {
        res.render('user/tasks/list', {
            layout: 'user/index',
            title: 'Nhiệm vụ mới'
        });
    }

    taskDetail(req, res) {
        res.render('user/tasks/detail', {
            layout: 'user/index',
            title: 'Thông tin nhiệm vụ'
        });
    }


    projects(req, res) {
        res.render('user/projects/index', {
            layout: 'user/index',
            title: 'Dự án của tôi'
        });
    }


    projectsList(req, res) {
        res.render('user/projects/list', {
            layout: 'user/index',
            title: 'Dự án mới'
        });
    }


    projectDetail(req, res) {
        res.render('user/projects/detail', {
            layout: 'user/index',
            title: 'Thông tin dự án'
        });
    }

    profile(req, res) {
        res.render('user/profile', {
            layout: 'user/index',
            title: 'Trang cá nhân'
        });
    }
}

module.exports = new SiteUserController();
