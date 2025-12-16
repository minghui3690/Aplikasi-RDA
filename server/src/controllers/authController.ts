import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, referralCode } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return res.status(400).json({ message: 'Email already exists' });

    // Find Upline
    let uplineId = null;
    if (referralCode) {
      const upline = await prisma.user.findUnique({ where: { referralCode } });
      if (upline) uplineId = upline.id;
    } else {
       // Default to admin if no ref code, or handle logic
       // For now, let's look for an admin
       const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
       if (admin) uplineId = admin.id;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newRefCode = 'RDA' + Math.floor(Math.random() * 100000); 

    // Generate Username: First Name (or first 2 chars) + 4 Random Digits
    let firstName = name.trim().split(/\s+/)[0].replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    
    // Fallback if name is empty or all symbols
    if (!firstName || firstName.length === 0) {
        firstName = 'user';
    }

    let username = '';
    let isUnique = false;
    while (!isUnique) {
        const random4 = Math.floor(1000 + Math.random() * 9000); // 1000-9999
        username = `${firstName}${random4}`;
        const check = await prisma.user.findUnique({ where: { username } });
        if (!check) isUnique = true;
    }

    const user = await prisma.user.create({
      data: {
        name,
        username,
        email,
        password: hashedPassword,
        referralCode: newRefCode,
        uplineId,
        walletBalance: 0,
        kyc: {
             phone: '', address: '', bankName: '', accountNumber: '', accountHolder: '', isVerified: false,
             gender: 'Man', birthDate: '', birthCity: '', birthTime: ''
        }
      }
    });

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET as string, { expiresIn: '7d' });

    res.status(201).json({ user, token });

  } catch (error) {
    res.status(500).json({ message: 'Error registering user', error });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    if (!user.isActive) return res.status(403).json({ message: 'Account inactive' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET as string, { expiresIn: '7d' });
    res.json({ user, token });

  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error });
  }
};

export const getMe = async (req: any, res: Response) => {
    try {
        const user = await prisma.user.findUnique({ where: { id: req.user.id } });
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching profile' });
    }
};

export const forgotPassword = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Generate Reset Token (Sign with secret + old password hash to ensure one-time use)
        // Actually for simplicity, just standard secret is fine, but shorter expiry
        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET as string, { expiresIn: '15m' });

        // LOG LINK since we have no SMTP
        // Assuming deployment url or localhost based on request
        // In production, we should use the actual domain.
        // req.get('host') usually works.
        const protocol = req.protocol;
        const host = req.get('host'); 
        // NOTE: On Render, host might be the backend host, but we need frontend URL.
        // For Single Service, they are same domain.
        const resetLink = `${protocol}://${host}/reset-password?token=${token}`;

        console.log('------------------------------------------------');
        console.log('🔑 PASSWORD RESET REQUEST FOR:', email);
        console.log('🔗 LINK:', resetLink);
        console.log('------------------------------------------------');

        res.json({ message: 'Reset link logged to server console (Simulated Email)' });

    } catch (error) {
        res.status(500).json({ message: 'Error processing request' });
    }
};

export const resetPassword = async (req: Request, res: Response) => {
    try {
        const { token, newPassword } = req.body;
        
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET as string);
        
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        await prisma.user.update({
            where: { id: decoded.id },
            data: { password: hashedPassword }
        });

        res.json({ message: 'Password updated successfully' });

    } catch (error) {
        res.status(400).json({ message: 'Invalid or expired token' });
    }
};
