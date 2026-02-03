import { db } from '../../server/db.js';
import { sql } from 'drizzle-orm';

async function importFeteer() {
  try {
    console.log('Importing Feteer items...\n');

    const categoriesResult = await db.execute(sql`SELECT id, name, parent_id FROM "Hadoota_Masreya_Manager".menu_categories`);
    const categories = categoriesResult.rows;

    const branchesResult = await db.execute(sql`SELECT id, code FROM "Hadoota_Masreya_Manager".branches`);
    const szrBranch = branchesResult.rows.find((b: any) => b.code === 'SZR');
    const ibnBranch = branchesResult.rows.find((b: any) => b.code === 'IBN');

    const getCategoryId = (subcategory: string) => {
      const parent = categories.find((c: any) => c.name === 'Feteer' && !c.parent_id);
      return categories.find((c: any) => c.name === subcategory && c.parent_id === parent?.id)?.id;
    };

    const items = [
      // SAVORY FETEER
      {
        name: 'Feteer with Vegetables',
        nameAr: 'فطير بالخضروات',
        description: 'Savory feteer filled with fresh vegetables',
        price: 30,
        subcategory: 'Savory Feteer',
        branches: ['SZR']
      },
      {
        name: 'Feteer with Vegetables',
        nameAr: 'فطير بالخضروات',
        description: 'Savory feteer filled with fresh vegetables',
        price: 50,
        subcategory: 'Savory Feteer',
        branches: ['IBN']
      },
      {
        name: 'Feteer with Cheese',
        nameAr: 'فطير بالجبن',
        description: 'Savory feteer filled with cheese',
        price: 30,
        subcategory: 'Savory Feteer',
        branches: ['SZR', 'IBN']
      },
      {
        name: 'Feteer with Meat or Chicken',
        nameAr: 'فطير باللحم أو الدجاج',
        description: 'Savory feteer filled with your choice of meat or chicken',
        price: 40,
        subcategory: 'Savory Feteer',
        branches: ['SZR']
      },
      {
        name: 'Feteer with Meat',
        nameAr: 'فطير باللحم',
        description: 'Savory feteer filled with seasoned meat',
        price: 70,
        subcategory: 'Savory Feteer',
        branches: ['IBN']
      },

      // SWEET FETEER
      {
        name: 'Classic Sweet Feteer',
        nameAr: 'فطير حلو كلاسيكي',
        description: 'Classic sweet feteer',
        price: 28,
        subcategory: 'Sweet Feteer',
        branches: ['SZR']
      },
      {
        name: 'Classic Sweet Feteer',
        nameAr: 'فطير حلو كلاسيكي',
        description: 'Classic sweet feteer',
        price: 45,
        subcategory: 'Sweet Feteer',
        branches: ['IBN']
      },
      {
        name: 'Feteer with Spread',
        nameAr: 'فطير بالدهان',
        description: 'Sweet feteer with your choice of spread',
        price: 35,
        subcategory: 'Sweet Feteer',
        branches: ['SZR']
      },
      {
        name: 'Feteer with Spread',
        nameAr: 'فطير بالدهان',
        description: 'Sweet feteer with your choice of spread',
        price: 70,
        subcategory: 'Sweet Feteer',
        branches: ['IBN']
      },
      {
        name: 'Feteer with Nuts',
        nameAr: 'فطير بالمكسرات',
        description: 'Sweet feteer filled with nuts',
        price: 40,
        subcategory: 'Sweet Feteer',
        branches: ['SZR']
      },
      {
        name: 'Feteer with Nuts',
        nameAr: 'فطير بالمكسرات',
        description: 'Sweet feteer filled with nuts',
        price: 60,
        subcategory: 'Sweet Feteer',
        branches: ['IBN']
      },
      {
        name: 'Dubai Feteer',
        nameAr: 'فطير دبي',
        description: 'Our luxurious feteer, a flaky, buttery pastry layered with sweet konafa, drizzled with rich pistachio sauce, and covered in a velvety chocolate glaze',
        price: 90,
        subcategory: 'Sweet Feteer',
        branches: ['SZR', 'IBN']
      },

      // FETEER MESHALTET
      {
        name: 'Feteer Meshaltet',
        nameAr: 'فطير مشلتت',
        description: 'A beloved traditional egyptian layered pastry known for its flaky and airy texture. Served with your choice of 6 delicious dips',
        price: 88,
        subcategory: 'Feteer Meshaltet',
        branches: ['SZR', 'IBN']
      },
      {
        name: 'Meshaltet Small',
        nameAr: 'مشلتت صغير',
        description: 'A beloved traditional egyptian layered pastry known for its flaky and airy texture. Served with your choice of 3 delicious dips',
        price: 55,
        subcategory: 'Feteer Meshaltet',
        branches: ['SZR', 'IBN']
      }
    ];

    let count = 0;

    for (const item of items) {
      const categoryId = getCategoryId(item.subcategory);
      if (!categoryId) {
        console.warn(`⚠ Category not found: ${item.subcategory}`);
        continue;
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
          ${priceInFils}, ${item.subcategory}, ${categoryId}, ${priceInFils},
          'main', 'kitchen', 'all_day',
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
      console.log(`✓ ${count}. ${item.name} - AED ${item.price} [${item.subcategory}] [${item.branches.join(', ')}]`);
    }

    console.log(`\n✓ Successfully imported ${count} feteer items!`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

importFeteer();
