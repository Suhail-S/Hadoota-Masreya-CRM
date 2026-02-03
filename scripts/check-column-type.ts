import { db } from '../server/db.js';
import { sql } from 'drizzle-orm';

async function checkColumnType() {
  try {
    // Check the actual column data type in PostgreSQL
    const result = await db.execute(sql`
      SELECT column_name, data_type, numeric_precision, numeric_scale
      FROM information_schema.columns
      WHERE table_schema = 'Hadoota_Masreya_Manager'
        AND table_name = 'menu_items'
        AND column_name IN ('price', 'base_price')
    `);

    console.log('Column types in database:\n');
    result.rows.forEach((row: any) => {
      console.log(row);
    });

    // Also check actual values with explicit casting
    const values = await db.execute(sql`
      SELECT
        name,
        price,
        base_price,
        price::text as price_text,
        base_price::text as base_price_text
      FROM "Hadoota_Masreya_Manager".menu_items
      LIMIT 5
    `);

    console.log('\nActual values:\n');
    values.rows.forEach((row: any) => {
      console.log(`${row.name}:`);
      console.log(`  price: ${row.price} (as text: "${row.price_text}")`);
      console.log(`  base_price: ${row.base_price} (as text: "${row.base_price_text}")\n`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

checkColumnType();
