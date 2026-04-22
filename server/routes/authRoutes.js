import express from 'express';
import { users } from '../data/users.js';

const router = express.Router();

// Mock Auth Login Route
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Please provide email and password' });
  }

  // Find user by email in mock data
  const user = users.find(u => u.email === email);

  // In a real app we'd verify passwords, here we just assume any password works for the demo if user exists
  if (user) {
    // Generate a fake token
    const token = `fake-jwt-token-${user.id}-${Date.now()}`;
    
    // In a real app we wouldn't return the full user object, but rather a safe DTO
    res.json({
      success: true,
      user,
      token
    });
  } else {
    // To allow demoing the default 'alex@email.com' login from frontend which might not match mock data exactly
    // In the frontend the mock is alex@nutriconnect.com or alex@email.com
    // Let's just create a generic user if the email is alex@email.com
    if (email === 'alex@email.com') {
      res.json({
        success: true,
        user: users[0], // the currentUser 'Alex Morgan'
        token: `fake-jwt-token-u1-${Date.now()}`
      });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  }
});

// Mock Auth Register Route
router.post('/register', (req, res) => {
  const { name, email, password, profile } = req.body;
  
  const newUser = {
    id: `u${Date.now()}`,
    name,
    email,
    avatar: null,
    role: 'user',
    subscription: 'free',
    profile: profile || {},
    stats: { followers: 0, following: 0, postsCount: 0, streak: 0, points: 0, level: 1 },
    createdAt: new Date().toISOString()
  };

  // Mutating the mock array in memory (will reset if server restarts)
  users.push(newUser);

  res.status(201).json({
    success: true,
    user: newUser,
    token: `fake-jwt-token-${newUser.id}-${Date.now()}`
  });
});

export default router;
