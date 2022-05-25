import express from 'express';
const router = express.Router();
import User from '../models/user.js';
import passport from 'passport';
import { signin } from '../controllers/users.controller.js';
import addNotifications from '../helpers/subscriptions.js';

router.get('/signin', (req, res) => {
  res.render('pages/signin');
});

router.post(
  '/signin',
  passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/users/signin',
    failureFlash: true,
  })
);

router.get('/signup', (req, res) => {
  res.render('pages/signup');
});

router.post('/signup', async (req, res) => {
  const errors = [];
  const { name, email, password, confirm_password } = req.body;

  console.log('req.body :>> ', req.body);

  if (name.length <= 0) {
    errors.push({ text: 'Please write your name' });
  }
  if (email.length <= 0) {
    errors.push({ text: 'Please write your email' });
  }
  if (password.length <= 0) {
    errors.push({ text: 'Please write your password' });
  }
  if (password.length < 4) {
    errors.push({ text: 'Password must be at least 4 characters' });
  }
  if (password != confirm_password) {
    errors.push({ text: 'Passwords do not match' });
  }

  if (errors.length > 0) {
    errors.map((error) => {
      req.flash('error_msg', error.text);
    });
    res.redirect('/users/signup');
  } else {
    const emailUser = await User.findOne({ email });
    if (emailUser) {
      req.flash('error_msg', 'The Email is already in use.');

      res.redirect('/users/signup');
    } else {
      const newUser = new User({ name, email, password });
      newUser.password = await newUser.encryptPassword(password);
      await newUser.save();

      console.log(newUser);
      res.redirect('/users/signin');
    }
  }
});

router.get('/logout', function (req, res, next) {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect('/');
  });
});

router.post('/profile/:id', async (req, res) => {
  const id = req.user.id;
  const { subscriptions } = req.body;
  if (id) {
    await User.findByIdAndUpdate(id, {
      subscriptions: subscriptions,
    });
    addNotifications(req.user);
    res.render('pages/profile', { user: req.user });
  }
});

router.get('/profile', async (req, res) => {
  const user = await User.findById(req.user._id);

  res.render('pages/profile', { user });
});

export default router;