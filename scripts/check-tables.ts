import { db } from '../server/db.js';

async function checkTables() {
  try {
    const result = await db.execute(`
      SELECT table_name,
             (SELECT COUNT(*) FROM information_schema.columns c
              WHERE c.table_name = t.table_name
              AND c.table_schema = 'Hadoota_Masreya_Manager') as column_count
      FROM information_schema.tables t
      WHERE table_schema = 'Hadoota_Masreya_Manager'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    console.log('Tables in database:');
    console.log('==================\n');
    for (const row of result.rows) {
      console.log(`${(row as any).table_name} (${(row as any).column_count} columns)`);
    }

    // Check current data counts
    const menuItemsCount = await db.execute(`SELECT COUNT(*) FROM "Hadoota_Masreya_Manager".menu_items`);
    console.log(`\nMenu items count: ${(menuItemsCount.rows[0] as any).count}`);

    const categoriesCount = await db.execute(`SELECT COUNT(*) FROM "Hadoota_Masreya_Manager".menu_categories`);
    console.log(`Categories count: ${(categoriesCount.rows[0] as any).count}`);

    const branchesCount = await db.execute(`SELECT COUNT(*) FROM "Hadoota_Masreya_Manager".branches`);
    console.log(`Branches count: ${(branchesCount.rows[0] as any).count}`);

    // Check for any duplicate entries in menu_items
    const duplicates = await db.execute(`
      SELECT name, COUNT(*) as count
      FROM "Hadoota_Masreya_Manager".menu_items
      GROUP BY name
      HAVING COUNT(*) > 1
    `);

    if (duplicates.rows.length > 0) {
      console.log('\n⚠ Duplicate menu items found:');
      for (const row of duplicates.rows) {
        console.log(`  - ${(row as any).name} (${(row as any).count} times)`);
      }
    } else {
      console.log('\n✓ No duplicate menu items');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

checkTables();
