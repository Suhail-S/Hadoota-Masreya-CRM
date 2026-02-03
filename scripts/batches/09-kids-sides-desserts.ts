import { db } from '../../server/db.js';
import { sql } from 'drizzle-orm';

async function importKidsSidesDesserts() {
  try {
    console.log('Importing Kids Meals, Side Orders & Desserts...\n');

    const categoriesResult = await db.execute(sql`SELECT id, name, parent_id FROM "Hadoota_Masreya_Manager".menu_categories`);
    const categories = categoriesResult.rows;

    const branchesResult = await db.execute(sql`SELECT id, code FROM "Hadoota_Masreya_Manager".branches`);
    const szrBranch = branchesResult.rows.find((b: any) => b.code === 'SZR');
    const ibnBranch = branchesResult.rows.find((b: any) => b.code === 'IBN');

    const getCategoryId = (name: string) => categories.find((c: any) => c.name === name && !c.parent_id)?.id;

    const items = [
      // KIDS MEALS
      {name: 'Kids Pasta with Crispy Chicken Panee', nameAr: 'باستا الأطفال مع دجاج مقرمش', description: 'This dish features perfectly cooked pasta tossed in a rich, savory sauce, topped with crispy chicken panee for a delightful crunch', price: 30, category: 'Kids Meals', branches: ['SZR', 'IBN']},
      {name: 'Kids Molokheya Magic Bowl', nameAr: 'صحن ملوخية سحري للأطفال', description: 'Delicious adventure for little taste buds. Molokheya served alongside fluffy rice and succulent kofta', price: 35, category: 'Kids Meals', branches: ['SZR', 'IBN']},

      // SIDE ORDERS
      {name: 'Sautéed Vegetables', nameAr: 'خضار سوتيه', description: 'Consists of broccoli, zucchini, green beans and carrots', price: 15, category: 'Side Orders', branches: ['SZR', 'IBN']},
      {name: 'French Fries', nameAr: 'بطاطس مقلية', description: 'Thin strips potatoes deep-fried until crispy and golden brown', price: 15, category: 'Side Orders', branches: ['SZR', 'IBN']},
      {name: 'Fried Sweet Potatoes', nameAr: 'بطاطا حلوة مقلية', description: 'Thin strips sweet potatoes deep-fried until crispy and golden', price: 20, category: 'Side Orders', branches: ['SZR', 'IBN']},
      {name: '¼ Chicken', nameAr: 'ربع دجاجة', description: 'Select your preferred cooking style: whether it\'s the tantalizing char of grilled perfection or the crispy crunch of fried goodness', price: 20, category: 'Side Orders', branches: ['SZR', 'IBN']},
      {name: 'Fried Meat Cubes', nameAr: 'مكعبات لحم مقلي', description: 'Bite-sized pieces of meat that are seasoned, coated, and fried until golden brown and crispy on the outside, while remaining juicy and tender on the inside', price: 25, category: 'Side Orders', branches: ['SZR', 'IBN']},
      {name: 'Rice', nameAr: 'أرز', description: 'Delicious fluffy rice perfect as a side dish for many dishes', price: 35, category: 'Side Orders', branches: ['SZR', 'IBN']},

      // DESSERTS
      {name: 'Qashtoota', nameAr: 'قشطوطة', description: 'Traditional Egyptian dessert', price: 27, category: 'Desserts', branches: ['SZR']},
      {name: 'Balah El Sham', nameAr: 'بلح الشام', description: 'Syrian-style fried dough dessert', price: 20, category: 'Desserts', branches: ['SZR']},
      {name: 'Balah El Sham', nameAr: 'بلح الشام', description: 'Syrian-style fried dough dessert', price: 35, category: 'Desserts', branches: ['IBN']},
      {name: 'Zalabya', nameAr: 'زلابية', description: 'Traditional fried sweet', price: 25, category: 'Desserts', branches: ['SZR']},
      {name: 'Zalabya', nameAr: 'زلابية', description: 'Traditional fried sweet', price: 30, category: 'Desserts', branches: ['IBN']},
      {name: 'Basbousa With Almonds', nameAr: 'بسبوسة باللوز', description: 'Semolina cake with almonds', price: 30, category: 'Desserts', branches: ['SZR', 'IBN']},
      {name: 'Qatayef', nameAr: 'قطايف', description: 'Stuffed Arabic pancakes', price: 30, category: 'Desserts', branches: ['SZR', 'IBN']},
      {name: 'Konafa', nameAr: 'كنافة', description: 'Traditional Middle Eastern dessert', price: 35, category: 'Desserts', branches: ['SZR']},
      {name: 'Konafa', nameAr: 'كنافة', description: 'Traditional Middle Eastern dessert', price: 45, category: 'Desserts', branches: ['IBN']},
      {name: 'Mix Desserts', nameAr: 'حلويات مشكلة', description: 'Assorted traditional desserts', price: 35, category: 'Desserts', branches: ['SZR', 'IBN']},
      {name: 'Umm Ali', nameAr: 'أم علي', description: 'A classic Egyptian dessert featuring layers of crispy dough, nuts, and raisins, all dipped in creamy milk and sweetened with sugar. Bake to perfection, then garnish with a sprinkle of nuts, adding a delightful crunch to every bite', price: 45, category: 'Desserts', branches: ['SZR', 'IBN']},
      {name: 'Rice Pudding', nameAr: 'رز بحليب', description: 'Creamy rice pudding', price: 20, category: 'Desserts', branches: ['SZR']},
      {name: 'Rice Pudding', nameAr: 'رز بحليب', description: 'Creamy rice pudding', price: 30, category: 'Desserts', branches: ['IBN']},
      {name: 'Fruits', nameAr: 'فواكه', description: 'Fresh seasonal fruits', price: 35, category: 'Desserts', branches: ['SZR']},
      {name: 'Fruits', nameAr: 'فواكه', description: 'Fresh seasonal fruits', price: 45, category: 'Desserts', branches: ['IBN']}
    ];

    let count = 0;

    for (const item of items) {
      const categoryId = getCategoryId(item.category);
      const priceInFils = Math.round(item.price * 100);

      const result = await db.execute(sql`
        INSERT INTO "Hadoota_Masreya_Manager".menu_items (
          name, name_ar, description, description_ar,
          price, category, category_id, base_price,
          item_type, preparation_station, meal_periods,
          is_featured, sort_order, is_active, is_available
        ) VALUES (
          ${item.name}, ${item.nameAr}, ${item.description}, '',
          ${priceInFils}, ${item.category}, ${categoryId}, ${priceInFils},
          'main', ${item.category === 'Desserts' ? 'cafe' : 'kitchen'}, 'all_day',
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
    }

    console.log(`\n✓ Successfully imported ${count} items (Kids Meals, Side Orders, Desserts)!`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

importKidsSidesDesserts();
