// controllers/authController.js
import * as AuthService from '../services/authService.js';

export async function handleRegister(req, res) {
  const { username, password } = req.body;
  try {
    const userId = await AuthService.register(username, password);
  } catch (err) {
    res.status(400).json({ msg: err.message });
  }
}

export async function handleConfirmRegister(req, res) {
  const { username } = req.body;
  try {
    const userId = await AuthService.confirmRegister(username);
    res.json({ msg: '注册成功', userId });
  } catch (err) {
    res.status(400).json({ msg: err.message });
  }
}

export async function handleLogin(req, res) {
  const { username, password } = req.body;
  try {
    const user = await AuthService.login(username, password);
    res.json({ msg: '登录成功', user: user.username });
  } catch (err) {
    res.status(401).json({ msg: err.message });
  }
}
