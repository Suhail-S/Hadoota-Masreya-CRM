import { db } from '../../server/db.js';
import { sql } from 'drizzle-orm';

async function importShisha() {
  try {
    console.log('Importing Shisha items...\n');

    const categoriesResult = await db.execute(sql`SELECT id, name, parent_id FROM "Hadoota_Masreya_Manager".menu_categories`);
    const categories = categoriesResult.rows;

    const branchesResult = await db.execute(sql`SELECT id, code FROM "Hadoota_Masreya_Manager".branches`);
    const szrBranch = branchesResult.rows.find((b: any) => b.code === 'SZR');
    const ibnBranch = branchesResult.rows.find((b: any) => b.code === 'IBN');

    const getCategoryId = () => categories.find((c: any) => c.name === 'Shisha' && !c.parent_id)?.id;

    const items = [
      {
        name: 'Classic Shisha',
        nameAr: 'شيشة كلاسيك',
        description: 'Enjoy our classic shisha experience by selecting from a wide variety of rich and exotic flavors. Change head - 40 AED',
        price: 75,
        branches: ['SZR', 'IBN']
      },
      {
        name: 'Special Shisha',
        nameAr: 'شيشة سبيشال',
        description: 'Special hadoota glass shisha select your favorite flavor served in our special shisha and enjoy a longer-lasting session. Change head - 50 AED',
        price: 95,
        branches: ['SZR', 'IBN']
      }
    ];

    const categoryId = getCategoryId();
    let count = 0;

    for (const item of items) {
      if (!categoryId) {
        console.warn('⚠ Shisha category not found');
        break;
      }

      const priceInFils = Math.round(item.price * 100);

      const result = await db.execute(sql`
        INSERT INTO "Hadoota_Masreya_Manager".menu_items (
          name, name_ar, description, description_ar,
          price, category, category_id, base_price,
          item_type, preparation_station, meal_periods,
          is_featured, sort_order, is_active, is_available
        ) VALUES (
          ${item.name}, ${item.nameAr}, ${item.description}, '',
          ${priceInFils}, 'Shisha', ${categoryId}, ${priceInFils},
          'main', 'shisha', 'all_day',
          false, 0, true, true
        )
        RETURNING id
      `);

      const itemId = (result.rows[0] as any).id;

      for (const branchCode of item.branches) {
        const branch = branchCode === 'SZR' ? szrBranch : ibnBranch;
        await db.execute(sql`
          INSERT INTO "Hadoota_Masreya_Manager".menu_item_branches (
            menu_item_id, branch_id, is_available
          ) VALUES (${itemId}, ${branch.id}, true)
        `);
      }

      count++;
      console.log(`✓ ${count}. ${item.name} - AED ${item.price}`);
    }

    console.log(`\n✓ Successfully imported ${count} shisha items!`);
    console.log('\n🎉 ALL MENU IMPORTS COMPLETE!');
    console.log('Run: npx tsx --env-file=.env scripts/check-progress.ts to see final counts');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

importShisha();
