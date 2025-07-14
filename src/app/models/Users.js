const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Users = new Schema({
    fullName: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    phoneNumber: { type: String },
    avatar: { type: String },
    dateOfBirth: { type: Date },
    gender: { type: String }, 
    maritalStatus: { type: String }, 
    position: { type: String },
    employeeId: { type: String },
    currentProvince: { type: String },
    hometownProvince: { type: String },
    nickname: { type: String },
    hobbies: [{ type: String }],
    socialMedia: { 
        facebook: { type: String },
        instagram: { type: String },
        twitter: { type: String },
        linkedin: { type: String },
        others: [{ name: String, link: String }]
    },
    // slug: { type: String, unique: true },
    photos: [{ type: String }],
    otp: { type: String },
    isVerified: { type: Boolean, default: false },

}, {
    timestamps: true,
});

module.exports = mongoose.model('Users', Users);