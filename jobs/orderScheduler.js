const db = require('../config/db');
const schedule = require('node-schedule');

// //PESANAN SELESAI OTOMATIS DALAM 2 HARI
// schedule.scheduleJob('0 0 * * *', async () => {
//     console.log('Menjalankan validasi otomatis pesanan...');

//     try {
//         const query = `
//             SELECT order_id, status_id 
//             FROM orders 
//             WHERE status_id IN (1, 4) AND TIMESTAMPDIFF(DAY, order_date, NOW()) >= 2
//         `;
//         const [orders] = await db.promise().query(query);

//         if (orders.length > 0) {
//             const completeOrders = [];
//             const cancelOrders = [];

//             orders.forEach(order => {
//                 if (order.status_id === 1) {
//                     cancelOrders.push(order.order_id);
//                 } else if (order.status_id === 4) {
//                     completeOrders.push(order.order_id);
//                 }
//             });

//             if (cancelOrders.length > 0) {
//                 const cancelQuery = `
//                     UPDATE orders 
//                     SET status_id = 6 
//                     WHERE order_id IN (?)
//                 `;
//                 await db.promise().query(cancelQuery, [cancelOrders]);
//                 console.log(`Pesanan dibatalkan: ${cancelOrders.join(', ')}`);
//             }

//             if (completeOrders.length > 0) {
//                 const completeQuery = `
//                     UPDATE orders 
//                     SET status_id = 5 
//                     WHERE order_id IN (?)
//                 `;
//                 await db.promise().query(completeQuery, [completeOrders]);
//                 console.log(`Pesanan selesai: ${completeOrders.join(', ')}`);
//             }
//         } else {
//             console.log('Tidak ada pesanan yang perlu diperbarui.');
//         }
//     } catch (error) {
//         console.error('Error dalam validasi otomatis:', error);
//     }
// });
// console.log('Scheduler order validation aktif...');


//UNTUK TEST PESANAN SELESAI OTOMATIS DALAM 1 MENIT
// Scheduler: Jalan setiap menit untuk testing
schedule.scheduleJob('*/1 * * * *', async () => {
    console.log('🔄 Menjalankan validasi otomatis pesanan (TEST MODE)...');

    try {
        const query = `
            SELECT order_id, status_id 
            FROM orders 
            WHERE status_id IN (1, 4) 
            AND TIMESTAMPDIFF(MINUTE, order_date, NOW()) >= 1
        `;
        const [orders] = await db.promise().query(query);

        if (orders.length > 0) {
            const completeOrders = [];
            const cancelOrders = [];

            orders.forEach(order => {
                if (order.status_id === 1) {
                    cancelOrders.push(order.order_id);
                } else if (order.status_id === 4) {
                    completeOrders.push(order.order_id);
                }
            });

            if (cancelOrders.length > 0) {
                await db.promise().query(`UPDATE orders SET status_id = 6 WHERE order_id IN (?)`, [cancelOrders]);
                console.log(`❌ Pesanan dibatalkan (order_id): ${cancelOrders.join(', ')}`);
            }

            if (completeOrders.length > 0) {
                await db.promise().query(`UPDATE orders SET status_id = 5 WHERE order_id IN (?)`, [completeOrders]);
                console.log(`✅ Pesanan diselesaikan (order_id): ${completeOrders.join(', ')}`);
            }
        } else {
            console.log('✅ Tidak ada pesanan yang perlu diperbarui.');
        }
    } catch (error) {
        console.error('🔥 Error dalam validasi otomatis:', error);
    }
});
