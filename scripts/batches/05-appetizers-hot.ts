import { db } from '../../server/db.js';
import { sql } from 'drizzle-orm';

async function importHotAppetizers() {
  try {
    console.log('Importing Hot Appetizers & Light Snacks...\n');

    const categoriesResult = await db.execute(sql`SELECT id, name, parent_id FROM "Hadoota_Masreya_Manager".menu_categories`);
    const categories = categoriesResult.rows;

    const branchesResult = await db.execute(sql`SELECT id, code FROM "Hadoota_Masreya_Manager".branches`);
    const szrBranch = branchesResult.rows.find((b: any) => b.code === 'SZR');
    const ibnBranch = branchesResult.rows.find((b: any) => b.code === 'IBN');

    const getCategoryId = (subcategory: string) => {
      const parent = categories.find((c: any) => c.name === 'Appetizers' && !c.parent_id);
      return categories.find((c: any) => c.name === subcategory && c.parent_id === parent?.id)?.id;
    };

    const items = [
      // HOT APPETIZERS
      {
        name: 'Samboosa Meat or Mixed Cheese',
        nameAr: 'سمبوسة لحم أو جبن',
        description: 'Crispy on the outside with delicious fillings: seasoned minced meat or rich cheese mix',
        price: 35,
        subcategory: 'Hot Appetizers',
        branches: ['SZR', 'IBN']
      },
      {
        name: 'Cheese Pastrami Rolls',
        nameAr: 'رولات جبن وبسطرمة',
        description: 'Crispy on the outside with delicious filling of cheese & pastrami',
        price: 28,
        subcategory: 'Hot Appetizers',
        branches: ['SZR', 'IBN']
      },
      {
        name: 'Roqaq W Minced Meat',
        nameAr: 'رقاق باللحم المفروم',
        description: 'Layers of delicate pastry dough & minced meat',
        price: 55,
        subcategory: 'Hot Appetizers',
        branches: ['SZR', 'IBN']
      },
      {
        name: 'Small Hawawshi',
        nameAr: 'حواوشي صغير',
        description: 'One loaf served with your choice of 1 side order',
        price: 35,
        subcategory: 'Hot Appetizers',
        branches: ['SZR', 'IBN']
      },
      {
        name: 'Alexandrian Sausages',
        nameAr: 'سجق إسكندراني',
        description: 'With spices on the alexandrian way',
        price: 43,
        subcategory: 'Hot Appetizers',
        branches: ['SZR', 'IBN']
      },
      {
        name: 'Hadoota Sausages',
        nameAr: 'سجق حدوتة',
        description: 'Sizzling sausages with tomato slices, peppers and tomato sauce',
        price: 43,
        subcategory: 'Hot Appetizers',
        branches: ['SZR', 'IBN']
      },
      {
        name: 'Alexandrian Liver (Beef)',
        nameAr: 'كبدة إسكندراني',
        description: 'Beef liver with green pepper and garlic',
        price: 35,
        subcategory: 'Hot Appetizers',
        branches: ['SZR', 'IBN']
      },
      {
        name: 'Chicken Liver',
        nameAr: 'كبدة فراخ',
        description: 'Egyptian spiced chicken liver. Pomegranate molasses can be added to your preference',
        price: 30,
        subcategory: 'Hot Appetizers',
        branches: ['SZR', 'IBN']
      },
      {
        name: 'Spicy Potatoes',
        nameAr: 'بطاطس حارة',
        description: 'Spicy coriander & garlic potatoes served with spicy sauce',
        price: 25,
        subcategory: 'Hot Appetizers',
        branches: ['SZR', 'IBN']
      },
      {
        name: 'Fried Sweet Potatoes',
        nameAr: 'بطاطا حلوة مقلية',
        description: 'Strips of sweet potatoes deep-fried until crispy and golden',
        price: 20,
        subcategory: 'Hot Appetizers',
        branches: ['SZR', 'IBN']
      },

      // LIGHT SNACKS (IBN only)
      {
        name: 'Termes',
        nameAr: 'ترمس',
        description: 'Traditional Egyptian lupini beans',
        price: 15,
        subcategory: 'Light Snacks',
        branches: ['IBN']
      },
      {
        name: 'Halabesa',
        nameAr: 'حلبسة',
        description: 'Traditional Egyptian chickpea snack',
        price: 20,
        subcategory: 'Light Snacks',
        branches: ['IBN']
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

    console.log(`\n✓ Successfully imported ${count} items!`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

importHotAppetizers();
