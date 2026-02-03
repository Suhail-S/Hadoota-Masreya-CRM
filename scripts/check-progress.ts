import { db } from '../server/db.js';

async function checkProgress() {
  try {
    const result = await db.execute(`
      SELECT category, COUNT(*) as count
      FROM "Hadoota_Masreya_Manager".menu_items
      GROUP BY category
      ORDER BY category
    `);

    console.log('Items imported by category:');
    console.log('==========================\n');
    for (const row of result.rows) {
      console.log(`  ${(row as any).category}: ${(row as any).count}`);
    }

    const total = await db.execute(`SELECT COUNT(*) FROM "Hadoota_Masreya_Manager".menu_items`);
    console.log(`\n✓ Total: ${(total.rows[0] as any).count} items imported`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

checkProgress();
