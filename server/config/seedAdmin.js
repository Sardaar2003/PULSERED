const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { getIsConnected, getMemoryStore } = require('./db');
const logger = require('../logger');

const ADMIN_EMAIL = 'admin@pulsered.com';
const ADMIN_PASSWORD = 'AdminMaster2026!';

const seedMasterAdmin = async () => {
  try {
    const isDbConnected = getIsConnected();
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, salt);

    if (isDbConnected) {
      let admin = await User.findOne({ email: ADMIN_EMAIL });
      if (!admin) {
        admin = await User.create({
          name: 'Master Administrator',
          email: ADMIN_EMAIL,
          password: hashedPassword,
          role: 'admin',
          isApproved: true,
        });
        logger.info(`✅ Master Admin account created in MongoDB Atlas: ${ADMIN_EMAIL}`);
      } else {
        // Ensure admin retains role & approval
        admin.role = 'admin';
        admin.isApproved = true;
        await admin.save();
        logger.info(`✅ Master Admin account verified in MongoDB Atlas: ${ADMIN_EMAIL}`);
      }
    } else {
      const store = getMemoryStore();
      let admin = store.users.find((u) => u.email === ADMIN_EMAIL);
      if (!admin) {
        store.users.push({
          id: 'admin_master_1',
          name: 'Master Administrator',
          email: ADMIN_EMAIL,
          password: hashedPassword,
          role: 'admin',
          isApproved: true,
          activeSessionId: null,
          prowloApiKey: '',
          createdAt: new Date(),
        });
        logger.info(`✅ Master Admin account seeded in memory store: ${ADMIN_EMAIL}`);
      }
    }
  } catch (error) {
    logger.error('Failed to seed Master Admin account', { error: error.message });
  }
};

module.exports = { seedMasterAdmin, ADMIN_EMAIL, ADMIN_PASSWORD };
