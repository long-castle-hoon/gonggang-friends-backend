const express = require('express');
const User = require('../models/User');
const Activity = require('../models/Activity');
const auth = require('../middleware/auth');
const router = express.Router();

// 내 정보
router.get('/me', auth, async (req, res) => {
  const user = await User.findById(req.user.id).select('-password');
  res.json(user);
});

// 내가 만든 모집글
router.get('/me/activities', auth, async (req, res) => {
  const activities = await Activity.find({ creator: req.user.id });
  res.json(activities);
});

// 내가 참여한 모집글
router.get('/me/participations', auth, async (req, res) => {
  const activities = await Activity.find({ participants: req.user.id });
  res.json(activities);
});

// 즐겨찾기 위치 추가
router.post('/me/favorites', auth, async (req, res) => {
  const { name, location } = req.body; // location: [lng, lat]
  const user = await User.findById(req.user.id);
  user.favorites.push({ name, location });
  await user.save();
  res.json(user.favorites);
});

// 즐겨찾기 위치 조회
router.get('/me/favorites', auth, async (req, res) => {
  const user = await User.findById(req.user.id);
  res.json(user.favorites);
});

module.exports = router;

// 내 알림 조회
router.get('/me/notifications', auth, async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .populate('activity', 'title');
    res.json(notifications);
  } catch (err) {
    res.status(400).json({ error: '알림 조회 실패' });
  }
});

// 알림 읽음 처리
router.patch('/me/notifications/:id', auth, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { read: true },
      { new: true }
    );
    if (!notification) return res.status(404).json({ error: '알림을 찾을 수 없음' });
    res.json(notification);
  } catch (err) {
    res.status(400).json({ error: '알림 업데이트 실패' });
  }
});
