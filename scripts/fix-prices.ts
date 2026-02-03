import { db } from '../server/db.js';
import { sql } from 'drizzle-orm';

async function fixPrices() {
  try {
    console.log('Updating all prices (dividing by 100)...\n');

    // Update both price and base_price columns
    const result = await db.execute(sql`
      UPDATE "Hadoota_Masreya_Manager".menu_items
      SET
        price = price / 100,
        base_price = base_price / 100
      WHERE price > 100
    `);

    console.log('✓ Prices updated successfully!');

    // Show sample of updated prices
    const check = await db.execute(sql`
      SELECT name, price, base_price
      FROM "Hadoota_Masreya_Manager".menu_items
      ORDER BY id
      LIMIT 10
    `);

    console.log('\nSample updated prices:\n');
    check.rows.forEach((row: any) => {
      console.log(`- ${row.name}: ${row.price} AED`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

fixPrices();
