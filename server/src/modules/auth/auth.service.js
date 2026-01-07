import jwt from 'jsonwebtoken';
import User from '../users/users.schema.js';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
};

export const register = async (userData) => {
  const userExists = await User.findOne({ email: userData.email });
  if (userExists) {
    throw new Error('User already exists');
  }

  const user = await User.create({
    ...userData,
  });

  return {
    _id: user._id,
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
    token: generateToken(user._id),
  };
};

export const login = async ({ email, password }) => {
  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))) {
    return {
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      token: generateToken(user._id),
    };
  } else {
    throw new Error('Invalid email or password');
  }
};
