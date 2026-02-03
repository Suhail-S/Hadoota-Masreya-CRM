import { db } from '../server/db.js';
import { sql } from 'drizzle-orm';

interface MenuItem {
  name: string;
  nameAr: string;
  description: string;
  price: number; // in AED
  category: string;
  subcategory?: string;
  branches: string[]; // branch codes: 'SZR', 'IBN'
  preparationStation?: 'kitchen' | 'bar' | 'cafe' | 'shisha';
}

async function importMenuItems() {
  try {
    console.log('Starting menu import with SQL...\n');

    // Get branch IDs
    const branchesResult = await db.execute(sql`
      SELECT id, code FROM "Hadoota_Masreya_Manager".branches
    `);
    const szrBranch = branchesResult.rows.find((b: any) => b.code === 'SZR');
    const ibnBranch = branchesResult.rows.find((b: any) => b.code === 'IBN');

    if (!szrBranch || !ibnBranch) {
      console.error('Branches not found. Please ensure SZR and IBN branches exist.');
      process.exit(1);
    }

    console.log(`✓ Found branches: SZR (${szrBranch.id}), IBN (${ibnBranch.id})\n`);

    // Get all categories
    const categoriesResult = await db.execute(sql`
      SELECT id, name, parent_id FROM "Hadoota_Masreya_Manager".menu_categories
    `);
    const categories = categoriesResult.rows;

    const getCategoryId = (name: string, parentName?: string) => {
      if (parentName) {
        const parent = categories.find((c: any) => c.name === parentName && !c.parent_id);
        const sub = categories.find((c: any) => c.name === name && c.parent_id === parent?.id);
        return sub?.id;
      }
      return categories.find((c: any) => c.name === name && !c.parent_id)?.id;
    };

    // Menu items data (Part 1)
    const menuItemsData: MenuItem[] = [
      // BREAKFAST
      {
        name: 'Hadoota Breakfast',
        nameAr: 'فطور حدوتة',
        description: 'Fava beans, falafel sticks, white cheese with tomatoes or mesh cheese according to your desire, roomi cheese, halawa, fried eggplant, fresh vegetables and pickles. Served with your choice of drink',
        price: 45,
        category: 'Breakfast',
        subcategory: 'Breakfast Trays',
        branches: ['SZR', 'IBN'],
        preparationStation: 'kitchen'
      },
      {
        name: 'Family Breakfast',
        nameAr: 'فطور العائلة',
        description: 'Fava beans - falafel - feta cheese - french fries - fried eggplant - mesh cheese - besara - dukka - olive oil - pickles - pickled tomatoes - luncheon - roomy cheese - fresh sliced vegetables - butter and jam - watermelon - halawa. Served with your choice of egg and breakfast drink',
        price: 99,
        category: 'Breakfast',
        subcategory: 'Breakfast Trays',
        branches: ['SZR', 'IBN'],
        preparationStation: 'kitchen'
      },
      {
        name: 'Baladi Breakfast',
        nameAr: 'فطور بلدي',
        description: 'Feteer meshaltet - fava beans - falafel - feta cheese - mesh cheese - pickles - fresh sliced vegetables. Served with your choice of egg and breakfast drink',
        price: 70,
        category: 'Breakfast',
        subcategory: 'Breakfast Trays',
        branches: ['SZR', 'IBN'],
        preparationStation: 'kitchen'
      },
      {
        name: 'Foul with Sausages',
        nameAr: 'فول بالسجق',
        description: 'Fava beans with sausages, a hearty and flavorful dish that combines tender fava beans with savory sausages',
        price: 33,
        category: 'Breakfast',
        subcategory: 'Foul, Falafel & Egg Dishes',
        branches: ['SZR', 'IBN'],
        preparationStation: 'kitchen'
      },
      {
        name: 'Foul Hadoota',
        nameAr: 'فول حدوتة',
        description: 'Mashed fava beans with parsley, white onions, tomatoes and tahini',
        price: 28,
        category: 'Breakfast',
        subcategory: 'Foul, Falafel & Egg Dishes',
        branches: ['SZR', 'IBN'],
        preparationStation: 'kitchen'
      },
    ];

    console.log('Inserting menu items using raw SQL...\n');

    let insertedCount = 0;

    for (const item of menuItemsData) {
      const categoryId = item.subcategory
        ? getCategoryId(item.subcategory, item.category)
        : getCategoryId(item.category);

      if (!categoryId) {
        console.warn(`⚠ Category not found for: ${item.name} (${item.category}${item.subcategory ? ` > ${item.subcategory}` : ''})`);
        continue;
      }

      const priceInFils = Math.round(item.price * 100);
      const categoryName = item.subcategory || item.category;

      // Insert menu item using raw SQL to handle both old and new schema
      const result = await db.execute(sql`
        INSERT INTO "Hadoota_Masreya_Manager".menu_items (
          name, name_ar, description, description_ar,
          price, category, category_id, base_price,
          item_type, preparation_station, meal_periods,
          is_featured, sort_order, is_active, is_available
        ) VALUES (
          ${item.name}, ${item.nameAr}, ${item.description}, '',
          ${priceInFils}, ${categoryName}, ${categoryId}, ${priceInFils},
          'main', ${item.preparationStation || 'kitchen'}, 'all_day',
          false, 0, true, true
        )
        RETURNING id
      `);

      const itemId = (result.rows[0] as any).id;

      // Set up branch availability
      for (const branchCode of item.branches) {
        const branch = branchCode === 'SZR' ? szrBranch : ibnBranch;
        await db.execute(sql`
          INSERT INTO "Hadoota_Masreya_Manager".menu_item_branches (
            menu_item_id, branch_id, is_available
          ) VALUES (
            ${itemId}, ${branch.id}, true
          )
        `);
      }

      insertedCount++;
      console.log(`✓ ${insertedCount}. ${item.name} - AED ${item.price}`);
    }

    console.log(`\n✓ Successfully inserted ${insertedCount} test items.\n`);
    console.log('This was a test with 5 items. Ready to import full menu.');

  } catch (error) {
    console.error('Error importing menu items:', error);
  } finally {
    process.exit(0);
  }
}

importMenuItems();
