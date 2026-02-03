import { db } from '../server/db.js';
import { sql } from 'drizzle-orm';

async function checkActualPrices() {
  try {
    const result = await db.execute(sql`
      SELECT name, price, base_price
      FROM "Hadoota_Masreya_Manager".menu_items
      ORDER BY id
      LIMIT 10
    `);

    console.log('Actual database values:\n');
    result.rows.forEach((row: any) => {
      console.log(`${row.name}:`);
      console.log(`  price = ${row.price}`);
      console.log(`  base_price = ${row.base_price}`);
      console.log(`  typeof price = ${typeof row.price}\n`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

checkActualPrices();
