const Users = require('../../models/Users');
const Tasks = require('../../models/Tasks');
const Projects = require('../../models/Projects');
const { mongooseToObject } = require('../../../util/mongoose')
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
class SiteUserController {
    async home(req, res) {
        try {
            if (!req.session || !req.session.user) {
                return res.redirect('/login?redirect=true');
            }

            const id = req.session.user.id;
            const user = await Users.findById(id).lean();
            if (!user) {
                req.session.destroy();
                return res.redirect('/login?redirect=true');
            }

            res.render('user/home', {
                layout: 'user/index',
                title: 'Trang chủ',
                session: req.session,
                user: user
            });
        } catch (err) {
            console.error('Lỗi khi lấy trang Bài viết:', err.message, err.stack);
            res.status(500).render('user/login', {
                layout: false,
                errors: { general: 'Có lỗi server. Vui lòng thử lại.' },
                loginData: {}
            });
        }
    }

    login(req, res) {
        const errors = req.query.redirect ? { redirect: true } : (req.session && req.session.errors) || {};
        res.render('user/login', {
            layout: false,
            errors,
            loginData: (req.session && req.session.loginData) || {}
        });
    }

    async handleLogin(req, res) {
        try {
            if (!req.session) {
                console.error('Middleware session chưa được khởi tạo');
                return res.status(500).render('user/login', {
                    layout: false,
                    errors: { general: 'Lỗi hệ thống: Session không khả dụng.' },
                    loginData: { loginId: req.body.loginId || '' }
                });
            }

            const { loginId, password } = req.body;
            const errors = {};

            if (!loginId) {
                errors.loginId = "Email hoặc số điện thoại không được để trống.";
            }

            if (!password) {
                errors.password = "Mật khẩu không được để trống.";
            }

            if (Object.keys(errors).length > 0) {
                req.session.errors = errors;
                req.session.loginData = { loginId };
                return res.status(400).render('user/login', {
                    layout: false,
                    errors,
                    loginData: { loginId }
                });
            }

            const user = await Users.findOne({
                $or: [{ email: loginId }, { phoneNumber: loginId }]
            });

            if (!user) {
                errors.general = "Email hoặc số điện thoại không tồn tại.";
                req.session.errors = errors;
                req.session.loginData = { loginId };
                return res.status(400).render('user/login', {
                    layout: false,
                    errors,
                    loginData: { loginId }
                });
            }

            if (!user.isVerified) {
                errors.general = "Tài khoản chưa được xác thực. Vui lòng kiểm tra email để xác minh OTP.";
                req.session.errors = errors;
                req.session.loginData = { loginId };
                return res.status(400).render('user/login', {
                    layout: false,
                    errors,
                    loginData: { loginId }
                });
            }

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                errors.general = "Mật khẩu không đúng.";
                req.session.errors = errors;
                req.session.loginData = { loginId };
                return res.status(400).render('user/login', {
                    layout: false,
                    errors,
                    loginData: { loginId }
                });
            }

            req.session.user = {
                id: user._id,
                email: user.email,
                fullName: user.fullName
            };

            req.session.errors = null;
            req.session.loginData = null;

            return res.redirect('/');

        } catch (err) {
            console.error("Lỗi xử lý đăng nhập:", err.message, err.stack);
            return res.status(500).render('user/login', {
                layout: false,
                errors: { general: "Có lỗi server. Vui lòng thử lại." },
                loginData: { loginId: req.body.loginId || '' }
            });
            }
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

            const existingUser = await Users.findOne({
                $or: [{ email }, { phoneNumber }]
            });

            if (existingUser) {
                const isMatch = await bcrypt.compare(password, existingUser.password);
                if (isMatch && existingUser.isVerified) {
                    if (req.session) {
                        req.session.user = {
                            id: existingUser._id,
                            email: existingUser.email,
                            fullName: existingUser.fullName
                        };
                        req.session.errors = null;
                        req.session.loginData = null;
                    }
                    return res.status(200).json({
                        success: true,
                        redirect: '/' 
                    });
                } else if (!isMatch) {
                    return res.status(400).json({
                        success: false,
                        errors: { general: "Mật khẩu nhập không đúng." },
                        userData: { email, phoneNumber }
                    });
                } else if (!existingUser.isVerified) {
                    return res.status(400).json({
                        success: false,
                        errors: { general: "Tài khoản chưa được xác thực. Vui lòng kiểm tra email." },
                        userData: { email, phoneNumber }
                    });
                }
            }

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            const otp = crypto.randomInt(100000, 999999).toString();
            const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); 

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

            try {
                await this.sendOTPEmail(email, otp, fullName);
            } catch (emailErr) {
                console.error("Failed to send OTP email:", emailErr.message, emailErr.stack);
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

            const newOtp = crypto.randomInt(100000, 999999).toString();
            const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
            user.otp = newOtp;
            user.otpExpiry = otpExpiry;
            await user.save();

            try {
                await this.sendOTPEmail(email, newOtp, user.fullName);
            } catch (emailErr) {
                console.error("Failed to resend OTP email:", emailErr.message, emailErr.stack);
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

    async logout(req, res) {
        try {
            if (!req.session) {
                console.error('Không có session để đăng xuất');
                return res.redirect('/login');
            }

            req.session.destroy((err) => {
                if (err) {
                    console.error('Lỗi khi hủy session:', err.message, err.stack);
                    return res.status(500).render('user/login', {
                        layout: false,
                        errors: { general: 'Có lỗi khi đăng xuất. Vui lòng thử lại.' },
                        loginData: {}
                    });
                }

                return res.redirect('/login');
            });
        } catch (err) {
            console.error('Lỗi xử lý đăng xuất:', err.message, err.stack);
            return res.status(500).render('user/login', {
                layout: false,
                errors: { general: 'Có lỗi server. Vui lòng thử lại.' },
                loginData: {}
            });
        }
    }

    noCache(req, res, next) {
        res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
        res.header('Expires', '-1');
        res.header('Pragma', 'no-cache');
        next();
    }
    requireLogin(req, res, next) {
        if (!req.session || !req.session.user) {
            return res.redirect('/login');
        }
        next();
    }

    async tasks(req, res) {
        try {
            if (!req.session || !req.session.user) {
                return res.redirect('/login?redirect=true');
            }

            const id = req.session.user.id;
            const user = await Users.findById(id).lean();
            if (!user) {
                req.session.destroy();
                return res.redirect('/login?redirect=true');
            }

            res.render('user/tasks', {
                layout: 'user/index',
                title: 'Nhiệm vụ của tôi',
                session: req.session,
                user: user
            });
        } catch (err) {
            console.error('Lỗi khi lấy trang Bài viết:', err.message, err.stack);
            res.status(500).render('user/login', {
                layout: false,
                errors: { general: 'Có lỗi server. Vui lòng thử lại.' },
                loginData: {}
            });
        }
    }

    async tasksList(req, res) {
        try {
            if (!req.session || !req.session.user) {
                return res.redirect('/login?redirect=true');
            }

            const id = req.session.user.id;
            const user = await Users.findById(id).lean();
            if (!user) {
                req.session.destroy();
                return res.redirect('/login?redirect=true');
            }

            res.render('user/tasks/list', {
                layout: 'user/index',
                title: 'Nhiệm vụ mới',
                session: req.session,
                user: user
            });
        } catch (err) {
            console.error('Lỗi khi lấy trang Bài viết:', err.message, err.stack);
            res.status(500).render('user/login', {
                layout: false,
                errors: { general: 'Có lỗi server. Vui lòng thử lại.' },
                loginData: {}
            });
        }
    }

    async taskDetail(req, res) {
        try {
            if (!req.session || !req.session.user) {
                return res.redirect('/login?redirect=true');
            }

            const id = req.session.user.id;
            const user = await Users.findById(id).lean();
            if (!user) {
                req.session.destroy();
                return res.redirect('/login?redirect=true');
            }

            res.render('user/tasks/detail', {
                layout: 'user/index',
                title: 'Thông tin nhiệm vụ',
                session: req.session,
                user: user
            });
        } catch (err) {
            console.error('Lỗi khi lấy trang Bài viết:', err.message, err.stack);
            res.status(500).render('user/login', {
                layout: false,
                errors: { general: 'Có lỗi server. Vui lòng thử lại.' },
                loginData: {}
            });
        }
    }

    async projects(req, res) {
        try {
            if (!req.session || !req.session.user) {
                return res.redirect('/login?redirect=true');
            }

            const id = req.session.user.id;
            const user = await Users.findById(id).lean();
            if (!user) {
                req.session.destroy();
                return res.redirect('/login?redirect=true');
            }

            res.render('user/projects/index', {
                layout: 'user/index',
                title: 'Dự án của tôi',
                session: req.session,
                user: user
            });
        } catch (err) {
            console.error('Lỗi khi lấy trang Bài viết:', err.message, err.stack);
            res.status(500).render('user/login', {
                layout: false,
                errors: { general: 'Có lỗi server. Vui lòng thử lại.' },
                loginData: {}
            });
        }
    }

    async projectsList(req, res) {
        try {
            if (!req.session || !req.session.user) {
                return res.redirect('/login?redirect=true');
            }

            const id = req.session.user.id;
            const user = await Users.findById(id).lean();
            if (!user) {
                req.session.destroy();
                return res.redirect('/login?redirect=true');
            }

            res.render('user/projects/list', {
                layout: 'user/index',
                title: 'Dự án mới',
                session: req.session,
                user: user
            });
        } catch (err) {
            console.error('Lỗi khi lấy trang Bài viết:', err.message, err.stack);
            res.status(500).render('user/login', {
                layout: false,
                errors: { general: 'Có lỗi server. Vui lòng thử lại.' },
                loginData: {}
            });
        }
    }

    async projectDetail(req, res) {
        try {
            if (!req.session || !req.session.user) {
                return res.redirect('/login?redirect=true');
            }

            const id = req.session.user.id;
            const user = await Users.findById(id).lean();
            if (!user) {
                req.session.destroy();
                return res.redirect('/login?redirect=true');
            }

            res.render('user/projects/detail', {
                layout: 'user/index',
                title: 'Thông tin dự án',
                session: req.session,
                user: user
            });
        } catch (err) {
            console.error('Lỗi khi lấy trang Bài viết:', err.message, err.stack);
            res.status(500).render('user/login', {
                layout: false,
                errors: { general: 'Có lỗi server. Vui lòng thử lại.' },
                loginData: {}
            });
        }
    }

    async posts(req, res) {
        try {
            if (!req.session || !req.session.user) {
                return res.redirect('/login?redirect=true');
            }

            const { id } = req.params;
            const user = await Users.findById(id).lean();
            if (!user) {
                req.session.destroy();
                return res.redirect('/login?redirect=true');
            }

            res.render('user/profiles/posts', {
                layout: 'user/index',
                title: 'Bài viết',
                session: req.session,
                user: user
            });
        } catch (err) {
            console.error('Lỗi khi lấy trang Bài viết:', err.message, err.stack);
            res.status(500).render('user/login', {
                layout: false,
                errors: { general: 'Có lỗi server. Vui lòng thử lại.' },
                loginData: {}
            });
        }
    }

    async about(req, res) {
        try {
            if (!req.session || !req.session.user) {
                return res.redirect('/login?redirect=true');
            }

            const { id } = req.params;
            const user = await Users.findById(id).lean();
            if (!user) {
                req.session.destroy();
                return res.redirect('/login?redirect=true');
            }

            if (user.dateOfBirth) {
                user.formattedDateOfBirth = new Date(user.dateOfBirth).toLocaleDateString('vi-VN');
            }

            if (user.hobbies && Array.isArray(user.hobbies)) {
                user.hobbiesString = user.hobbies.join(', ');
            }

            const success = req.query.success === 'true';

            res.render('user/profiles/about', {
                layout: 'user/index',
                title: 'Giới thiệu',
                session: req.session,
                user: user,
                success: success
            });
        } catch (err) {
            console.error('Lỗi khi lấy trang Giới thiệu:', err.message, err.stack);
            res.status(500).render('user/login', {
                layout: false,
                errors: { general: 'Có lỗi server. Vui lòng thử lại.' },
                loginData: {}
            });
        }
    }

    async dashboard(req, res) {
        try {
            if (!req.session || !req.session.user) {
                return res.redirect('/login?redirect=true');
            }

            const { id } = req.params;
            const user = await Users.findById(id).lean();
            if (!user) {
                req.session.destroy();
                return res.redirect('/login?redirect=true');
            }

            res.render('user/profiles/dashboard', {
                layout: 'user/index',
                title: 'Bảng điều khiển',
                session: req.session,
                user: user,
                chartData: {
                    task: {
                        title: "Tiến độ nhiệm vụ",
                        labels: ["Đang làm", "Hoàn thành", "Chưa bắt đầu", "Chậm tiến độ"],
                        data: [5, 3, 2, 2],
                        colors: ["#ffc107", "#28a745", "#6c757d", "#dc3545"],
                        tableTitle: "Nhiệm vụ gần đây",
                        tableHtml: `<table class="table table-striped table-sm"><thead><tr><th>Tên nhiệm vụ</th><th>Hạn</th><th>Trạng thái</th></tr></thead><tbody><tr><td>Hoàn thiện báo cáo</td><td>30/06/2025</td><td><span class="badge bg-warning text-dark">Đang làm</span></td></tr><tr><td>Kiểm tra hệ thống</td><td>28/06/2025</td><td><span class="badge bg-success">Hoàn thành</span></td></tr><tr><td>Triển khai dự án A</td><td>05/07/2025</td><td><span class="badge bg-danger">Chậm tiến độ</span></td></tr><tr><td>Soạn tài liệu hướng dẫn</td><td>10/07/2025</td><td><span class="badge bg-secondary">Chưa bắt đầu</span></td></tr></tbody></table>`
                    },
                    project: {
                        title: "Tiến độ dự án",
                        labels: ["Đang triển khai", "Đã hoàn thành", "Chưa khởi công", "Chậm tiến độ"],
                        data: [2, 2, 1, 1],
                        colors: ["#17a2b8", "#28a745", "#6c757d", "#dc3545"],
                        tableTitle: "Dự án gần đây",
                        tableHtml: `<table class="table table-striped table-sm"><thead><tr><th>Tên dự án</th><th>Thời gian</th><th>Trạng thái</th></tr></thead><tbody><tr><td>Dự án A</td><td>01/06/2025 - 30/09/2025</td><td><span class="badge bg-info text-dark">Đang triển khai</span></td></tr><tr><td>Dự án B</td><td>01/01/2025 - 31/03/2025</td><td><span class="badge bg-success">Đã hoàn thành</span></td></tr><tr><td>Dự án C</td><td>01/08/2025 - 31/12/2025</td><td><span class="badge bg-secondary">Chưa khởi công</span></td></tr><tr><td>Dự án D</td><td>01/05/2025 - 31/12/2025</td><td><span class="badge bg-danger">Chậm tiến độ</span></td></tr></tbody></table>`
                    }
                }
            });
        } catch (err) {
            console.error('Lỗi khi lấy trang Bảng điều khiển:', err.message, err.stack);
            res.status(500).render('user/login', {
                layout: false,
                errors: { general: 'Có lỗi server. Vui lòng thử lại.' },
                loginData: {}
            });
        }
    }

    async photos(req, res) {
        try {
            if (!req.session || !req.session.user) {
                return res.redirect('/login?redirect=true');
            }

            const { id } = req.params;
            const user = await Users.findById(id).lean();
            if (!user) {
                req.session.destroy();
                return res.redirect('/login?redirect=true');
            }

            res.render('user/profiles/photos', {
                layout: 'user/index',
                title: 'Ảnh',
                session: req.session,
                user: user
            });
        } catch (err) {
            console.error('Lỗi khi lấy trang Ảnh:', err.message, err.stack);
            res.status(500).render('user/login', {
                layout: false,
                errors: { general: 'Có lỗi server. Vui lòng thử lại.' },
                loginData: {}
            });
        }
    }

    edit(req, res, next) {
        Users.findById(req.params.id)
        .then(user => {
            const userObj = mongooseToObject(user);
            
            if (Array.isArray(userObj.hobbies)) {
                userObj.hobbies = userObj.hobbies.filter(h => h && h.trim() !== "");
            }

            if (userObj.dateOfBirth) {
            const d = new Date(userObj.dateOfBirth);
            const yyyy = d.getFullYear();
            const mm = String(d.getMonth() + 1).padStart(2, "0");
            const dd = String(d.getDate()).padStart(2, "0");
            userObj.formattedDateOfBirth = `${yyyy}-${mm}-${dd}`;
            } else {
            userObj.formattedDateOfBirth = "";
            }

            res.render("user/profiles/editprofile", {
            layout: 'user/index',
            title: 'Chỉnh sửa trang cá nhân',
            user: userObj,
            });
        })
        .catch(next);
    }

    update(req, res, next) {
        const updateData = {
            dateOfBirth: req.body.dateOfBirth || null,
            gender: req.body.gender || "",
            maritalStatus: req.body.maritalStatus || "",
            position: req.body.position || "",
            employeeId: req.body.employeeId || "",
            nickname: req.body.nickname || "",
            currentProvince: req.body.currentProvince || "",
            hometownProvince: req.body.hometownProvince || "",
            socialMedia: {
                facebook: req.body["socialMedia.facebook"] || "",
                instagram: req.body["socialMedia.instagram"] || "",
                linkedin: req.body["socialMedia.linkedin"] || "",
                twitter: req.body["socialMedia.twitter"] || "",
            },
            hobbies: Array.isArray(req.body.hobbies)
                ? req.body.hobbies
                : req.body.hobbies
                    ? [req.body.hobbies]
                    : [],
        };

        let avatarPath = null;

        if (req.file) {
            avatarPath = "/uploads/" + req.file.filename;
            updateData.avatar = avatarPath;
        }

        Users.findById(req.params.id)
            .then(user => {
                if (!user) throw new Error("User not found");

                if (avatarPath) {
                    user.photos = user.photos || [];
                    user.photos.push(avatarPath);
                    updateData.photos = user.photos;
                }

                return Users.updateOne({ _id: req.params.id }, updateData);
            })
            .then(() => {
                res.redirect(`/profile/${req.params.id}/about`);
            })
            .catch(next);
    }

    async setting(req, res) {
        try {
            if (!req.session || !req.session.user) {
                return res.redirect('/login?redirect=true');
            }

            const id = req.session.user.id;
            const user = await Users.findById(id).lean();
            if (!user) {
                req.session.destroy();
                return res.redirect('/login?redirect=true');
            }

            res.render('user/profiles/setting/setting', {
                layout: 'user/index',
                title: 'Trang cá nhân',
                session: req.session,
                user: user
            });
        } catch (err) {
            console.error('Lỗi khi lấy trang Bài viết:', err.message, err.stack);
            res.status(500).render('user/login', {
                layout: false,
                errors: { general: 'Có lỗi server. Vui lòng thử lại.' },
                loginData: {}
            });
        }
    }

    async information(req, res) {
        try {
            if (!req.session || !req.session.user) {
                return res.redirect('/login?redirect=true');
            }

            const id = req.session.user.id;
            const user = await Users.findById(id).lean();
            if (!user) {
                req.session.destroy();
                return res.redirect('/login?redirect=true');
            }

            res.render('user/profiles/setting/information', {
                layout: 'user/index',
                title: 'Trang cá nhân',
                session: req.session,
                user: user
            });
        } catch (err) {
            console.error('Lỗi khi lấy trang Bài viết:', err.message, err.stack);
            res.status(500).render('user/login', {
                layout: false,
                errors: { general: 'Có lỗi server. Vui lòng thử lại.' },
                loginData: {}
            });
        }
    }

    async password_security(req, res) {
        try {
            if (!req.session || !req.session.user) {
                return res.redirect('/login?redirect=true');
            }

            const id = req.session.user.id;
            const user = await Users.findById(id).lean();
            if (!user) {
                req.session.destroy();
                return res.redirect('/login?redirect=true');
            }

            res.render('user/profiles/setting/password_security', {
                layout: 'user/index',
                title: 'Trang cá nhân',
                session: req.session,
                user: user
            });
        } catch (err) {
            console.error('Lỗi khi lấy trang Bài viết:', err.message, err.stack);
            res.status(500).render('user/login', {
                layout: false,
                errors: { general: 'Có lỗi server. Vui lòng thử lại.' },
                loginData: {}
            });
        }
    }
}

module.exports = new SiteUserController();