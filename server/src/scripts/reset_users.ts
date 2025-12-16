
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanData() {
    console.log('Cleaning user data...');
    try {
        // Delete child tables first to avoid Foreign Key errors
        await prisma.commissionLog.deleteMany({});
        await prisma.walletLog.deleteMany({});
        await prisma.withdrawalRequest.deleteMany({});
        await prisma.transaction.deleteMany({}); 
        // Note: We are keeping Products, Vouchers, Settings, etc.
        
        // Finally delete Users
        await prisma.user.deleteMany({});
        
        console.log('✅ User table cleared! You can now register as the First User (MASTER).');
    } catch (e) {
        console.error('Error cleaning data:', e);
    } finally {
        await prisma.$disconnect();
    }
}

cleanData();
