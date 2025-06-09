import express from 'express';
import passport from 'passport';
import { Strategy as GitHubStrategy } from 'passport-github2';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User';
import { generateToken } from '../middleware/auth';

const router = express.Router();

// Configure GitHub strategy
passport.use(new GitHubStrategy({
  clientID: process.env.GITHUB_CLIENT_ID!,
  clientSecret: process.env.GITHUB_CLIENT_SECRET!,
  callbackURL: process.env.GITHUB_CALLBACK_URL!
}, async (accessToken: string, refreshToken: string, profile: any, done: any) => {
  try {
    // Check if user already exists
    let user = await User.findOne({ githubId: profile.id });
    
    if (user) {
      // Update existing user
      user.username = profile.username;
      user.email = profile.emails?.[0]?.value;
      user.avatarUrl = profile.photos?.[0]?.value;
      await user.save();
    } else {
      // Create new user
      user = new User({
        githubId: profile.id,
        username: profile.username,
        email: profile.emails?.[0]?.value,
        avatarUrl: profile.photos?.[0]?.value
      });
      await user.save();
    }
    
    return done(null, user);
  } catch (error) {
    return done(error, null);
  }
}));

passport.serializeUser((user: any, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// GitHub OAuth routes
router.get('/github', 
  passport.authenticate('github', { scope: ['user:email'] })
);

router.get('/github/callback',
  passport.authenticate('github', { failureRedirect: '/login' }),
  async (req, res) => {
    try {
      const user = req.user as IUser;
      
      // Generate JWT token
      const token = generateToken({
        userId: (user._id as any).toString(),
        githubId: user.githubId,
        email: user.email,
        username: user.username
      });
      
      // Redirect to frontend with token
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
    } catch (error) {
      console.error('Auth callback error:', error);
      res.status(500).json({ error: 'Authentication failed' });
    }
  }
);

// Token login for VSCode extension
router.post('/github/token', async (req, res) => {
  try {
    const { githubToken } = req.body;
    
    if (!githubToken) {
      return res.status(400).json({ error: 'GitHub token required' });
    }
    
    // Verify GitHub token and get user info
    const axios = require('axios');
    const userResponse = await axios.get('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${githubToken}` }
    });
    
    const githubUser = userResponse.data;
    
    // Check if user exists or create new one
    let user = await User.findOne({ githubId: githubUser.id.toString() });
    
    if (!user) {
      user = new User({
        githubId: githubUser.id.toString(),
        username: githubUser.login,
        email: githubUser.email,
        avatarUrl: githubUser.avatar_url
      });
      await user.save();
    }
    
    // Generate JWT token
    const token = generateToken({
      userId: (user._id as any).toString(),
      githubId: user.githubId,
      email: user.email,
      username: user.username
    });
    
    res.json({ token, user: { username: user.username, email: user.email } });
  } catch (error) {
    console.error('Token login error:', error);
    res.status(401).json({ error: 'Invalid GitHub token' });
  }
});

// Verify token endpoint
router.get('/verify', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    res.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatarUrl: user.avatarUrl
      }
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
});

// VSCode Extension Authentication
// This endpoint validates GitHub token from VSCode and returns our JWT
router.post('/vscode-login', async (req, res) => {
  try {
    const { githubToken } = req.body;
    
    if (!githubToken) {
      return res.status(400).json({ error: 'GitHub token is required' });
    }

    // Fetch user data from GitHub API using the provided token
    const githubResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `token ${githubToken}`,
        'User-Agent': 'VSCode-Productivity-Tracker'
      }
    });

    if (!githubResponse.ok) {
      return res.status(401).json({ error: 'Invalid GitHub token' });
    }

    const githubUser: any = await githubResponse.json();
    
    // Fetch user email from GitHub API (emails might be private)
    const emailResponse = await fetch('https://api.github.com/user/emails', {
      headers: {
        'Authorization': `token ${githubToken}`,
        'User-Agent': 'VSCode-Productivity-Tracker'
      }
    });

    let email = githubUser.email;
    if (!email && emailResponse.ok) {
      const emails = await emailResponse.json() as any[];
      const primaryEmail = emails.find((e: any) => e.primary) || emails[0];
      email = primaryEmail?.email;
    }

    // Check if user exists in our database
    let user = await User.findOne({ githubId: githubUser.id });
    
    if (user) {
      // Update existing user with latest GitHub data
      user.username = githubUser.login;
      user.email = email;
      user.avatarUrl = githubUser.avatar_url;
      user.name = githubUser.name;
      await user.save();
    } else {
      // Create new user
      user = new User({
        githubId: githubUser.id,
        username: githubUser.login,
        email: email,
        avatarUrl: githubUser.avatar_url,
        name: githubUser.name
      });
      await user.save();
      console.log(`✅ New user created: ${user.username} (${user.email})`);
    }

    // Generate our JWT token
    const token = generateToken({ 
      userId: user._id.toString(),
      githubId: user.githubId,
      email: user.email,
      username: user.username
    });

    res.json({
      token,
      user: {
        id: user._id,
        githubId: user.githubId,
        username: user.username,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl
      }
    });

  } catch (error) {
    console.error('VSCode login error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// Logout
router.post('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.json({ message: 'Logged out successfully' });
  });
});

export default router;
