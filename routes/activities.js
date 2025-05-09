const express = require('express');
const Activity = require('../models/Activity');
const User = require('../models/User');
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');
const router = express.Router();

// 모집글 등록
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, category, coordinates, placeName, detailPlace, startTime, endTime, maxParticipants, image } = req.body;
    const activity = new Activity({
      title,
      description,
      category,
      location: { type: 'Point', coordinates },
      placeName,
      detailPlace,
      startTime,
      endTime,
      maxParticipants,
      creator: req.user.id,
      participants: [req.user.id],
      image
    });
    await activity.save();
    res.status(201).json(activity);
  } catch (err) {
    console.error('모집글 등록 오류:', err);
    res.status(400).json({ error: '등록 실패' });
  }
});

// 모집글 리스트 (위치, 시간, 카테고리 필터)
router.get('/', async (req, res) => {
  try {
    console.log('모집글 리스트 요청 받음:', req.query);
    const { lng, lat, maxDistance = 1000, category, startTime, endTime } = req.query;
    let filter = {};
    
    if (lng && lat) {
      filter.location = {
        $near: {
          $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: parseInt(maxDistance)
        }
      };
    }
    
    if (category) filter.category = category;
    
    if (startTime && endTime) {
      filter.startTime = { $gte: new Date(startTime) };
      filter.endTime = { $lte: new Date(endTime) };
    }
    
    console.log('적용된 필터:', JSON.stringify(filter));
    
    // Content-Type 명시적 설정
    res.setHeader('Content-Type', 'application/json');
    
    const activities = await Activity.find(filter).populate('creator', 'nickname');
    console.log('모집글 조회 결과:', activities.length, '개 항목 찾음');
    
    // 명시적으로 JSON 응답 반환
    return res.json(activities);
  } catch (err) {
    console.error('모집글 조회 오류:', err);
    return res.status(400).json({ error: '조회 실패', details: err.message });
  }
});

// 모집글 상세 조회
router.get('/:id', async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id)
      .populate('creator', 'nickname')
      .populate('participants', 'nickname');
    
    if (!activity) return res.status(404).json({ error: '모집글 없음' });
    
    res.setHeader('Content-Type', 'application/json');
    return res.json(activity);
  } catch (err) {
    console.error('모집글 상세 조회 오류:', err);
    return res.status(400).json({ error: '조회 실패' });
  }
});

// 모집글 참여
router.post('/:id/join', auth, async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id);
    if (!activity) return res.status(404).json({ error: '모집글 없음' });
    if (activity.participants.includes(req.user.id)) return res.status(400).json({ error: '이미 참여함' });
    if (activity.participants.length >= activity.maxParticipants) return res.status(400).json({ error: '인원 초과' });
    
    // 사용자 정보 가져오기
    const user = await User.findById(req.user.id);
    
    // 참여자 추가
    activity.participants.push(req.user.id);
    await activity.save();
    
    // 모집글 작성자에게 알림 생성
    await Notification.create({
      user: activity.creator,
      activity: activity._id,
      message: `${user.nickname}님이 "${activity.title}" 모집글에 참여했습니다.`
    });
    
    res.json({ message: '참여 완료' });
  } catch (err) {
    console.error('모집글 참여 오류:', err);
    res.status(400).json({ error: '참여 실패' });
  }
});

module.exports = router;
