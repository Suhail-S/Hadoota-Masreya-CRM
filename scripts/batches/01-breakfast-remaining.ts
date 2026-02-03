import { db } from '../../server/db.js';
import { sql } from 'drizzle-orm';

// This script imports remaining breakfast items (we already have 5)

async function importBreakfastItems() {
  try {
    console.log('Importing remaining Breakfast items...\n');

    const categoriesResult = await db.execute(sql`
      SELECT id, name, parent_id FROM "Hadoota_Masreya_Manager".menu_categories
    `);
    const categories = categoriesResult.rows;

    const branchesResult = await db.execute(sql`
      SELECT id, code FROM "Hadoota_Masreya_Manager".branches
    `);
    const szrBranch = branchesResult.rows.find((b: any) => b.code === 'SZR');
    const ibnBranch = branchesResult.rows.find((b: any) => b.code === 'IBN');

    const getCategoryId = (name: string, parentName?: string) => {
      if (parentName) {
        const parent = categories.find((c: any) => c.name === parentName && !c.parent_id);
        const sub = categories.find((c: any) => c.name === name && c.parent_id === parent?.id);
        return sub?.id;
      }
      return categories.find((c: any) => c.name === name && !c.parent_id)?.id;
    };

    const items = [
      // Foul, Falafel & Egg Dishes (continuing from test)
      {
        name: 'Foul with Eggs',
        nameAr: 'فول بالبيض',
        description: 'A classic Egyptian protein-packed delight that combines fava beans (foul) with eggs',
        price: 28,
        category: 'Breakfast',
        subcategory: 'Foul, Falafel & Egg Dishes',
        branches: ['SZR', 'IBN']
      },
      {
        name: 'Foul with Ghee',
        nameAr: 'فول بالسمن',
        description: 'Fava beans with local ghee and spices',
        price: 23,
        category: 'Breakfast',
        subcategory: 'Foul, Falafel & Egg Dishes',
        branches: ['SZR', 'IBN']
      },
      {
        name: 'Foul with Olive Oil',
        nameAr: 'فول بزيت الزيتون',
        description: 'Fava beans with olive oil and spices',
        price: 23,
        category: 'Breakfast',
        subcategory: 'Foul, Falafel & Egg Dishes',
        branches: ['SZR', 'IBN']
      },
      {
        name: 'Egyptian Falafel',
        nameAr: 'طعمية مصرية',
        description: 'Egyptian falafel is traditionally crafted from fava beans, mixed with aromatic herbs and spices such as parsley, cilantro, garlic, and cumin. Served with tahini, pickles and egyptian bread',
        price: 12,
        category: 'Breakfast',
        subcategory: 'Foul, Falafel & Egg Dishes',
        branches: ['SZR', 'IBN']
      },
      {
        name: 'Alexandrian Falafel',
        nameAr: 'طعمية إسكندراني',
        description: 'Spicy falafel/tameya stuffed with chili paste, sesame and coriander served with tahini, pickles and egyptian bread',
        price: 22,
        category: 'Breakfast',
        subcategory: 'Foul, Falafel & Egg Dishes',
        branches: ['SZR', 'IBN']
      },
      {
        name: 'Falafel Fingers',
        nameAr: 'أصابع الطعمية',
        description: 'Egyptian falafel fingers are crispy on the outside, soft on the inside, and bursting with flavor. Made from ground fava beans, herbs, and spices',
        price: 22,
        category: 'Breakfast',
        subcategory: 'Foul, Falafel & Egg Dishes',
        branches: ['SZR', 'IBN']
      },
      {
        name: 'Falafel Pops',
        nameAr: 'كرات الطعمية',
        description: 'Plain falafel balls with sesame and dried coriander served with: tahini, pickles and egyptian bread',
        price: 20,
        category: 'Breakfast',
        subcategory: 'Foul, Falafel & Egg Dishes',
        branches: ['SZR', 'IBN']
      },
      {
        name: 'Eggs Your Style',
        nameAr: 'بيض على كيفك',
        description: 'Your choice of 2 eggs cooked your way',
        price: 25,
        category: 'Breakfast',
        subcategory: 'Foul, Falafel & Egg Dishes',
        branches: ['SZR', 'IBN']
      }
    ];

    let count = 0;
    for (const item of items) {
      const categoryId = item.subcategory
        ? getCategoryId(item.subcategory, item.category)
        : getCategoryId(item.category);

      if (!categoryId) {
        console.warn(`⚠ Category not found: ${item.category} > ${item.subcategory}`);
        continue;
      }

      const priceInFils = Math.round(item.price * 100);
      const categoryName = item.subcategory || item.category;

      const result = await db.execute(sql`
        INSERT INTO "Hadoota_Masreya_Manager".menu_items (
          name, name_ar, description, description_ar,
          price, category, category_id, base_price,
          item_type, preparation_station, meal_periods,
          is_featured, sort_order, is_active, is_available
        ) VALUES (
          ${item.name}, ${item.nameAr}, ${item.description}, '',
          ${priceInFils}, ${categoryName}, ${categoryId}, ${priceInFils},
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
      console.log(`✓ ${count}. ${item.name} - AED ${item.price}`);
    }

    console.log(`\n✓ Successfully imported ${count} breakfast items!`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

importBreakfastItems();
