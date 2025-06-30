const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Projects = new Schema({
    projectName: { type: String, required: true },
    startDate: { type: Date },
    endDate: { type: Date },
    status: {
        type: String,
        enum: ['Pending', 'In Progress', 'Completed', 'Cancelled'],
        default: 'Pending'
    },
    priority: {
        type: String,
        enum: ['Low', 'Medium', 'High'],
        default: 'Medium'
    },
    totalTasks: { type: Number, default: 0 },
    progress: { type: Number, default: 0 }, // Từ 0-100 (%)
    slugProject: { type: String, unique: true }
}, {
    timestamps: true,
});

module.exports = mongoose.model('Projects', Projects);
