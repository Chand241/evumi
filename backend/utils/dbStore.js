const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const OtpVerification = require('../models/OtpVerification');

/**
 * Resilient Database Store Helper
 * 
 * Provides fail-safe data access for User and OtpVerification.
 * If MongoDB Atlas is healthy and reachable -> uses MongoDB directly.
 * If MongoDB Atlas fails (IP whitelist issue, network timeout, SSL alert 80) ->
 * seamlessly falls back to in-memory store so the server NEVER crashes with 500.
 */

if (!global._memoryUsers) {
  global._memoryUsers = [];
}
if (!global._memoryOtps) {
  global._memoryOtps = [];
}

const isDbReady = () => mongoose.connection && mongoose.connection.readyState === 1;

/**
 * Execute a DB query with a strict timeout to avoid hanging when Atlas is unreachable.
 */
const safeDbCall = async (fn, fallbackFn) => {
  if (!isDbReady()) {
    return await fallbackFn();
  }

  try {
    // Run with 2.5 second timeout
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('DB_TIMEOUT')), 2500)
    );
    return await Promise.race([fn(), timeoutPromise]);
  } catch (err) {
    console.warn('⚠️ [DB Fallback Active] Database operation failed or timed out:', err.message);
    return await fallbackFn();
  }
};

// -------------------------------------------------------------
// USER OPERATIONS
// -------------------------------------------------------------

const findUserByEmail = async (email) => {
  const cleanEmail = email.trim().toLowerCase();
  return safeDbCall(
    () => User.findOne({ email: cleanEmail }),
    () => {
      const found = global._memoryUsers.find(u => u.email.toLowerCase() === cleanEmail);
      if (!found) return null;
      return {
        ...found,
        toObject: () => ({ ...found }),
        comparePassword: async (pwd) => bcrypt.compare(pwd, found.password)
      };
    }
  );
};

const findUserByNid = async (nid) => {
  const cleanNid = nid.trim();
  return safeDbCall(
    () => User.findOne({ nid: cleanNid }),
    () => {
      const found = global._memoryUsers.find(u => u.nid === cleanNid);
      if (!found) return null;
      return {
        ...found,
        toObject: () => ({ ...found }),
        comparePassword: async (pwd) => bcrypt.compare(pwd, found.password)
      };
    }
  );
};

const createCitizenUser = async (userData) => {
  const hashedPassword = await bcrypt.hash(userData.password, 10);
  const userPayload = {
    ...userData,
    role: 'User',
    status: 'Active',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  // Always keep in memory store as backup
  const memoryUserRecord = {
    _id: 'usr_' + Date.now() + Math.random().toString(36).substring(2, 7),
    ...userPayload,
    password: hashedPassword
  };
  global._memoryUsers.push(memoryUserRecord);

  if (isDbReady()) {
    try {
      const newUser = new User(userPayload);
      await newUser.save();
      return newUser;
    } catch (err) {
      console.warn('⚠️ Could not save user to MongoDB Atlas (saved to memory):', err.message);
    }
  }

  return {
    ...memoryUserRecord,
    toObject: () => ({ ...memoryUserRecord }),
    comparePassword: async (pwd) => bcrypt.compare(pwd, memoryUserRecord.password)
  };
};

// -------------------------------------------------------------
// OTP OPERATIONS
// -------------------------------------------------------------

const createRegistrationOtp = async (cleanEmail, otp, cleanNid, name, expiresAt) => {
  // 1. Remove old unverified registration OTPs from memory
  global._memoryOtps = global._memoryOtps.filter(
    o => !(o.email === cleanEmail && o.purpose === 'ACCOUNT_REGISTRATION')
  );

  const otpRecord = {
    _id: 'otp_' + Date.now(),
    email: cleanEmail,
    otp: otp.toString().trim(),
    purpose: 'ACCOUNT_REGISTRATION',
    metadata: { nid: cleanNid, name: name.trim() },
    attempts: 0,
    verified: false,
    createdAt: new Date(),
    expiresAt
  };
  global._memoryOtps.push(otpRecord);

  if (isDbReady()) {
    try {
      await OtpVerification.deleteMany({
        email: cleanEmail,
        purpose: 'ACCOUNT_REGISTRATION'
      });
      await OtpVerification.create({
        email: cleanEmail,
        otp: otpRecord.otp,
        purpose: 'ACCOUNT_REGISTRATION',
        metadata: otpRecord.metadata,
        expiresAt
      });
    } catch (err) {
      console.warn('⚠️ Could not save OTP to MongoDB Atlas (saved to memory):', err.message);
    }
  }

  return otpRecord;
};

const findLatestRegistrationOtp = async (cleanEmail) => {
  return safeDbCall(
    async () => {
      return await OtpVerification.findOne({
        email: cleanEmail,
        purpose: 'ACCOUNT_REGISTRATION'
      }).sort({ createdAt: -1 });
    },
    () => {
      const matching = global._memoryOtps
        .filter(o => o.email === cleanEmail && o.purpose === 'ACCOUNT_REGISTRATION')
        .sort((a, b) => b.createdAt - a.createdAt);
      return matching[0] || null;
    }
  );
};

const updateOtpRecord = async (otpRecord, updates) => {
  // Update memory
  const memoryIndex = global._memoryOtps.findIndex(o => o._id === otpRecord._id || (o.email === otpRecord.email && o.purpose === otpRecord.purpose));
  if (memoryIndex !== -1) {
    global._memoryOtps[memoryIndex] = {
      ...global._memoryOtps[memoryIndex],
      ...updates
    };
  }

  // Update DB if instance is Mongoose document
  if (otpRecord.save) {
    try {
      Object.assign(otpRecord, updates);
      await otpRecord.save();
    } catch (err) {
      console.warn('⚠️ Could not save OTP updates to DB:', err.message);
    }
  }
};

const deleteRegistrationOtps = async (cleanEmail) => {
  global._memoryOtps = global._memoryOtps.filter(
    o => !(o.email === cleanEmail && o.purpose === 'ACCOUNT_REGISTRATION')
  );

  if (isDbReady()) {
    try {
      await OtpVerification.deleteMany({
        email: cleanEmail,
        purpose: 'ACCOUNT_REGISTRATION'
      });
    } catch (err) {
      console.warn('⚠️ Could not delete OTPs from DB:', err.message);
    }
  }
};

module.exports = {
  isDbReady,
  findUserByEmail,
  findUserByNid,
  createCitizenUser,
  createRegistrationOtp,
  findLatestRegistrationOtp,
  updateOtpRecord,
  deleteRegistrationOtps
};
