const Users = require('../../models/Users');
const Tasks = require('../../models/Tasks');
const Projects = require('../../models/Projects');
const { muntipleMongooseToObject } = require('../../../util/mongoose');
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

    async handleRegister(req, res) {
        try {
            const { fullName, phoneNumber, email, password, confirmPassword } = req.body;
            const errors = {};

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
            } else if (
                password.length < 8 ||
                !/[A-Z]/.test(password) ||
                !/[a-z]/.test(password) ||
                !/[0-9]/.test(password) ||
                !/[^a-zA-Z0-9]/.test(password)
            ) {
                errors.password = "Mật khẩu phải ít nhất 8 ký tự, có chữ hoa, chữ thường, số và ký tự đặc biệt.";
            }

            if (password !== confirmPassword) {
                errors.confirmPassword = "Xác nhận mật khẩu không khớp.";
            }

            if (Object.keys(errors).length > 0) {
                return res.status(400).json({
                    success: false,
                    errors,
                    userData: req.body
                });
            }

            const existingUser = await Users.findOne({ email });
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    errors: { email: "Email đã được đăng ký." },
                    userData: req.body
                });
            }

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            const otp = crypto.randomInt(100000, 999999).toString();
            const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // Hiệu lực 10 phút

            const newUser = new Users({
                fullName,
                phoneNumber,
                email,
                password: hashedPassword,
                otp,
                otpExpiry,
                isVerified: false,
            });
            await newUser.save();

            // Thử gửi email, nhưng không ảnh hưởng đến logic chính
            try {
                await this.sendOTPEmail(email, otp, fullName);
            } catch (emailErr) {
                console.error("Failed to send OTP email:", emailErr.message, emailErr.stack);
                // Không throw lỗi, tiếp tục trả về thành công
            }

            return res.status(200).json({
                success: true,
                message: "Đăng ký thành công. Đã gửi OTP về email (nếu email hoạt động).",
                email,
            });

        } catch (err) {
            console.error("Handle Register Error:", err.message, err.stack);
            return res.status(500).json({
                success: false,
                errors: { general: "Có lỗi server. Vui lòng thử lại." },
                userData: req.body
            });
        }
    }

    async verifyOTP(req, res) {
        try {
            const { email, otp } = req.body;
            const user = await Users.findOne({ email });

            if (!user || user.otp !== otp || new Date() > user.otpExpiry) {
                return res.status(400).json({
                    success: false,
                    message: "OTP không đúng hoặc đã hết hạn."
                });
            }

            user.isVerified = true;
            user.otp = null;
            user.otpExpiry = null;
            await user.save();

            return res.status(200).json({
                success: true,
                message: "Xác thực OTP thành công. Đang chuyển hướng..."
            });

        } catch (err) {
            console.error(err);
            return res.status(500).json({
                success: false,
                message: "Có lỗi server. Vui lòng thử lại."
            });
        }
    }

    async sendOTPEmail(to, otp, fullName) {
        let transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER || "contact.pqhuy@gmail.com",
                pass: process.env.EMAIL_PASS || "nakc iriv ynyo rjoy",
            },
        });

        const mailOptions = {
            from: '"Work Manager" <contact.pqhuy@gmail.com>',
            to,
            subject: "Xác Thực Mã OTP - Work Manager",
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
                    <h2 style="color: #2c3e50;">Chào ${fullName || "Quý khách"},</h2>
                    <p>Cảm ơn bạn đã đăng ký tài khoản tại Work Manager. Để hoàn tất quá trình đăng ký, vui lòng sử dụng mã OTP (One-Time Password) sau:</p>
                    <div style="text-align: center; margin: 20px 0;">
                        <h1 style="color: #e74c3c; font-size: 28px; letter-spacing: 2px; background-color: #f5f6fa; padding: 10px 20px; display: inline-block;">${otp}</h1>
                    </div>
                    <p>Vui lòng nhập mã này vào biểu mẫu xác thực trên trang đăng ký. Lưu ý rằng mã OTP chỉ có hiệu lực trong <strong>10 phút</strong>. Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email này hoặc liên hệ với chúng tôi ngay lập tức.</p>
                    <p style="margin-top: 20px;">Trân trọng,<br>Đội ngũ Work Manager<br><a href="mailto:support@workmanager.com" style="color: #3498db;">support@workmanager.com</a></p>
                    <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="font-size: 12px; color: #7f8c8d;">Đây là email tự động, vui lòng không trả lời trực tiếp.</p>
                </div>
            `,
        };

        console.log("Attempting to send email to:", to, "with OTP:", otp);
        await transporter.sendMail(mailOptions);
        console.log("Email sent successfully to:", to);
    }

    async resendOTP(req, res) {
        const { email } = req.body;
        try {
            const user = await Users.findOne({ email });

            if (!user || user.isVerified) {
                return res.status(400).json({
                    success: false,
                    message: "Email không tồn tại hoặc đã xác minh."
                });
            }

            // Tạo mã OTP mới và vô hiệu hóa OTP cũ
            const newOtp = crypto.randomInt(100000, 999999).toString();
            const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // Hiệu lực 10 phút
            user.otp = newOtp;
            user.otpExpiry = otpExpiry;
            await user.save();

            // Thử gửi email, nhưng không ảnh hưởng đến logic chính
            try {
                await this.sendOTPEmail(email, newOtp, user.fullName);
            } catch (emailErr) {
                console.error("Failed to resend OTP email:", emailErr.message, emailErr.stack);
                // Không throw lỗi, tiếp tục trả về thành công
            }

            return res.json({
                success: true,
                message: "Đã gửi lại OTP (nếu email hoạt động)."
            });
        } catch (err) {
            console.error(err);
            return res.status(500).json({
                success: false,
                message: "Lỗi server."
            });
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