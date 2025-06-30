const Users = require('../../models/Users');
const Tasks = require('../../models/Tasks');
const Projects = require('../../models/Projects');
const { muntipleMongooseToObject } = require('../../../util/mongoose')
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

class SiteUserController {

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
            errors: {},
            userData: {},
            showOTPForm: false,
        });
    }

    // XỬ LÝ ĐĂNG KÝ
    async handleRegister(req, res) {
        try {
            const { fullName, phoneNumber, email, password, confirmPassword } = req.body;
            let errors = {};

            if (!fullName || fullName.trim() === "") {
                errors.fullName = "Họ và tên không được để trống.";
            }

            if (!phoneNumber || !/^[0-9]{9,11}$/.test(phoneNumber)) {
                errors.phoneNumber = "Số điện thoại không hợp lệ.";
            }

            if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
                errors.email = "Email không hợp lệ.";
            }

            if (!password) {
                errors.password = "Mật khẩu không được để trống.";
            } else {
                if (
                    password.length < 8 ||
                    !/[A-Z]/.test(password) ||
                    !/[a-z]/.test(password) ||
                    !/[0-9]/.test(password) ||
                    !/[^a-zA-Z0-9]/.test(password)
                ) {
                    errors.password =
                        "Mật khẩu phải ít nhất 8 ký tự, có chữ hoa, chữ thường, số và ký tự đặc biệt.";
                }
            }

            if (password !== confirmPassword) {
                errors.confirmPassword = "Xác nhận mật khẩu không khớp.";
            }

            if (Object.keys(errors).length > 0) {
                return res.render('user/register', {
                    layout: false,
                    errors,
                    userData: req.body,
                    showOTPForm: false,
                });
            }

            // Kiểm tra email tồn tại
            const existingUser = await Users.findOne({ email });
            if (existingUser) {
                return res.render('user/register', {
                    layout: false,
                    errors: {
                        email: "Email đã được đăng ký.",
                    },
                    userData: req.body,
                    showOTPForm: false,
                });
            }

            // Mã hóa mật khẩu
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            // Sinh OTP ngẫu nhiên
            const otp = crypto.randomInt(100000, 999999).toString();

            // Lưu user
            const newUser = new Users({
                fullName,
                phoneNumber,
                email,
                password: hashedPassword,
                otp,
                isVerified: false,
            });
            await newUser.save();

            // Gửi email OTP
            await this.sendOTPEmail(email, otp);

            return res.status(200).json({
                success: true,
                message: "Đăng ký thành công. Đã gửi OTP về email.",
                email,
            });

        } catch (err) {
            console.log(err);
            return res.status(500).render('user/register', {
                layout: false,
                errors: { general: "Có lỗi server. Vui lòng thử lại." },
                userData: req.body,
                showOTPForm: false,
            });
        }
    }

    // XỬ LÝ XÁC THỰC OTP
    async verifyOTP(req, res) {
        try {
            const { email, otp } = req.body;
            const user = await Users.findOne({ email, otp });

            if (!user) {
                return res.render('user/register', {
                    layout: false,
                    showOTPForm: true,
                    email,
                    errors: { otp: "OTP không đúng hoặc email chưa đăng ký." },
                });
            }

            user.isVerified = true;
            user.otp = null;
            await user.save();

            // Chuyển sang trang login
            return res.redirect('/login');

        } catch (err) {
            console.log(err);
            return res.render('user/register', {
                layout: false,
                showOTPForm: true,
                email,
                errors: { general: "Có lỗi server. Vui lòng thử lại." },
            });
        }
    }

    async sendOTPEmail(to, otp) {
        let transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: "your_email@gmail.com",
                pass: "your_app_password",
            },
        });

        await transporter.sendMail({
            from: '"Work Manager" <your_email@gmail.com>',
            to,
            subject: "Mã xác thực OTP",
            html: `<h3>Mã OTP của bạn là:</h3><h2 style="color:red">${otp}</h2>`
        });
    }

    // [POST] /register/resend-otp
    async resendOTP(req, res) {
        const { email } = req.body;
        try {
            const user = await Users.findOne({ email });

            if (!user || user.isVerified) {
                return res.status(400).json({ success: false, message: "Email không tồn tại hoặc đã xác minh." });
            }

            const otp = crypto.randomInt(100000, 999999).toString();
            user.otp = otp;
            await user.save();

            await this.sendOTPEmail(email, otp);

            return res.json({ success: true, message: "Đã gửi lại OTP." });
        } catch (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: "Lỗi server." });
        }
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
        res.render('user/profiles/profile', {
            layout: 'user/index',
            title: 'Trang cá nhân'
        });
    }

    setting(req, res) {
        res.render('user/profiles/setting/setting', {
            layout: 'user/index',
            title: 'Trang cá nhân'
        });
    }

    information(req, res) {
        res.render('user/profiles/setting/information', {
            layout: 'user/index',
            title: 'Trang cá nhân'
        });
    }

    password_security(req, res) {
        res.render('user/profiles/setting/password_security', {
            layout: 'user/index',
            title: 'Trang cá nhân'
        });
    }
}

module.exports = new SiteUserController();