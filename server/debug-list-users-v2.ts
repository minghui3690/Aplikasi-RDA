require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log('--- USER LIST START ---');
        const users = await prisma.user.findMany({
            select: { id: true, name: true, email: true, username: true, role: true, isActive: true }
        });
        console.table(users);
        console.log('--- USER LIST END ---');
    } catch(e) {
        console.error('Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}
main();
