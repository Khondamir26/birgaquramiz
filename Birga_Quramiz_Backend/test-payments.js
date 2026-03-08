const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

const PAYME_KEY = process.env.PAYME_MERCHANT_KEY || 'mock-payme-secret-key';
const CLICK_SECRET = process.env.CLICK_SECRET_KEY || 'mock-click-secret-key';
const CLICK_SERVICE_ID = process.env.CLICK_SERVICE_ID || 'mock-service-id';

async function testClick(order) {
    console.log(`\n--- Testing CLICK for Order ID: ${order.id} ---`);

    // 1. Prepare Action (0)
    const click_trans_id = '1234567';
    const amount = order.total.toString();
    const sign_time = '2023-10-01 12:00:00';

    const prepareSignString = `${click_trans_id}${CLICK_SERVICE_ID}${CLICK_SECRET}${order.id}${amount}0${sign_time}`;
    const prepareHash = crypto.createHash('md5').update(prepareSignString).digest('hex');

    const prepareBody = {
        click_trans_id,
        service_id: CLICK_SERVICE_ID,
        merchant_trans_id: order.id,
        amount,
        action: '0',
        error: 0,
        error_note: 'Success',
        sign_time,
        sign_string: prepareHash,
    };

    console.log('Sending Prepare Request...');
    const prepRes = await fetch('http://localhost:5000/payments/click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prepareBody)
    });
    console.log('Prepare Response:', await prepRes.json());

    // 2. Complete Action (1)
    const completeSignString = `${click_trans_id}${CLICK_SERVICE_ID}${CLICK_SECRET}${order.id}${order.id}${amount}1${sign_time}`;
    const completeHash = crypto.createHash('md5').update(completeSignString).digest('hex');

    const completeBody = {
        ...prepareBody,
        action: '1',
        merchant_prepare_id: order.id,
        sign_string: completeHash,
    };

    console.log('Sending Complete Request...');
    const compRes = await fetch('http://localhost:5000/payments/click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(completeBody)
    });
    console.log('Complete Response:', await compRes.json());
}

async function testPayme(order) {
    console.log(`\n--- Testing PAYME for Order ID: ${order.id} ---`);

    const authHeader = 'Basic ' + Buffer.from(`Paycom:${PAYME_KEY}`).toString('base64');

    // 1. CheckPerformTransaction
    const checkBody = {
        method: 'CheckPerformTransaction',
        params: {
            account: { order_id: order.id },
            amount: order.total * 100 // Tiyins
        },
        id: 123
    };

    console.log('Sending CheckPerformTransaction...');
    const checkRes = await fetch('http://localhost:5000/payments/payme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': authHeader },
        body: JSON.stringify(checkBody)
    });
    console.log('Check Response:', await checkRes.json());

    // 2. PerformTransaction
    const performBody = {
        method: 'PerformTransaction',
        params: {
            account: { order_id: order.id },
            amount: order.total * 100
        },
        id: 124
    };

    console.log('Sending PerformTransaction...');
    const perfRes = await fetch('http://localhost:5000/payments/payme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': authHeader },
        body: JSON.stringify(performBody)
    });
    console.log('Perform Response:', await perfRes.json());
}

async function main() {
    console.log('Finding 2 "NEW" orders to test...');
    const orders = await prisma.order.findMany({
        where: { status: 'NEW' },
        take: 2,
        include: { user: true }
    });

    if (orders.length < 2) {
        console.error('Need at least 2 NEW orders in the DB to test both gateways cleanly. Found:', orders.length);
        console.log('Creating mock orders...');
        // Fetch a user
        const user = await prisma.user.findFirst();
        for (let i = 0; i < 2 - orders.length; i++) {
            const newOrder = await prisma.order.create({
                data: {
                    userId: user.id,
                    total: 50000,
                    status: 'NEW',
                    customerName: 'Test Buyer',
                    customerPhone: '+998901234567',
                    deliveryAddress: 'Test Address'
                }
            });
            orders.push(newOrder);
        }
    }

    // Ensure user has telegramId so we can also test the notification
    // Let's just run the test, even if it fails to send a telegram message it logs it.

    await testClick(orders[0]);
    await testPayme(orders[1]);

    console.log('\nChecking final status in DB...');
    const updated1 = await prisma.order.findUnique({ where: { id: orders[0].id } });
    const updated2 = await prisma.order.findUnique({ where: { id: orders[1].id } });

    console.log(`Order ${updated1.id} status: ${updated1.status}`);
    console.log(`Order ${updated2.id} status: ${updated2.status}`);

    await prisma.$disconnect();
}

main().catch(console.error);
