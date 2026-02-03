import { db } from '../../server/db.js';
import { sql } from 'drizzle-orm';

// Part 1: Koshari, Tagens & Vegetables, Escalope, Stuffed Vegetables

async function importMainCoursesPart1() {
  try {
    console.log('Importing Main Courses (Part 1)...\n');

    const categoriesResult = await db.execute(sql`SELECT id, name, parent_id FROM "Hadoota_Masreya_Manager".menu_categories`);
    const categories = categoriesResult.rows;

    const branchesResult = await db.execute(sql`SELECT id, code FROM "Hadoota_Masreya_Manager".branches`);
    const szrBranch = branchesResult.rows.find((b: any) => b.code === 'SZR');
    const ibnBranch = branchesResult.rows.find((b: any) => b.code === 'IBN');

    const getCategoryId = (subcategory: string) => {
      const parent = categories.find((c: any) => c.name === 'Main Courses' && !c.parent_id);
      return categories.find((c: any) => c.name === subcategory && c.parent_id === parent?.id)?.id;
    };

    const items = [
      // KOSHARI
      {
        name: 'Koshari',
        nameAr: 'كشري',
        description: 'A mix of rice, lentils, and pasta, topped with a savory tomato sauce and garnished with crispy fried onions',
        price: 29,
        subcategory: 'Koshari',
        branches: ['SZR', 'IBN']
      },
      {
        name: 'Koshari with Alexandrian Liver',
        nameAr: 'كشري بالكبدة الإسكندراني',
        description: 'Koshari with slices of tender and flavorful alexandrian liver',
        price: 40,
        subcategory: 'Koshari',
        branches: ['SZR', 'IBN']
      },

      // TAGENS & VEGETABLES
      {
        name: 'Musaqa\'a',
        nameAr: 'مسقعة',
        description: 'Eggplant, minced meat and tomato sauce served with rice and egyptian bread',
        price: 45,
        subcategory: 'Tagens & Vegetables',
        branches: ['SZR']
      },
      {
        name: 'Musaqa\'a',
        nameAr: 'مسقعة',
        description: 'Eggplant, minced meat and tomato sauce served with rice and egyptian bread',
        price: 35,
        subcategory: 'Tagens & Vegetables',
        branches: ['IBN']
      },
      {
        name: 'Colcasia',
        nameAr: 'قلقاس',
        description: 'Served with your choice of rice and egyptian bread',
        price: 38,
        subcategory: 'Tagens & Vegetables',
        branches: ['SZR']
      },
      {
        name: 'Macaroni Bechamel',
        nameAr: 'مكرونة بشاميل',
        description: 'Penne pasta, mixed with minced beef tomato sauce and topped with a creamy béchamel sauce',
        price: 39,
        subcategory: 'Tagens & Vegetables',
        branches: ['SZR', 'IBN']
      },
      {
        name: 'Okra',
        nameAr: 'بامية',
        description: 'Okra stew with tomato sauce served with your choice of rice',
        price: 27,
        subcategory: 'Tagens & Vegetables',
        branches: ['SZR']
      },
      {
        name: 'Okra',
        nameAr: 'بامية',
        description: 'Okra stew with tomato sauce served with your choice of rice',
        price: 50,
        subcategory: 'Tagens & Vegetables',
        branches: ['IBN']
      },
      {
        name: 'Musaqa\'a Bechamel',
        nameAr: 'مسقعة بشاميل',
        description: 'Eggplant, minced meat, red sauce, bechamel, and mozzarella cheese served with rice and egyptian bread',
        price: 40,
        subcategory: 'Tagens & Vegetables',
        branches: ['SZR']
      },
      {
        name: 'Musaqa\'a Bechamel',
        nameAr: 'مسقعة بشاميل',
        description: 'Eggplant, minced meat, red sauce, bechamel, and mozzarella cheese served with rice and egyptian bread',
        price: 50,
        subcategory: 'Tagens & Vegetables',
        branches: ['IBN']
      },
      {
        name: 'Potatoes with Meat',
        nameAr: 'بطاطس باللحم',
        description: 'Oven-cooked potato and meat stew with your choice of rice',
        price: 40,
        subcategory: 'Tagens & Vegetables',
        branches: ['SZR', 'IBN']
      },
      {
        name: 'Roz Mua\'mar',
        nameAr: 'رز معمر',
        description: 'Oven-baked white rice, milk, cream, and your choice of pigeon pieces, meat or plain',
        price: 50,
        subcategory: 'Tagens & Vegetables',
        branches: ['SZR']
      },
      {
        name: 'Roz Mua\'mar',
        nameAr: 'رز معمر',
        description: 'Oven-baked white rice, milk, cream, and your choice of pigeon pieces, meat or plain',
        price: 65,
        subcategory: 'Tagens & Vegetables',
        branches: ['IBN']
      },
      {
        name: 'Cabbage & Meat',
        nameAr: 'ملفوف باللحم',
        description: 'Stuffed cabbage in the oven with veal cubes',
        price: 55,
        subcategory: 'Tagens & Vegetables',
        branches: ['SZR', 'IBN']
      },
      {
        name: 'Vine Leaves & Meat',
        nameAr: 'ورق عنب باللحم',
        description: 'Stuffed vine leaves in the oven with veal cubes',
        price: 55,
        subcategory: 'Tagens & Vegetables',
        branches: ['SZR', 'IBN']
      },
      {
        name: 'Meat Cubes',
        nameAr: 'مكعبات لحم',
        description: 'Meat cubes with onion sauce, served with your choice of rice and egyptian bread',
        price: 55,
        subcategory: 'Tagens & Vegetables',
        branches: ['SZR', 'IBN']
      },
      {
        name: 'Oxtail & Trotters',
        nameAr: 'ذيل ثور وكوارع',
        description: 'Served with your choice of rice and egyptian bread',
        price: 60,
        subcategory: 'Tagens & Vegetables',
        branches: ['SZR', 'IBN']
      },
      {
        name: 'Vine Leaves & Trotters',
        nameAr: 'ورق عنب وكوارع',
        description: 'Vine leaves, trotters, vinegar and garlic sauce in the oven',
        price: 65,
        subcategory: 'Tagens & Vegetables',
        branches: ['SZR', 'IBN']
      },
      {
        name: 'Lamb Shanks W Potatoes',
        nameAr: 'موزة ضاني بالبطاطس',
        description: 'Oven baked lamb shank tagen with potatoes and tomato sauce, served with your choice of rice',
        price: 65,
        subcategory: 'Tagens & Vegetables',
        branches: ['SZR', 'IBN']
      },
      {
        name: 'Molokheya',
        nameAr: 'ملوخية',
        description: 'Served with your choice of rice and egyptian bread',
        price: 45,
        subcategory: 'Tagens & Vegetables',
        branches: ['SZR', 'IBN']
      },
      {
        name: 'Molokheya & Lamb Neck',
        nameAr: 'ملوخية برقبة ضاني',
        description: 'Molokheya with lamb neck, served with rice',
        price: 65,
        subcategory: 'Tagens & Vegetables',
        branches: ['SZR', 'IBN']
      },
      {
        name: 'Molokheya & Chicken',
        nameAr: 'ملوخية بالفراخ',
        description: 'Molokheya with fried chicken quarter served with rice',
        price: 58,
        subcategory: 'Tagens & Vegetables',
        branches: ['SZR', 'IBN']
      },
      {
        name: 'Molokheya & Meat',
        nameAr: 'ملوخية باللحم',
        description: 'Molokheya with fried meat cubes served with rice',
        price: 58,
        subcategory: 'Tagens & Vegetables',
        branches: ['SZR', 'IBN']
      },
      {
        name: 'Molokheya & Lamb Shank',
        nameAr: 'ملوخية بموزة ضاني',
        description: 'Molokheya with tender lamb shank served with rice',
        price: 75,
        subcategory: 'Tagens & Vegetables',
        branches: ['SZR', 'IBN']
      },
      {
        name: 'Oxtail',
        nameAr: 'ذيل ثور',
        description: 'Served with your choice of rice and egyptian bread',
        price: 50,
        subcategory: 'Tagens & Vegetables',
        branches: ['SZR', 'IBN']
      },

      // ESCALOPE
      {
        name: 'Meat Escalope',
        nameAr: 'إسكالوب لحم',
        description: 'Beef escalope. Served with your choice of sides',
        price: 70,
        subcategory: 'Escalope',
        branches: ['SZR', 'IBN']
      },

      // STUFFED VEGETABLES (MAHASHI)
      {
        name: 'Eggplant',
        nameAr: 'باذنجان محشي',
        description: 'Stuffed eggplant',
        price: 32,
        subcategory: 'Stuffed Vegetables (Mahashi)',
        branches: ['SZR', 'IBN']
      },
      {
        name: 'Zucchini',
        nameAr: 'كوسة محشي',
        description: 'Stuffed zucchini',
        price: 32,
        subcategory: 'Stuffed Vegetables (Mahashi)',
        branches: ['SZR', 'IBN']
      },
      {
        name: 'Eggplant & Zucchini',
        nameAr: 'باذنجان وكوسة محشي',
        description: 'Stuffed eggplant and zucchini',
        price: 32,
        subcategory: 'Stuffed Vegetables (Mahashi)',
        branches: ['SZR', 'IBN']
      },
      {
        name: 'Cabbage',
        nameAr: 'ملفوف محشي',
        description: 'Stuffed cabbage',
        price: 32,
        subcategory: 'Stuffed Vegetables (Mahashi)',
        branches: ['SZR', 'IBN']
      },
      {
        name: 'Vineleaves',
        nameAr: 'ورق عنب',
        description: 'Stuffed vine leaves',
        price: 35,
        subcategory: 'Stuffed Vegetables (Mahashi)',
        branches: ['SZR', 'IBN']
      },
      {
        name: 'Vineleaves & Cabbage',
        nameAr: 'ورق عنب وملفوف',
        description: 'Stuffed vine leaves and cabbage',
        price: 35,
        subcategory: 'Stuffed Vegetables (Mahashi)',
        branches: ['SZR', 'IBN']
      },
      {
        name: 'Mixed Vegetables',
        nameAr: 'خضار مشكل',
        description: 'Capsicum, eggplant, zucchini, vine leaves and cabbage',
        price: 45,
        subcategory: 'Stuffed Vegetables (Mahashi)',
        branches: ['SZR', 'IBN']
      },
      {
        name: 'Mixed Vegetables & Mombar',
        nameAr: 'خضار مشكل ومنبار',
        description: 'Eggplant, zucchini, cabbage and vine leaves with mombar',
        price: 48,
        subcategory: 'Stuffed Vegetables (Mahashi)',
        branches: ['SZR', 'IBN']
      },
      {
        name: 'Mombar',
        nameAr: 'ممبار',
        description: 'Rice stuffed sausage, golden fried',
        price: 48,
        subcategory: 'Stuffed Vegetables (Mahashi)',
        branches: ['SZR', 'IBN']
      },
      {
        name: 'Capsicum',
        nameAr: 'فلفل محشي',
        description: 'Stuffed bell peppers',
        price: 50,
        subcategory: 'Stuffed Vegetables (Mahashi)',
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
      if (count % 10 === 0) {
        console.log(`  ... ${count} items imported so far`);
      }
    }

    console.log(`\n✓ Successfully imported ${count} main course items (Part 1)!`);
    console.log('Next: Run 07-main-courses-part2.ts for Pigeon, Fatta, and Signature Trays');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

importMainCoursesPart1();
