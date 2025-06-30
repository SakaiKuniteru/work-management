const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Users = new Schema({
    fullName: { type: String, required: true },            // Họ tên
    email: { type: String, unique: true, required: true }, // Email
    password: { type: String, required: true },            // Mật khẩu đã mã hóa
    phoneNumber: { type: String },                         // Số điện thoại
    avatar: { type: String },                              // Ảnh đại diện
    coverPhoto: { type: String },                          // Ảnh bìa
    dateOfBirth: { type: Date },                           // Ngày sinh
    gender: { type: String, enum: ['Male', 'Female', 'Other'] }, 
    age: { type: Number },                                
    maritalStatus: { type: String, enum: ['Single', 'Married', 'Divorced', 'Widowed'] }, 
    position: { type: String },                           
    employeeId: { type: String },                         
    currentAddress: { type: String },                     
    hometown: { type: String },                           
    nickname: { type: String },                           
    hobbies: [{ type: String }],                          
    socialMedia: {                                        
        facebook: { type: String },
        instagram: { type: String },
        twitter: { type: String },
        linkedin: { type: String },
        others: { type: String }
    },
    slug: { type: String, unique: true },                 

    otp: { type: String },                                // Mã OTP tạm
    isVerified: { type: Boolean, default: false },        // Tài khoản đã kích hoạt hay chưa

}, {
    timestamps: true,
});

module.exports = mongoose.model('Users', Users);