// const Course = require('../models/Course');
// const { muntipleMongooseToObject } = require('../../util/mongoose')

class SiteController {
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
        res.render('home');
    }
}

module.exports = new SiteController();
