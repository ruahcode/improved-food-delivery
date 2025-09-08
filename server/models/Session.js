const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;

const sessionSchema = new mongoose.Schema({
    user: {
        type: ObjectId,
        ref: 'User',
        required: true
    },
    token: {
        type: String,
        required: true,
        unique: true
    },
    userAgent: {
        type: String,
        default: ''
    },
    ipAddress: {
        type: String,
        default: ''
    },
    expiresAt: {
        type: Date,
        required: true,
        index: { expires: 0 } // TTL index to automatically remove expired sessions
    },
    lastActivity: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index for finding all sessions for a user
sessionSchema.index({ user: 1 });

// Static method to create a new session
sessionSchema.statics.createSession = async function(user, token, userAgent = '', ipAddress = '') {
    const sessionDuration = 24 * 60 * 60 * 1000; // 24 hours
    const expiresAt = new Date(Date.now() + sessionDuration);
    
    const session = new this({
        user: user._id,
        token,
        userAgent,
        ipAddress,
        expiresAt
    });
    
    await session.save();
    return session;
};

// Method to refresh session expiration
sessionSchema.methods.refresh = function() {
    const sessionDuration = 24 * 60 * 60 * 1000; // 24 hours
    this.expiresAt = new Date(Date.now() + sessionDuration);
    this.lastActivity = new Date();
    return this.save();
};

// Method to end (invalidate) a session
sessionSchema.methods.end = function() {
    this.expiresAt = new Date();
    return this.save();
};

const Session = mongoose.model('Session', sessionSchema);

module.exports = Session;
