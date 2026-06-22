// One-time script to promote a user to admin by email.
// Usage: node scripts/makeAdmin.js your@email.com

const mongoose = require('mongoose');
const User     = require('../models/User');

const email = process.argv[2];
if (!email) { console.error('Usage: node scripts/makeAdmin.js your@email.com'); process.exit(1); }

mongoose.connect('mongodb://127.0.0.1:27017/nutriconnect')
  .then(async () => {
    const user = await User.findOneAndUpdate(
      { email },
      { role: 'admin', subscription: 'premium' },
      { new: true }
    );
    if (!user) {
      console.error(`No user found with email: ${email}`);
    } else {
      console.log(`✅ ${user.name} (${user.email}) is now an admin.`);
    }
    process.exit(0);
  })
  .catch(err => { console.error(err); process.exit(1); });
