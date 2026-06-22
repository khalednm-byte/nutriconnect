const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6, select: false },
  role:     { type: String, enum: ['user', 'nutritionist', 'admin'], default: 'user' },
  subscription: { type: String, enum: ['free', 'premium', 'pro'], default: 'free' },

  assignedNutritionist: {
    id:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: String,
  },

  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', default: null },

  profile: {
    bio:             { type: String, default: '' },
    avatar:          { type: String, default: null },
    goals:           [String],
    dietPreferences: [String],
    allergies:       [String],
    currentWeight:   Number,
    targetWeight:    Number,
    height:          Number,
    age:             Number,
    location:        String,
  },

  // Nutritionist-specific fields (only populated when role === 'nutritionist')
  nutritionistProfile: {
    title:             String,
    credentials:       [String],
    specializations:   [String],
    experience:        Number,
    consultationRate:  Number,
    consultationTypes: [String],
    languages:         [String],
    rating:            { type: Number, default: 0 },
    reviewCount:       { type: Number, default: 0 },
    available:         { type: Boolean, default: true },
  },

  stats: {
    followers:   { type: Number, default: 0 },
    following:   { type: Number, default: 0 },
    postsCount:  { type: Number, default: 0 },
    streak:      { type: Number, default: 0 },
    points:      { type: Number, default: 0 },
    level:       { type: Number, default: 1 },
    badges:      [String],
  },

  notifications: [
    {
      type:    { type: String },
      text:    String,
      read:    { type: Boolean, default: false },
      createdAt: { type: Date, default: Date.now },
    }
  ],

}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

// Compare password helper
userSchema.methods.comparePassword = function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Never send password in responses
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
