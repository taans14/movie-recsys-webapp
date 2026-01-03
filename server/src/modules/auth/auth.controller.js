import jwt from 'jsonwebtoken';
import * as authService from './auth.service.js';
import registerDto from './dto/register.dto.js';
import loginDto from './dto/login.dto.js';
import Blacklist from './blacklist.schema.js';

const sendTokenResponse = (result, statusCode, res) => {
  const token = result.token;
  
  const options = {
    httpOnly: true,
    secure: true,
    sameSite: "None",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };

  console.log(token);

  const { token: _, ...userResponse } = result;

  res.status(statusCode)
    .cookie('accessToken', token, options)
    .json(userResponse);
};

export const register = async (req, res) => {
  try {
    const { error, value } = registerDto.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const result = await authService.register(value);
    sendTokenResponse(result, 201, res);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { error, value } = loginDto.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const result = await authService.login(value);
    sendTokenResponse(result, 200, res);
  } catch (error) {
    res.status(401).json({ message: error.message });
  }
};

export const logout = async (req, res) => {
  try {
    const token = req.cookies['accessToken'];

    if (token) {
      const decoded = jwt.decode(token);
      if (decoded && decoded.exp) {
        await Blacklist.create({
          token: token,
          expiresAt: new Date(decoded.exp * 1000) 
        });
      }
    }

    res.clearCookie("accessToken");
    res.status(200).json({ message: 'User logged out successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Logout failed', error: error.message });
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
  });
};