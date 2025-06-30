const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Tasks = new Schema({
    taskName: { type: String, required: true },
    projectId: { type: Schema.Types.ObjectId, ref: 'Projects' },
    assignedAt: { type: Date, default: Date.now },
    deadline: { type: Date },
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
    quantity: { type: Number, min: 1, default: 1 },
    slugTask: { type: String, unique: true }
}, {
    timestamps: true,
});

module.exports = mongoose.model('Tasks', Tasks);
