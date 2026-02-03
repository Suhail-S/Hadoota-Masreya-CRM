import { db } from '../server/db.js';

async function checkSchema() {
  try {
    const result = await db.execute(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'Hadoota_Masreya_Manager'
      AND table_name = 'menu_items'
      ORDER BY ordinal_position;
    `);

    console.log('menu_items table columns:\n');
    for (const row of result.rows) {
      console.log(`${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

checkSchema();
