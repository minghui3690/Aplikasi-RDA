import 'dotenv/config'; // MUST be first to avoid hoisting issues   
import express from 'express'; // Trigger Restart 
import cors from 'cors';
import morgan from 'morgan';

console.log('Starting server initialization... (Restart Triggered)');

// import prisma from './lib/prisma';
import prisma from './lib/prisma';
console.log('Dotenv config done (via import).');

import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import productRoutes from './routes/productRoutes';
import transactionRoutes from './routes/transactionRoutes';
import voucherRoutes from './routes/voucherRoutes';
import settingsRoutes from './routes/settingsRoutes';
import customerRoutes from './routes/customerRoutes';
import hdRoutes from './routes/hdRoutes';
import consultationRoutes from './routes/consultationRoutes';
import testimonialRoutes from './routes/testimonialRoutes';

console.log('Routes imported.');

const app = express();
// const prisma = new PrismaClient();
const PORT = 5001; // Force 5001 to avoid .env conflict

// Test Database Connection
prisma.$connect()
  .then(() => {
    console.log('✅ Connected to Database successfully!');
  })
  .catch((e) => {
    console.error('❌ Database connection failed:', e);
  });

app.use(cors());
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ limit: '500mb', extended: true }));
app.use(morgan('dev'));

import path from 'path';

console.log('Middleware set.');

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/vouchers', voucherRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/hd-knowledge', hdRoutes); // [NEW] Knowledge Base Routes
app.use('/api/consultation', consultationRoutes); // [NEW] Consultation System
app.use('/api/testimonials', testimonialRoutes); // [NEW] Product Testimonials

import chatRoutes from './routes/chatRoutes';
app.use('/api/chat', chatRoutes); // [NEW] AI Chat

// --- EMERGENCY FIX ROUTE (Delete after use) ---
app.get('/api/emergency-admin', async (req, res) => {
    try {
        const email = req.query.email as string;
        if (!email) return res.send('Please provide email query param');
        
        const user = await prisma.user.update({
            where: { email },
            data: { role: 'MASTER' }
        });
        res.send(`SUCCESS! User ${email} is now MASTER. Try logging in.`);
    } catch (e: any) {
        res.send(`ERROR: ${e.message}`);
    }
});

app.get('/api/emergency-manager', async (req, res) => {
    try {
        const email = req.query.email as string;
        if (!email) return res.send('Please provide email query param');
        
        const user = await prisma.user.update({
            where: { email },
            data: { role: 'ADMIN' }
        });
        res.send(`SUCCESS! User ${email} is now ADMIN. Try logging in.`);
    } catch (e: any) {
        res.send(`ERROR: ${e.message}`);
    }
});
// ----------------------------------------------

// --- SERVE FRONTEND (Single Service Strategy) ---
const frontendPath = path.join(__dirname, '../../dist');
console.log('Serving frontend from:', frontendPath);

// 1. Serve Static Assets (JS, CSS, Images, etc.)
app.use(express.static(frontendPath));

// 2. Catch-All for Client-Side Routing (Must be LAST)
app.get(/(.*)/, (req, res) => {
    // If it's an API call that wasn't caught above, it's a 404
    if (req.path.startsWith('/api')) {
        return res.status(404).json({ message: 'API Endpoint not found' });
    }
    // Otherwise, serve index.html
    const indexPath = path.join(frontendPath, 'index.html');
    res.sendFile(indexPath, (err) => {
        if (err) {
            console.error('Error serving index.html:', err);
            res.status(500).send('Server Error: Frontend not found. Did you run "npm run build"?');
        }
    });
});


console.log('Routes defined, starting listen...');

const server = app.listen(PORT, '0.0.0.0', () => { // Bind to all interfaces
  console.log(`Server running on port ${PORT}`);
});

server.on('close', () => console.log('Server closed'));
server.on('error', (e) => console.error('Server error:', e));


