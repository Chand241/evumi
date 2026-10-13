const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'evhumi_super_secure_secret_2026';

const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'অননুমোদিত প্রবেশাধিকার। টোকেন পাওয়া যায়নি।' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'ব্যবহারকারী খুঁজে পাওয়া যায়নি।' });
    }

    if (user.status === 'Blocked') {
      return res.status(403).json({ success: false, message: 'আপনার অ্যাকাউন্টটি স্থগিত (Blocked) করা হয়েছে।' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'টোকেন মেয়াদোত্তীর্ণ বা অবৈধ।' });
  }
};

const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'প্রথমে লগইন করুন।' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `প্রবেশাধিকার নেই। এই ফিচারের জন্য অনুমোদিত রোল: ${allowedRoles.join(', ')}। আপনার বর্তমান রোল: ${req.user.role}`
      });
    }

    next();
  };
};

module.exports = { verifyToken, requireRole, JWT_SECRET };
