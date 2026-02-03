import { db } from '../../server/db.js';
import { sql } from 'drizzle-orm';

async function importSoupsSalads() {
  try {
    console.log('Importing Soups & Salads...\n');

    const categoriesResult = await db.execute(sql`SELECT id, name, parent_id FROM "Hadoota_Masreya_Manager".menu_categories`);
    const categories = categoriesResult.rows;

    const branchesResult = await db.execute(sql`SELECT id, code FROM "Hadoota_Masreya_Manager".branches`);
    const szrBranch = branchesResult.rows.find((b: any) => b.code === 'SZR');
    const ibnBranch = branchesResult.rows.find((b: any) => b.code === 'IBN');

    const getCategoryId = (name: string) => categories.find((c: any) => c.name === name && !c.parent_id)?.id;

    const items = [
      // SOUPS
      {
        name: 'Risoni Soup',
        nameAr: 'شوربة لسان العصفور',
        description: 'A traditional Egyptian favorite that combines the rich flavors of delicate risoni (orzo) and a savory broth',
        price: 20,
        category: 'Soups',
        branches: ['SZR', 'IBN']
      },
      {
        name: 'Lentil Soup',
        nameAr: 'شوربة عدس',
        description: 'Our classic healthy lentil soup, a favorite in egypt that features tender yellow lentils cooked in a tasty broth',
        price: 20,
        category: 'Soups',
        branches: ['SZR', 'IBN']
      },
      {
        name: 'Pigeon Soup',
        nameAr: 'شوربة حمام',
        description: 'A flavorful pigeon soup, served with tender pieces of pigeon cooked in a rich, aromatic broth',
        price: 35,
        category: 'Soups',
        branches: ['SZR', 'IBN']
      },
      {
        name: 'Trotters Soup',
        nameAr: 'شوربة كوارع',
        description: 'A delightful soup cooked with tender, boneless trotters simmered in a rich broth',
        price: 39,
        category: 'Soups',
        branches: ['SZR', 'IBN']
      },
      {
        name: 'Mushroom Soup',
        nameAr: 'شوربة مشروم',
        description: 'Creamy mushroom soup',
        price: 20,
        category: 'Soups',
        branches: ['IBN']
      },

      // SALADS
      {
        name: 'Baladi Salad',
        nameAr: 'سلطة بلدي',
        description: 'Contains tomatoes, cucumber, lettuce, onions and hadoota dressing',
        price: 30,
        category: 'Salads',
        branches: ['SZR', 'IBN']
      },
      {
        name: 'Fatoush',
        nameAr: 'فتوش',
        description: 'A vibrant middle eastern salad that contains tomatoes, cucumbers, radishes, toasted pita bread, and a zesty sumac dressing',
        price: 30,
        category: 'Salads',
        branches: ['SZR', 'IBN']
      },
      {
        name: 'Taboula Salad',
        nameAr: 'تبولة',
        description: 'A delightful combination of finely chopped parsley, tomatoes, onions, mint, bulgur wheat, tossed with olive oil and lemon juice',
        price: 30,
        category: 'Salads',
        branches: ['SZR', 'IBN']
      },
      {
        name: 'Rocca Salad',
        nameAr: 'سلطة جرجير',
        description: 'Contains rocca, olives, tomatoes, parmesan cheese, balsamic vinegar, pomegranate molasses',
        price: 30,
        category: 'Salads',
        branches: ['SZR', 'IBN']
      },
      {
        name: 'Eggplant Salad',
        nameAr: 'سلطة باذنجان',
        description: 'Fresh eggplant salad',
        price: 35,
        category: 'Salads',
        branches: ['SZR', 'IBN']
      },
      {
        name: 'Rocca & Feta with Watermelon',
        nameAr: 'جرجير وفيتا بالبطيخ',
        description: 'Cubes of ripe watermelon are paired with feta cheese',
        price: 35,
        category: 'Salads',
        branches: ['SZR', 'IBN']
      },
      {
        name: 'Rocca Salad with Beetroot & Feta Cheese',
        nameAr: 'سلطة جرجير بالشمندر والفيتا',
        description: 'Contains rocca, beetroot, feta cheese and a vinegrette dressing',
        price: 38,
        category: 'Salads',
        branches: ['SZR', 'IBN']
      },
      {
        name: 'Rocca Salad with Chicken',
        nameAr: 'سلطة جرجير بالدجاج',
        description: 'Contains rocca, olives, tomatoes, parmesan cheese, balsamic vinegar, pomegranate molasses, with slices of grilled chicken breasts. Add avocado - 15 AED',
        price: 50,
        category: 'Salads',
        branches: ['SZR', 'IBN']
      }
    ];

    let count = 0;

    for (const item of items) {
      const categoryId = getCategoryId(item.category);
      if (!categoryId) {
        console.warn(`⚠ Category not found: ${item.category}`);
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
          ${priceInFils}, ${item.category}, ${categoryId}, ${priceInFils},
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
      console.log(`✓ ${count}. ${item.name} - AED ${item.price} [${item.category}]`);
    }

    console.log(`\n✓ Successfully imported ${count} items!`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

importSoupsSalads();
