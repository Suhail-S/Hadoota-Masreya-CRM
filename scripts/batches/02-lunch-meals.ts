import { db } from '../../server/db.js';
import { sql } from 'drizzle-orm';

async function importLunchMeals() {
  try {
    console.log('Importing Lunch Meals...\n');

    const categoriesResult = await db.execute(sql`SELECT id, name, parent_id FROM "Hadoota_Masreya_Manager".menu_categories`);
    const categories = categoriesResult.rows;

    const branchesResult = await db.execute(sql`SELECT id, code FROM "Hadoota_Masreya_Manager".branches`);
    const szrBranch = branchesResult.rows.find((b: any) => b.code === 'SZR');
    const ibnBranch = branchesResult.rows.find((b: any) => b.code === 'IBN');

    const getCategoryId = (name: string) => categories.find((c: any) => c.name === name && !c.parent_id)?.id;

    const items = [
      {
        name: 'Hadoota Lunch Tray',
        nameAr: 'صينية حدوتة للغداء',
        description: 'Perfectly portioned for three people. Includes 3 kababs, 3 koftas, 3 tarbs, 3 shish tawooks, 3 quarters of hawawshi, 3 stuffed vine-leaves, 3 stuffed cabbages and 3 mombars and 3 sausages. Served on rice, along with 3 soup, and 3 fresh salad, 3 soft drink & 3 dessert',
        price: 220,
        branches: ['SZR', 'IBN']
      },
      {
        name: 'Lamb Neck Fatta',
        nameAr: 'فتة رقبة ضاني',
        description: 'Cooked lamb neck on a plate of egyptian fatta. Accompanied with your choice of salad, soup, and a soft drink',
        price: 59,
        branches: ['SZR', 'IBN']
      },
      {
        name: 'Molokheya',
        nameAr: 'ملوخية',
        description: 'Molokheya and rice accompanied by perfectly fried chicken or fried meat. Served with rice and your choice of salad, soup, and a soft drink',
        price: 55,
        branches: ['SZR', 'IBN']
      },
      {
        name: 'Grilled Chicken Breasts',
        nameAr: 'صدور دجاج مشوية',
        description: 'Tender and juicy chicken breasts grilled to perfection. Accompanied by rice and your choice of salad, soup, and a soft drink',
        price: 55,
        branches: ['SZR', 'IBN']
      },
      {
        name: 'Grilled Kofta',
        nameAr: 'كفتة مشوية',
        description: 'Juicy kofta, expertly seasoned and grilled, accompanied by rice and your choice of salad, soup, and a soft drink',
        price: 59,
        branches: ['SZR', 'IBN']
      },
      {
        name: 'Shish Tawook',
        nameAr: 'شيش طاووق',
        description: 'Tender and flavorful chicken skewers marinated and grilled to perfection. Accompanied by rice and your choice of salad, soup, and a soft drink',
        price: 49,
        branches: ['SZR', 'IBN']
      },
      {
        name: 'Half Grilled Chicken',
        nameAr: 'نصف دجاجة مشوية',
        description: 'Half of a grilled marinated chicken. Accompanied by rice and your choice of salad, soup, and a soft drink',
        price: 55,
        branches: ['SZR', 'IBN']
      },
      {
        name: 'Hadoota Trio Combo',
        nameAr: 'تريو حدوتة',
        description: 'A trio of delectable sandwiches featuring kofta, tawook, and sausages. Crafted with your choice bread and served alongside a crisp salad, a hearty soup, and your preferred drink',
        price: 40,
        branches: ['IBN']
      },
      {
        name: 'Sandwich Trio',
        nameAr: 'تريو ساندويتش',
        description: 'A trio of delectable sandwiches featuring kofta, tawook, and sausages. Crafted with your choice bread and served alongside a crisp salad, a hearty soup, and your preferred drink',
        price: 40,
        branches: ['SZR']
      },
      {
        name: 'Chicken & Potatoes Tray',
        nameAr: 'صينية دجاج بالبطاطس',
        description: 'Tender chicken and golden potatoes, cooked to perfection and served with rice & your choice of soup, salad and soft drink',
        price: 45,
        branches: ['SZR', 'IBN']
      },
      {
        name: 'Rice Kofta',
        nameAr: 'كفتة أرز',
        description: 'A flavorful blend of ground rice, meat and spices, crafted into rice kofta topped with tomato sauce and served with rice and your choice of soup, salad and soft drink',
        price: 45,
        branches: ['SZR', 'IBN']
      }
    ];

    const categoryId = getCategoryId('Lunch Meals (Mon - Thu)');
    let count = 0;

    for (const item of items) {
      const priceInFils = Math.round(item.price * 100);

      const result = await db.execute(sql`
        INSERT INTO "Hadoota_Masreya_Manager".menu_items (
          name, name_ar, description, description_ar,
          price, category, category_id, base_price,
          item_type, preparation_station, meal_periods,
          is_featured, sort_order, is_active, is_available
        ) VALUES (
          ${item.name}, ${item.nameAr}, ${item.description}, '',
          ${priceInFils}, 'Lunch Meals (Mon - Thu)', ${categoryId}, ${priceInFils},
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
      console.log(`✓ ${count}. ${item.name} - AED ${item.price} [${item.branches.join(', ')}]`);
    }

    console.log(`\n✓ Successfully imported ${count} lunch meal items!`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

importLunchMeals();
