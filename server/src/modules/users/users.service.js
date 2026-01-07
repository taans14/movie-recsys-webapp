import User from './users.schema.js';

export const getUserProfile = async (userId) => {
  return await User.findById(userId).select('-password');
};

export const updateUserProfile = async (userId, updateData) => {
  if (updateData.favoriteGenres && updateData.favoriteGenres.length > 3) {
    throw new Error("You can only select up to 3 favorite genres.");
  }

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $set: updateData },
    { new: true, runValidators: true }
  ).select('-password');

  return updatedUser;
};
