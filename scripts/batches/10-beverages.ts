import { db } from '../../server/db.js';
import { sql } from 'drizzle-orm';

async function importBeverages() {
  try {
    console.log('Importing Beverages...\n');

    const categoriesResult = await db.execute(sql`SELECT id, name, parent_id FROM "Hadoota_Masreya_Manager".menu_categories`);
    const categories = categoriesResult.rows;

    const branchesResult = await db.execute(sql`SELECT id, code FROM "Hadoota_Masreya_Manager".branches`);
    const szrBranch = branchesResult.rows.find((b: any) => b.code === 'SZR');
    const ibnBranch = branchesResult.rows.find((b: any) => b.code === 'IBN');

    const getCategoryId = (subcategory: string) => {
      const parent = categories.find((c: any) => c.name === 'Beverages' && !c.parent_id);
      return categories.find((c: any) => c.name === subcategory && c.parent_id === parent?.id)?.id;
    };

    const items = [
      // HOT DRINKS
      {name: 'Tea', nameAr: 'شاي', description: 'Commonly enjoyed with or without milk and sugar', price: 14, subcategory: 'Hot Drinks', branches: ['SZR', 'IBN']},
      {name: 'Herbal Drinks', nameAr: 'مشروبات عشبية', description: 'Selection of herbal teas', price: 14, subcategory: 'Hot Drinks', branches: ['SZR', 'IBN']},
      {name: 'Hot Hibiscus', nameAr: 'كركديه ساخن', description: 'A flavorful and refreshing beverage made from dried hibiscus flowers steeped in hot water', price: 18, subcategory: 'Hot Drinks', branches: ['SZR', 'IBN']},
      {name: 'Cinnamon With Milk', nameAr: 'قرفة بالحليب', description: 'A comforting and aromatic beverage made by infusing cinnamon sticks or ground cinnamon with warm milk', price: 18, subcategory: 'Hot Drinks', branches: ['SZR', 'IBN']},
      {name: 'Moroccan Tea', nameAr: 'شاي مغربي', description: 'Traditional Moroccan mint tea', price: 25, subcategory: 'Hot Drinks', branches: ['SZR', 'IBN']},
      {name: 'Hot Chocolate', nameAr: 'شوكولاتة ساخنة', description: 'A rich and indulgent beverage made by combining cocoa powder or chocolate with milk or cream', price: 20, subcategory: 'Hot Drinks', branches: ['SZR', 'IBN']},
      {name: 'Coffee', nameAr: 'قهوة', description: 'Freshly brewed coffee', price: 21, subcategory: 'Hot Drinks', branches: ['SZR', 'IBN']},
      {name: 'Sahlab', nameAr: 'سحلب', description: 'A traditional middle eastern beverage, often served hot and garnished with ground cinnamon or chopped nuts', price: 25, subcategory: 'Hot Drinks', branches: ['SZR', 'IBN']},
      {name: 'Hadoota Tea', nameAr: 'شاي حدوتة', description: 'Special Hadoota blend tea', price: 30, subcategory: 'Hot Drinks', branches: ['SZR', 'IBN']},

      // COLD DRINKS
      {name: 'Sky Blue', nameAr: 'سكاي بلو', description: 'Pineapple, coconut milk, lemon juice, vanilla, blue orange', price: 25, subcategory: 'Cold Drinks', branches: ['SZR', 'IBN']},
      {name: 'Ice tea Raspberry', nameAr: 'آيس تي توت', description: 'Iced tea with raspberry', price: 25, subcategory: 'Cold Drinks', branches: ['SZR', 'IBN']},
      {name: 'Ice tea Peach', nameAr: 'آيس تي خوخ', description: 'Iced tea with peach', price: 25, subcategory: 'Cold Drinks', branches: ['SZR', 'IBN']},
      {name: 'Iced Coffee', nameAr: 'قهوة مثلجة', description: 'Cold coffee beverage', price: 27, subcategory: 'Cold Drinks', branches: ['SZR', 'IBN']},
      {name: 'Ice tea Passion', nameAr: 'آيس تي باشن فروت', description: 'Iced tea with passion fruit', price: 30, subcategory: 'Cold Drinks', branches: ['SZR', 'IBN']},
      {name: 'Summer Cooler', nameAr: 'مبرد صيفي', description: 'Extracted from oranges, pineapples, cranberries, and coconut', price: 32, subcategory: 'Cold Drinks', branches: ['SZR', 'IBN']},
      {name: 'Frosty Berry', nameAr: 'توت مثلج', description: 'Berry frozen drink', price: 30, subcategory: 'Cold Drinks', branches: ['SZR', 'IBN']},
      {name: 'Apple Mint Margerita', nameAr: 'مارجريتا تفاح ونعناع', description: 'Green apple, mint, lemon juice with cucumber, salt, sparkling water', price: 30, subcategory: 'Cold Drinks', branches: ['SZR', 'IBN']},
      {name: 'Egyptian Drinks', nameAr: 'مشروبات مصرية', description: 'Traditional Egyptian beverages', price: 30, subcategory: 'Cold Drinks', branches: ['SZR', 'IBN']},
      {name: 'Smoothie', nameAr: 'سموذي', description: 'Fresh fruit smoothie', price: 32, subcategory: 'Cold Drinks', branches: ['SZR', 'IBN']},
      {name: 'Ginger Soda', nameAr: 'صودا زنجبيل', description: 'Pomegranate, ginger, lemon', price: 35, subcategory: 'Cold Drinks', branches: ['SZR', 'IBN']},
      {name: 'Cocktail & Mocktail', nameAr: 'كوكتيل وموكتيل', description: 'Fresh fruit cocktails', price: 38, subcategory: 'Cold Drinks', branches: ['SZR', 'IBN']},
      {name: 'Fresh Juice', nameAr: 'عصير طازج', description: 'Freshly squeezed juice', price: 35, subcategory: 'Cold Drinks', branches: ['SZR', 'IBN']},
      {name: 'Cane Passion', nameAr: 'قصب باشن', description: 'Refreshing blend combines the sweetness of berries and sugar cane with the exotic tang of passion fruit and the zest of orange', price: 38, subcategory: 'Cold Drinks', branches: ['SZR', 'IBN']},
      {name: 'Pineapple passion', nameAr: 'أناناس باشن', description: 'Fresh green apple - pineapple - passion fruit', price: 38, subcategory: 'Cold Drinks', branches: ['SZR', 'IBN']},
      {name: 'Mojito', nameAr: 'موهيتو', description: 'Classic mojito drink', price: 38, subcategory: 'Cold Drinks', branches: ['SZR', 'IBN']},
      {name: 'Berry Shake', nameAr: 'شيك توت', description: 'A refreshing blend of fresh berries & strawberries, perfectly combined with creamy strawberry ice cream, milk, and a touch of sweet sugar syrup', price: 38, subcategory: 'Cold Drinks', branches: ['SZR', 'IBN']},
      {name: 'Jelly Rose', nameAr: 'جيلي روز', description: 'Blend of crisp apple, vibrant berries, and tangy pineapple juice, accented with fragrant rose syrup, zesty dry lemon, and a splash of lemon syrup', price: 38, subcategory: 'Cold Drinks', branches: ['SZR', 'IBN']},
      {name: 'Passion Fusion', nameAr: 'باشن فيوجن', description: 'A vibrant mix of crisp apples, berries, refreshing pineapple juice, and exotic passion fruit', price: 38, subcategory: 'Cold Drinks', branches: ['SZR', 'IBN']},
      {name: 'Hadoota Cocktail', nameAr: 'كوكتيل حدوتة', description: 'A blend of ripe mango, strawberry, banana, and zesty kiwi', price: 38, subcategory: 'Cold Drinks', branches: ['SZR', 'IBN']},

      // SOFT DRINKS & WATER
      {name: 'Water', nameAr: 'مياه', description: 'Bottled water', price: 12, subcategory: 'Soft Drinks & Water', branches: ['SZR', 'IBN']},
      {name: 'Schweppes', nameAr: 'شويبس', description: 'Schweppes soft drink', price: 15, subcategory: 'Soft Drinks & Water', branches: ['SZR', 'IBN']},
      {name: 'Alokozay', nameAr: 'الوكازي', description: 'Alokozay drink', price: 15, subcategory: 'Soft Drinks & Water', branches: ['SZR', 'IBN']},
      {name: 'Pepsi', nameAr: 'بيبسي', description: 'Pepsi cola', price: 15, subcategory: 'Soft Drinks & Water', branches: ['SZR', 'IBN']}
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
          'main', ${item.subcategory === 'Hot Drinks' ? 'cafe' : 'bar'}, 'all_day',
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
      if (count % 10 === 0) console.log(`  ... ${count} items imported`);
    }

    console.log(`\n✓ Successfully imported ${count} beverage items!`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

importBeverages();
