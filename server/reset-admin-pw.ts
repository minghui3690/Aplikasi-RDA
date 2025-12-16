require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

async function main() {
    try {
        const email = 'devas1267@gmail.com';
        const password = 'admin'; // Keeping it simple or '123456'
        const hashedPassword = await bcrypt.hash(password, 10);
        
        await prisma.user.update({
            where: { email },
            data: { password: hashedPassword }
        });
        console.log(`Password for ${email} reset to: ${password}`);
    } catch(e) {
        console.error('Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}
main();
