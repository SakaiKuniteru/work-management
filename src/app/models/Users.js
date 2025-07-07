const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Users = new Schema({
    fullName: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    phoneNumber: { type: String },
    avatar: { type: String },
    coverPhoto: { type: String },
    dateOfBirth: { type: Date },
    gender: { type: String }, 
    age: { type: Number },                                
    maritalStatus: { type: String }, 
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
        others: [{ name: String, link: String }]
    },
    slug: { type: String, unique: true },                 
    photos: [{ type: String }],
    otp: { type: String },                                // Mã OTP tạm
    isVerified: { type: Boolean, default: false },        // Tài khoản đã kích hoạt hay chưa

}, {
    timestamps: true,
});

module.exports = mongoose.model('Users', Users);