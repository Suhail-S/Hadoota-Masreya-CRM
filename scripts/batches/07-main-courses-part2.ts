import { db } from '../../server/db.js';
import { sql } from 'drizzle-orm';

// Part 2: Pigeon, Fatta, Signature Trays

async function importMainCoursesPart2() {
  try {
    console.log('Importing Main Courses (Part 2)...\n');

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
      // PIGEON
      {
        name: 'Fried Stuffed Pigeons',
        nameAr: 'حمام محشي مقلي',
        description: '1 or 2 crispy fried pigeons, stuffed with rice or freek served with your choice of side order',
        price: 65,
        subcategory: 'Pigeon',
        branches: ['SZR', 'IBN']
      },
      {
        name: 'Grilled Pigeons',
        nameAr: 'حمام مشوي',
        description: 'Served with your choice of one side order and 2 condiments',
        price: 110,
        subcategory: 'Pigeon',
        branches: ['SZR']
      },
      {
        name: 'Grilled Pigeons',
        nameAr: 'حمام مشوي',
        description: 'Served with your choice of one side order and 2 condiments',
        price: 60,
        subcategory: 'Pigeon',
        branches: ['IBN']
      },
      {
        name: 'Grilled Stuffed Pigeons',
        nameAr: 'حمام محشي مشوي',
        description: '2 or 4 stuffed pigeons with your choice of rice or freek, charcoal grilled. Served with your choice of side order',
        price: 125,
        subcategory: 'Pigeon',
        branches: ['SZR', 'IBN']
      },

      // FATTA
      {
        name: 'Fatta',
        nameAr: 'فتة',
        description: 'Layers of fluffy rice and crispy bread, topped with a rich blend of garlic, vinegar, and tomato sauce',
        price: 30,
        subcategory: 'Fatta',
        branches: ['SZR', 'IBN']
      },
      {
        name: 'Fatta With Lamb Neck',
        nameAr: 'فتة برقبة ضاني',
        description: 'Lamb neck over fluffy rice and crispy bread. Topped with a zesty mix of garlic, vinegar, and tomato sauce',
        price: 60,
        subcategory: 'Fatta',
        branches: ['SZR', 'IBN']
      },
      {
        name: 'Fatta with Meat Cubes',
        nameAr: 'فتة بمكعبات اللحم',
        description: 'Fried meat cubes over fluffy rice and crispy bread. Topped with a zesty mix of garlic, vinegar, and tomato sauce',
        price: 60,
        subcategory: 'Fatta',
        branches: ['SZR', 'IBN']
      },
      {
        name: 'Fatta with Trotters',
        nameAr: 'فتة بالكوارع',
        description: 'Trotters over fluffy rice and crispy bread. Topped with a zesty mix of garlic, vinegar, and tomato sauce',
        price: 60,
        subcategory: 'Fatta',
        branches: ['SZR', 'IBN']
      },
      {
        name: 'Fatta with Oxtail',
        nameAr: 'فتة بذيل الثور',
        description: 'Tender oxtail over fluffy rice and crispy bread. Topped with a zesty mix of garlic, vinegar, and tomato sauce',
        price: 60,
        subcategory: 'Fatta',
        branches: ['SZR', 'IBN']
      },
      {
        name: 'Fatta with Lamb Shank',
        nameAr: 'فتة بموزة ضاني',
        description: 'Slow cooked lamb shank over fluffy rice and crispy bread. Topped with a zesty mix of garlic, vinegar, and tomato sauce',
        price: 65,
        subcategory: 'Fatta',
        branches: ['SZR', 'IBN']
      },
      {
        name: 'Fatta with Lamb Shoulder',
        nameAr: 'فتة بكتف ضاني',
        description: 'Lamb shoulder fatta',
        price: 220,
        subcategory: 'Fatta',
        branches: ['SZR', 'IBN']
      },

      // SIGNATURE TRAYS
      {
        name: 'Chicken & Potatoes',
        nameAr: 'دجاج بالبطاطس',
        description: 'Half chicken & potatoes, served with rice',
        price: 80,
        subcategory: 'Signature Trays',
        branches: ['SZR', 'IBN']
      },
      {
        name: 'Half Duck & Oriental rice',
        nameAr: 'نصف بطة بالأرز الشرقي',
        description: 'Perfectly cooked roasted half duck served with fatta or oriental rice with nuts',
        price: 110,
        subcategory: 'Signature Trays',
        branches: ['SZR', 'IBN']
      },
      {
        name: 'Lamb Shanks W Potatoes',
        nameAr: 'موزة ضاني بالبطاطس',
        description: 'Oven-baked 2 lamb shanks & potatoes, tender and perfectly seasoned and roasted to golden perfection, served with rice',
        price: 120,
        subcategory: 'Signature Trays',
        branches: ['SZR', 'IBN']
      },
      {
        name: 'Lamb Neck',
        nameAr: 'رقبة ضاني',
        description: 'With your choice of fatta or oriental rice',
        price: 120,
        subcategory: 'Signature Trays',
        branches: ['SZR', 'IBN']
      },
      {
        name: 'Lamb Chops & Potatoes',
        nameAr: 'ريش ضاني بالبطاطس',
        description: 'Lamb chops cooked with potatoes, served with rice',
        price: 130,
        subcategory: 'Signature Trays',
        branches: ['SZR', 'IBN']
      },
      {
        name: 'Half Duck & Vine Leaves or Cabbage',
        nameAr: 'نصف بطة بورق العنب أو الملفوف',
        description: 'Roasted half duck with stuffed vine leaves or cabbage',
        price: 130,
        subcategory: 'Signature Trays',
        branches: ['SZR', 'IBN']
      },
      {
        name: 'Roasted Lamb Shoulder',
        nameAr: 'كتف ضاني مشوي',
        description: 'Roasted lamb shoulder, slow-cooked served with your choice rice',
        price: 220,
        subcategory: 'Signature Trays',
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
      console.log(`✓ ${count}. ${item.name} - AED ${item.price} [${item.subcategory}]`);
    }

    console.log(`\n✓ Successfully imported ${count} main course items (Part 2)!`);
    console.log('Main Courses complete! Next: Run 08-grills.ts');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

importMainCoursesPart2();
