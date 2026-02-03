import { db } from '../server/db.js';
import { menuCategories } from '../shared/schema.js';

async function addCategories() {
  try {
    // Check existing categories
    const existing = await db.select().from(menuCategories);
    console.log('Existing categories:', existing.length);

    if (existing.length > 0) {
      console.log('\nCurrent categories:');
      existing.forEach(cat => {
        console.log(`- ${cat.name} (${cat.nameAr})`);
      });
    }

    // Add restaurant menu categories
    const categories = [
      {
        name: 'Appetizers',
        nameAr: 'المقبلات',
        description: 'Starters and appetizers',
        descriptionAr: 'المقبلات والمشهيات',
        sortOrder: 1,
        isActive: true
      },
      {
        name: 'Main Dishes',
        nameAr: 'الأطباق الرئيسية',
        description: 'Main course dishes',
        descriptionAr: 'الأطباق الرئيسية',
        sortOrder: 2,
        isActive: true
      },
      {
        name: 'Grills',
        nameAr: 'المشاوي',
        description: 'Grilled meats and seafood',
        descriptionAr: 'اللحوم والمأكولات البحرية المشوية',
        sortOrder: 3,
        isActive: true
      },
      {
        name: 'Salads',
        nameAr: 'السلطات',
        description: 'Fresh salads',
        descriptionAr: 'السلطات الطازجة',
        sortOrder: 4,
        isActive: true
      },
      {
        name: 'Soups',
        nameAr: 'الشوربات',
        description: 'Hot soups',
        descriptionAr: 'الشوربات الساخنة',
        sortOrder: 5,
        isActive: true
      },
      {
        name: 'Pasta & Rice',
        nameAr: 'المعكرونة والأرز',
        description: 'Pasta and rice dishes',
        descriptionAr: 'أطباق المعكرونة والأرز',
        sortOrder: 6,
        isActive: true
      },
      {
        name: 'Sandwiches',
        nameAr: 'السندويشات',
        description: 'Sandwiches and wraps',
        descriptionAr: 'السندويشات واللفائف',
        sortOrder: 7,
        isActive: true
      },
      {
        name: 'Pizza',
        nameAr: 'البيتزا',
        description: 'Pizza varieties',
        descriptionAr: 'أنواع البيتزا',
        sortOrder: 8,
        isActive: true
      },
      {
        name: 'Burgers',
        nameAr: 'البرجر',
        description: 'Burgers and sliders',
        descriptionAr: 'البرجر والسلايدرز',
        sortOrder: 9,
        isActive: true
      },
      {
        name: 'Seafood',
        nameAr: 'المأكولات البحرية',
        description: 'Fresh seafood dishes',
        descriptionAr: 'أطباق المأكولات البحرية الطازجة',
        sortOrder: 10,
        isActive: true
      },
      {
        name: 'Desserts',
        nameAr: 'الحلويات',
        description: 'Sweet desserts',
        descriptionAr: 'الحلويات',
        sortOrder: 11,
        isActive: true
      },
      {
        name: 'Hot Beverages',
        nameAr: 'المشروبات الساخنة',
        description: 'Coffee, tea, and hot drinks',
        descriptionAr: 'القهوة والشاي والمشروبات الساخنة',
        sortOrder: 12,
        isActive: true
      },
      {
        name: 'Cold Beverages',
        nameAr: 'المشروبات الباردة',
        description: 'Juices, soft drinks, and cold beverages',
        descriptionAr: 'العصائر والمشروبات الغازية والباردة',
        sortOrder: 13,
        isActive: true
      },
      {
        name: 'Fresh Juices',
        nameAr: 'العصائر الطازجة',
        description: 'Freshly squeezed juices',
        descriptionAr: 'العصائر الطازجة',
        sortOrder: 14,
        isActive: true
      },
      {
        name: 'Shisha',
        nameAr: 'الشيشة',
        description: 'Shisha flavors',
        descriptionAr: 'نكهات الشيشة',
        sortOrder: 15,
        isActive: true
      },
      {
        name: 'Breakfast',
        nameAr: 'الفطور',
        description: 'Breakfast items',
        descriptionAr: 'وجبات الفطور',
        sortOrder: 16,
        isActive: true
      },
      {
        name: 'Kids Menu',
        nameAr: 'قائمة الأطفال',
        description: 'Special menu for kids',
        descriptionAr: 'قائمة خاصة للأطفال',
        sortOrder: 17,
        isActive: true
      }
    ];

    console.log(`\nAdding ${categories.length} categories...`);

    for (const category of categories) {
      const inserted = await db.insert(menuCategories).values(category).returning();
      console.log(`✓ Added: ${category.name}`);
    }

    console.log('\n✓ All categories added successfully!');

    // Show final list
    const allCategories = await db.select().from(menuCategories);
    console.log(`\nTotal categories in database: ${allCategories.length}`);

  } catch (error) {
    console.error('Error adding categories:', error);
  } finally {
    process.exit(0);
  }
}

addCategories();
