import { db } from '../server/db.js';
import { menuCategories } from '../shared/schema.js';
import { eq } from 'drizzle-orm';

async function setupMenuStructure() {
  try {
    console.log('Setting up menu category structure...\n');

    // Clear existing categories
    await db.delete(menuCategories);
    console.log('✓ Cleared existing categories\n');

    // Define main categories with their subcategories
    const categoryStructure = [
      {
        name: 'Breakfast',
        nameAr: 'الفطور',
        sortOrder: 1,
        subcategories: [
          { name: 'Breakfast Trays', nameAr: 'صواني الفطور' },
          { name: 'Foul, Falafel & Egg Dishes', nameAr: 'الفول والفلافل والبيض' }
        ]
      },
      {
        name: 'Lunch Meals (Mon - Thu)',
        nameAr: 'وجبات الغداء (الإثنين - الخميس)',
        sortOrder: 2,
        subcategories: []
      },
      {
        name: 'Soups',
        nameAr: 'الشوربات',
        sortOrder: 3,
        subcategories: []
      },
      {
        name: 'Salads',
        nameAr: 'السلطات',
        sortOrder: 4,
        subcategories: []
      },
      {
        name: 'Appetizers',
        nameAr: 'المقبلات',
        sortOrder: 5,
        subcategories: [
          { name: 'Cold Appetizers', nameAr: 'المقبلات الباردة' },
          { name: 'Hot Appetizers', nameAr: 'المقبلات الساخنة' },
          { name: 'Light Snacks', nameAr: 'وجبات خفيفة' } // IbnBattuta only
        ]
      },
      {
        name: 'Feteer',
        nameAr: 'الفطير',
        sortOrder: 6,
        subcategories: [
          { name: 'Savory Feteer', nameAr: 'فطير حادق' },
          { name: 'Sweet Feteer', nameAr: 'فطير حلو' },
          { name: 'Feteer Meshaltet', nameAr: 'فطير مشلتت' }
        ]
      },
      {
        name: 'Main Courses',
        nameAr: 'الأطباق الرئيسية',
        sortOrder: 7,
        subcategories: [
          { name: 'Koshari', nameAr: 'الكشري' },
          { name: 'Tagens & Vegetables', nameAr: 'الطواجن والخضروات' },
          { name: 'Escalope', nameAr: 'إسكالوب' },
          { name: 'Stuffed Vegetables (Mahashi)', nameAr: 'المحشي' },
          { name: 'Pigeon', nameAr: 'الحمام' },
          { name: 'Fatta', nameAr: 'الفتة' },
          { name: 'Signature Trays', nameAr: 'الصواني المميزة' }
        ]
      },
      {
        name: 'Grills',
        nameAr: 'المشاوي',
        sortOrder: 8,
        subcategories: []
      },
      {
        name: 'Kids Meals',
        nameAr: 'وجبات الأطفال',
        sortOrder: 9,
        subcategories: []
      },
      {
        name: 'Side Orders',
        nameAr: 'الأطباق الجانبية',
        sortOrder: 10,
        subcategories: []
      },
      {
        name: 'Desserts',
        nameAr: 'الحلويات',
        sortOrder: 11,
        subcategories: []
      },
      {
        name: 'Beverages',
        nameAr: 'المشروبات',
        sortOrder: 12,
        subcategories: [
          { name: 'Hot Drinks', nameAr: 'المشروبات الساخنة' },
          { name: 'Cold Drinks', nameAr: 'المشروبات الباردة' },
          { name: 'Soft Drinks & Water', nameAr: 'المشروبات الغازية والمياه' }
        ]
      },
      {
        name: 'Shisha',
        nameAr: 'الشيشة',
        sortOrder: 13,
        subcategories: [
          { name: 'Shisha Tobacco', nameAr: 'معسل الشيشة' }
        ]
      }
    ];

    let mainCount = 0;
    let subCount = 0;

    // Create main categories and their subcategories
    for (const category of categoryStructure) {
      // Insert main category
      const [mainCategory] = await db.insert(menuCategories).values({
        name: category.name,
        nameAr: category.nameAr,
        sortOrder: category.sortOrder,
        isActive: true
      }).returning();

      console.log(`✓ Added main category: ${category.name}`);
      mainCount++;

      // Insert subcategories if any
      if (category.subcategories.length > 0) {
        for (let i = 0; i < category.subcategories.length; i++) {
          const sub = category.subcategories[i];
          await db.insert(menuCategories).values({
            name: sub.name,
            nameAr: sub.nameAr,
            parentId: mainCategory.id,
            sortOrder: i + 1,
            isActive: true
          });
          console.log(`  ↳ Added subcategory: ${sub.name}`);
          subCount++;
        }
      }
    }

    console.log(`\n✓ Setup complete!`);
    console.log(`  Main categories: ${mainCount}`);
    console.log(`  Subcategories: ${subCount}`);
    console.log(`  Total: ${mainCount + subCount}`);

    // Display the structure
    console.log('\n📋 Menu Structure:');
    const allCategories = await db.select().from(menuCategories).orderBy(menuCategories.sortOrder);

    for (const cat of allCategories) {
      if (!cat.parentId) {
        console.log(`\n${cat.sortOrder}. ${cat.name} (${cat.nameAr})`);
        const subs = allCategories.filter(c => c.parentId === cat.id);
        for (const sub of subs) {
          console.log(`   ${sub.sortOrder}. ${sub.name} (${sub.nameAr})`);
        }
      }
    }

  } catch (error) {
    console.error('Error setting up menu structure:', error);
  } finally {
    process.exit(0);
  }
}

setupMenuStructure();
