import { db } from '../../server/db.js';
import { sql } from 'drizzle-orm';

async function importGrills() {
  try {
    console.log('Importing Grills...\n');

    const categoriesResult = await db.execute(sql`SELECT id, name, parent_id FROM "Hadoota_Masreya_Manager".menu_categories`);
    const categories = categoriesResult.rows;

    const branchesResult = await db.execute(sql`SELECT id, code FROM "Hadoota_Masreya_Manager".branches`);
    const szrBranch = branchesResult.rows.find((b: any) => b.code === 'SZR');
    const ibnBranch = branchesResult.rows.find((b: any) => b.code === 'IBN');

    const getCategoryId = () => categories.find((c: any) => c.name === 'Grills' && !c.parent_id)?.id;

    const items = [
      {name: 'Meat Skewer (Baqlawa)', nameAr: 'سيخ لحم (بقلاوة)', description: 'Traditional meat skewer', price: 80, branches: ['SZR', 'IBN']},
      {name: 'Entrecote', nameAr: 'أنتريكوت', description: 'Grilled entrecote steak', price: 110, branches: ['SZR', 'IBN']},
      {name: 'Grilled Lamb Shank', nameAr: 'موزة ضاني مشوية', description: 'Served with your choice of one side order and 2 condiments', price: 60, branches: ['SZR', 'IBN']},
      {name: 'Hawawshi', nameAr: 'حواوشي', description: 'One or 2 loaves served with your choice of one side order and 2 condiments', price: 60, branches: ['SZR', 'IBN']},
      {name: 'Mixed Grills', nameAr: 'مشاوي مشكلة', description: 'Kofta, kabab, shish tawook, hawawshi', price: 87, branches: ['SZR', 'IBN']},
      {name: 'Kofta', nameAr: 'كفتة', description: 'Served with your choice of one side order and 2 condiments', price: 70, branches: ['SZR', 'IBN']},
      {name: 'Kabab', nameAr: 'كباب', description: 'Served with your choice of one side order and 2 condiments', price: 96, branches: ['SZR', 'IBN']},
      {name: 'Tarb', nameAr: 'طرب', description: 'Served with your choice of one side order and 2 condiments', price: 90, branches: ['SZR', 'IBN']},
      {name: 'Lamb Chops', nameAr: 'ريش ضاني', description: 'Served with your choice of one side order and 2 condiments', price: 105, branches: ['SZR', 'IBN']},
      {name: 'Grilled Liver', nameAr: 'كبدة مشوية', description: 'Served with your choice of one side order and 2 condiments', price: 45, branches: ['SZR', 'IBN']},
      {name: 'Grilled Sausages', nameAr: 'سجق مشوي', description: 'Served with your choice of one side order and 2 condiments', price: 50, branches: ['SZR', 'IBN']},
      {name: 'Shish Tawook', nameAr: 'شيش طاووق', description: 'Served with your choice of one side order and 2 condiments', price: 50, branches: ['SZR', 'IBN']},
      {name: 'Grilled Chicken Breasts', nameAr: 'صدور دجاج مشوية', description: 'Served with your choice of one side order and 2 condiments', price: 50, branches: ['SZR', 'IBN']},
      {name: 'Half Grilled Chicken', nameAr: 'نصف دجاجة مشوية', description: 'Served with your choice of one side order and 2 condiments', price: 55, branches: ['SZR', 'IBN']},
      {name: 'Shish Tawook & Kofta', nameAr: 'شيش طاووق وكفتة', description: 'Served with your choice of one side order and 2 condiments', price: 60, branches: ['SZR', 'IBN']},
      {name: 'Kofta & Tarb', nameAr: 'كفتة وطرب', description: 'Served with your choice of one side order and 2 condiments', price: 65, branches: ['SZR', 'IBN']},
      {name: 'Kabab & Tarb', nameAr: 'كباب وطرب', description: 'Served with your choice of one side order and 2 condiments', price: 78, branches: ['SZR', 'IBN']},
      {name: 'Lamb Chops & Tarb', nameAr: 'ريش ضاني وطرب', description: 'Served with your choice of one side order and 2 condiments', price: 83, branches: ['SZR', 'IBN']},
      {name: 'Kabab & Kofta', nameAr: 'كباب وكفتة', description: 'Served with your choice of one side order and 2 condiments', price: 83, branches: ['SZR', 'IBN']},
      {name: 'Lamb Chops & Kofta', nameAr: 'ريش ضاني وكفتة', description: 'Served with your choice of one side order and 2 condiments', price: 88, branches: ['SZR', 'IBN']},
      {name: 'Lamb Chops & Kabab', nameAr: 'ريش ضاني وكباب', description: 'Served with your choice of one side order and 2 condiments', price: 100, branches: ['SZR', 'IBN']},
      {name: 'Hadoota Mixed Grills', nameAr: 'مشاوي حدوتة المشكلة', description: 'Kofta, kabab, lamb chops, tarb, shish tawook and hawawshi', price: 150, branches: ['SZR', 'IBN']},
      {name: 'Mixed Grills Meat', nameAr: 'مشاوي لحم مشكلة', description: 'Kofta, kabab, lamb chops, tarb, hawawshi, sausages', price: 175, branches: ['SZR', 'IBN']},
      {name: 'Mix Special 1 KG', nameAr: 'ميكس سبيشال 1 كجم', description: 'Kofta, kabab, tarb and shish tawook', price: 198, branches: ['SZR', 'IBN']}
    ];

    const categoryId = getCategoryId();
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
          ${priceInFils}, 'Grills', ${categoryId}, ${priceInFils},
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
      if (count % 5 === 0) console.log(`  ... ${count} items imported`);
    }

    console.log(`\n✓ Successfully imported ${count} grill items!`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

importGrills();
