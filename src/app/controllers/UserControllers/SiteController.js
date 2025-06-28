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
}

module.exports = new SiteUserController();
