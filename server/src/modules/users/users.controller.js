import * as userService from './users.service.js';

export const getProfile = async (req, res) => {
  try {
    // req.user is set by the passport middleware
    const user = await userService.getUserProfile(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const updateData = req.body;

    const updatedUser = await userService.updateUserProfile(userId, updateData);

    res.json(updatedUser);
  } catch (error) {
    console.error('Update Profile Error:', error.message);
    if (error.message.includes("up to 3")) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Failed to update profile' });
  }
};

export const getMe = (req, res) => {
  const user = req.user;

  res.status(200).json({
    _id: user._id,
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
    favoriteGenres: user.favoriteGenres
  });
};
