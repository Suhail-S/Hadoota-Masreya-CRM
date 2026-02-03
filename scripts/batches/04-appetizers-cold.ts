import { db } from '../../server/db.js';
import { sql } from 'drizzle-orm';

async function importColdAppetizers() {
  try {
    console.log('Importing Cold Appetizers...\n');

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
      {
        name: 'Hadoota Appetizers Platter',
        nameAr: 'طبق مقبلات حدوتة',
        description: 'A selection of hadoota\'s finest appetizers, featuring tangy pickled lemons, zesty spicy hummus, baba ghanouj, yoghurt with beetroot and feta cheese',
        price: 45,
        branches: ['SZR', 'IBN']
      },
      {
        name: 'Hummus Trio',
        nameAr: 'تريو حمص',
        description: 'A selection of classic hummus, spicy hummus, and avocado hummus',
        price: 30,
        branches: ['SZR', 'IBN']
      },
      {
        name: 'Hummus with Pastrami',
        nameAr: 'حمص بالبسطرمة',
        description: 'Creamy hummus topped with fried pastrami slices',
        price: 35,
        branches: ['SZR', 'IBN']
      },
      {
        name: 'Hummus with Pickled Lemon',
        nameAr: 'حمص بالليمون المخلل',
        description: 'Creamy hummus with pickled lemon',
        price: 35,
        branches: ['SZR', 'IBN']
      },
      {
        name: 'Hummus with Avocado',
        nameAr: 'حمص بالأفوكادو',
        description: 'Creamy hummus with smooth mashed avocado',
        price: 35,
        branches: ['SZR', 'IBN']
      },
      {
        name: 'Spicy Hummus',
        nameAr: 'حمص حار',
        description: 'A spicy variation of the traditional hummus',
        price: 30,
        branches: ['SZR', 'IBN']
      },
      {
        name: 'Hummus',
        nameAr: 'حمص',
        description: 'Cooked & mashed chickpeas, blended with tahini, olive oil, lemon juice, garlic, and various spices',
        price: 30,
        branches: ['SZR', 'IBN']
      },
      {
        name: 'Baba Ghanoug',
        nameAr: 'بابا غنوج',
        description: 'Roasted mashed eggplant mixed with tahini & spices',
        price: 30,
        branches: ['SZR', 'IBN']
      },
      {
        name: 'Yoghurt with Beetroot',
        nameAr: 'زبادي بالشمندر',
        description: 'Fresh yoghurt mixed with beetroot',
        price: 30,
        branches: ['SZR', 'IBN']
      },
      {
        name: 'Feta Cheese with Tomatoes',
        nameAr: 'جبنة فيتا بالطماطم',
        description: 'Feta cheese, tomatoes, mint & olive oil',
        price: 30,
        branches: ['SZR', 'IBN']
      },
      {
        name: 'Besara',
        nameAr: 'بصارة',
        description: 'A mixture of beans and vegetables, cooked, seasoned and mashed',
        price: 30,
        branches: ['SZR', 'IBN']
      },
      {
        name: 'Keshk',
        nameAr: 'كشك',
        description: 'A mix of cooked yogurt & flour, topped with fried onion',
        price: 30,
        branches: ['SZR', 'IBN']
      },
      {
        name: 'Tomato Slices with Feta Cheese',
        nameAr: 'شرائح طماطم بالفيتا',
        description: 'Freshly sliced tomatoes layered with crumbled feta cheese and with a drizzle of olive oil',
        price: 22,
        branches: ['SZR', 'IBN']
      },
      {
        name: 'Tomato & Eggplant with Garlic & Vinegar',
        nameAr: 'طماطم وباذنجان بالثوم والخل',
        description: 'Eggplant & tomato slices, topped with garlic and vinegar dressing',
        price: 28,
        branches: ['SZR', 'IBN']
      },
      {
        name: 'Eggplant with Garlic & Vinegar',
        nameAr: 'باذنجان بالثوم والخل',
        description: 'Fried eggplant slices, topped with garlic and vinegar dressing',
        price: 28,
        branches: ['SZR', 'IBN']
      },
      {
        name: 'Tomato with Garlic & Vinegar',
        nameAr: 'طماطم بالثوم والخل',
        description: 'Tomato slices, topped with garlic and vinegar dressing',
        price: 28,
        branches: ['SZR', 'IBN']
      },
      {
        name: 'Eggplant Fatta',
        nameAr: 'فتة باذنجان',
        description: 'Contains fried eggplant pieces, yogurt, tahini, roasted almonds',
        price: 38,
        branches: ['SZR', 'IBN']
      },
      {
        name: 'Tahini',
        nameAr: 'طحينة',
        description: 'Lemon & cumin seasoned ground sesame seeds paste',
        price: 28,
        branches: ['SZR', 'IBN']
      },
      {
        name: 'Yoghurt with Cucumbers',
        nameAr: 'زبادي بالخيار',
        description: 'Yoghurt, cucumber, mint and garlic',
        price: 20,
        branches: ['SZR', 'IBN']
      },
      {
        name: 'Tomeya',
        nameAr: 'ثومية',
        description: 'Garlic paste',
        price: 25,
        branches: ['SZR', 'IBN']
      },
      {
        name: 'Pickled Lemon Paste',
        nameAr: 'معجون ليمون مخلل',
        description: 'Pickled lemon paste',
        price: 25,
        branches: ['SZR', 'IBN']
      },
      {
        name: 'Mesh Cheese',
        nameAr: 'جبنة مش',
        description: 'Aged traditional salty cheese',
        price: 28,
        branches: ['SZR', 'IBN']
      },
      {
        name: 'Pickled Lemon Whole',
        nameAr: 'ليمون مخلل كامل',
        description: 'Whole pickled lemon',
        price: 15,
        branches: ['SZR', 'IBN']
      },
      {
        name: 'Mixed Pickles',
        nameAr: 'مخلل مشكل',
        description: 'Assorted pickles',
        price: 10,
        branches: ['SZR', 'IBN']
      }
    ];

    const categoryId = getCategoryId('Cold Appetizers');
    let count = 0;

    for (const item of items) {
      if (!categoryId) {
        console.warn('⚠ Cold Appetizers category not found');
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
          ${priceInFils}, 'Cold Appetizers', ${categoryId}, ${priceInFils},
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

    console.log(`\n✓ Successfully imported ${count} cold appetizers!`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

importColdAppetizers();
