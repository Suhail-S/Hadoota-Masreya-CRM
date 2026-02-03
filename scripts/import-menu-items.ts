import { db } from '../server/db.js';
import { menuItems, menuCategories, menuItemBranches, branches } from '../shared/schema.js';
import { eq } from 'drizzle-orm';

interface MenuItem {
  name: string;
  nameAr: string;
  description: string;
  price: number; // in AED
  category: string;
  subcategory?: string;
  branches: string[]; // branch codes: 'SZR', 'IBN' (Ibn Battuta)
  preparationStation?: 'kitchen' | 'bar' | 'cafe' | 'shisha';
  mealPeriods?: string;
}

async function importMenuItems() {
  try {
    console.log('Starting menu import...\n');

    // Get branch IDs
    const allBranches = await db.select().from(branches);
    const szrBranch = allBranches.find(b => b.code === 'SZR');
    const ibnBranch = allBranches.find(b => b.code === 'IBN');

    if (!szrBranch || !ibnBranch) {
      console.error('Branches not found. Please ensure SZR and IBN branches exist.');
      process.exit(1);
    }

    console.log(`✓ Found branches: SZR (${szrBranch.id}), IBN (${ibnBranch.id})\n`);

    // Get all categories
    const categories = await db.select().from(menuCategories);

    const getCategoryId = (name: string, parentName?: string) => {
      if (parentName) {
        const parent = categories.find(c => c.name === parentName && !c.parentId);
        const sub = categories.find(c => c.name === name && c.parentId === parent?.id);
        return sub?.id;
      }
      return categories.find(c => c.name === name && !c.parentId)?.id;
    };

    // Menu items data
    const menuItemsData: MenuItem[] = [
      // ========== BREAKFAST ==========
      // Breakfast Trays
      {
        name: 'Hadoota Breakfast',
        nameAr: 'فطور حدوتة',
        description: 'Fava beans, falafel sticks, white cheese with tomatoes or mesh cheese according to your desire, roomi cheese, halawa, fried eggplant, fresh vegetables and pickles. Served with your choice of drink',
        price: 45,
        category: 'Breakfast',
        subcategory: 'Breakfast Trays',
        branches: ['SZR', 'IBN'],
        preparationStation: 'kitchen'
      },
      {
        name: 'Family Breakfast',
        nameAr: 'فطور العائلة',
        description: 'Fava beans - falafel - feta cheese - french fries - fried eggplant - mesh cheese - besara - dukka - olive oil - pickles - pickled tomatoes - luncheon - roomy cheese - fresh sliced vegetables - butter and jam - watermelon - halawa. Served with your choice of egg and breakfast drink',
        price: 99,
        category: 'Breakfast',
        subcategory: 'Breakfast Trays',
        branches: ['SZR', 'IBN'],
        preparationStation: 'kitchen'
      },
      {
        name: 'Baladi Breakfast',
        nameAr: 'فطور بلدي',
        description: 'Feteer meshaltet - fava beans - falafel - feta cheese - mesh cheese - pickles - fresh sliced vegetables. Served with your choice of egg and breakfast drink',
        price: 70,
        category: 'Breakfast',
        subcategory: 'Breakfast Trays',
        branches: ['SZR', 'IBN'],
        preparationStation: 'kitchen'
      },

      // Foul, Falafel & Egg Dishes
      {
        name: 'Foul with Sausages',
        nameAr: 'فول بالسجق',
        description: 'Fava beans with sausages, a hearty and flavorful dish that combines tender fava beans with savory sausages',
        price: 33,
        category: 'Breakfast',
        subcategory: 'Foul, Falafel & Egg Dishes',
        branches: ['SZR', 'IBN'],
        preparationStation: 'kitchen'
      },
      {
        name: 'Foul Hadoota',
        nameAr: 'فول حدوتة',
        description: 'Mashed fava beans with parsley, white onions, tomatoes and tahini',
        price: 28,
        category: 'Breakfast',
        subcategory: 'Foul, Falafel & Egg Dishes',
        branches: ['SZR', 'IBN'],
        preparationStation: 'kitchen'
      },
      {
        name: 'Foul with Eggs',
        nameAr: 'فول بالبيض',
        description: 'A classic Egyptian protein-packed delight that combines fava beans (foul) with eggs',
        price: 28,
        category: 'Breakfast',
        subcategory: 'Foul, Falafel & Egg Dishes',
        branches: ['SZR', 'IBN'],
        preparationStation: 'kitchen'
      },
      {
        name: 'Foul with Ghee',
        nameAr: 'فول بالسمن',
        description: 'Fava beans with local ghee and spices',
        price: 23,
        category: 'Breakfast',
        subcategory: 'Foul, Falafel & Egg Dishes',
        branches: ['SZR', 'IBN'],
        preparationStation: 'kitchen'
      },
      {
        name: 'Foul with Olive Oil',
        nameAr: 'فول بزيت الزيتون',
        description: 'Fava beans with olive oil and spices',
        price: 23,
        category: 'Breakfast',
        subcategory: 'Foul, Falafel & Egg Dishes',
        branches: ['SZR', 'IBN'],
        preparationStation: 'kitchen'
      },
      {
        name: 'Egyptian Falafel',
        nameAr: 'طعمية مصرية',
        description: 'Egyptian falafel is traditionally crafted from fava beans, mixed with aromatic herbs and spices such as parsley, cilantro, garlic, and cumin. Served with tahini, pickles and egyptian bread',
        price: 12,
        category: 'Breakfast',
        subcategory: 'Foul, Falafel & Egg Dishes',
        branches: ['SZR', 'IBN'],
        preparationStation: 'kitchen'
      },
      {
        name: 'Alexandrian Falafel',
        nameAr: 'طعمية إسكندراني',
        description: 'Spicy falafel/tameya stuffed with chili paste, sesame and coriander served with tahini, pickles and egyptian bread',
        price: 22,
        category: 'Breakfast',
        subcategory: 'Foul, Falafel & Egg Dishes',
        branches: ['SZR', 'IBN'],
        preparationStation: 'kitchen'
      },
      {
        name: 'Falafel Fingers',
        nameAr: 'أصابع الطعمية',
        description: 'Egyptian falafel fingers are crispy on the outside, soft on the inside, and bursting with flavor. Made from ground fava beans, herbs, and spices',
        price: 22,
        category: 'Breakfast',
        subcategory: 'Foul, Falafel & Egg Dishes',
        branches: ['SZR', 'IBN'],
        preparationStation: 'kitchen'
      },
      {
        name: 'Falafel Pops',
        nameAr: 'كرات الطعمية',
        description: 'Plain falafel balls with sesame and dried coriander served with: tahini, pickles and egyptian bread',
        price: 20,
        category: 'Breakfast',
        subcategory: 'Foul, Falafel & Egg Dishes',
        branches: ['SZR', 'IBN'],
        preparationStation: 'kitchen'
      },
      {
        name: 'Eggs Your Style',
        nameAr: 'بيض على كيفك',
        description: 'Your choice of 2 eggs cooked your way',
        price: 25,
        category: 'Breakfast',
        subcategory: 'Foul, Falafel & Egg Dishes',
        branches: ['SZR', 'IBN'],
        preparationStation: 'kitchen'
      },

      // ========== LUNCH MEALS ==========
      {
        name: 'Hadoota Lunch Tray',
        nameAr: 'صينية حدوتة للغداء',
        description: 'Perfectly portioned for three people. Includes 3 kababs, 3 koftas, 3 tarbs, 3 shish tawooks, 3 quarters of hawawshi, 3 stuffed vine-leaves, 3 stuffed cabbages and 3 mombars and 3 sausages. Served on rice, along with 3 soup, and 3 fresh salad, 3 soft drink & 3 dessert, all of your choice',
        price: 220,
        category: 'Lunch Meals (Mon - Thu)',
        branches: ['SZR', 'IBN'],
        preparationStation: 'kitchen'
      },
      {
        name: 'Lamb Neck Fatta',
        nameAr: 'فتة رقبة ضاني',
        description: 'Cooked lamb neck on a plate of egyptian fatta. Accompanied with your choice of salad, soup, and a soft drink',
        price: 59,
        category: 'Lunch Meals (Mon - Thu)',
        branches: ['SZR', 'IBN'],
        preparationStation: 'kitchen'
      },
      {
        name: 'Molokheya',
        nameAr: 'ملوخية',
        description: 'Molokheya and rice accompanied by perfectly fried chicken or fried meat. Served with rice and your choice of salad, soup, and a soft drink',
        price: 55,
        category: 'Lunch Meals (Mon - Thu)',
        branches: ['SZR', 'IBN'],
        preparationStation: 'kitchen'
      },
      {
        name: 'Grilled Chicken Breasts',
        nameAr: 'صدور دجاج مشوية',
        description: 'Tender and juicy chicken breasts grilled to perfection. Accompanied by rice and your choice of salad, soup, and a soft drink',
        price: 55,
        category: 'Lunch Meals (Mon - Thu)',
        branches: ['SZR', 'IBN'],
        preparationStation: 'kitchen'
      },
      {
        name: 'Grilled Kofta',
        nameAr: 'كفتة مشوية',
        description: 'Juicy kofta, expertly seasoned and grilled, accompanied by rice and your choice of salad, soup, and a soft drink',
        price: 59,
        category: 'Lunch Meals (Mon - Thu)',
        branches: ['SZR', 'IBN'],
        preparationStation: 'kitchen'
      },
      {
        name: 'Shish Tawook',
        nameAr: 'شيش طاووق',
        description: 'Tender and flavorful chicken skewers marinated and grilled to perfection. Accompanied by rice and your choice of salad, soup, and a soft drink',
        price: 49,
        category: 'Lunch Meals (Mon - Thu)',
        branches: ['SZR', 'IBN'],
        preparationStation: 'kitchen'
      },
      {
        name: 'Half Grilled Chicken',
        nameAr: 'نصف دجاجة مشوية',
        description: 'Half of a grilled marinated chicken. Accompanied by rice and your choice of salad, soup, and a soft drink',
        price: 55,
        category: 'Lunch Meals (Mon - Thu)',
        branches: ['SZR', 'IBN'],
        preparationStation: 'kitchen'
      },
      {
        name: 'Hadoota Trio Combo',
        nameAr: 'تريو حدوتة',
        description: 'A trio of delectable sandwiches featuring kofta, tawook, and sausages. Crafted with your choice bread and served alongside a crisp salad, a hearty soup, and your preferred drink. Ask your waiter to change soup to fries if you wish to',
        price: 40,
        category: 'Lunch Meals (Mon - Thu)',
        branches: ['IBN'],
        preparationStation: 'kitchen'
      },
      {
        name: 'Sandwich Trio',
        nameAr: 'تريو ساندويتش',
        description: 'A trio of delectable sandwiches featuring kofta, tawook, and sausages. Crafted with your choice bread and served alongside a crisp salad, a hearty soup, and your preferred drink. Ask your waiter to change soup to fries if you wish to',
        price: 40,
        category: 'Lunch Meals (Mon - Thu)',
        branches: ['SZR'],
        preparationStation: 'kitchen'
      },
      {
        name: 'Chicken & Potatoes Tray',
        nameAr: 'صينية دجاج بالبطاطس',
        description: 'Tender chicken and golden potatoes, cooked to perfection and served with rice & your choice of soup, salad and soft drink',
        price: 45,
        category: 'Lunch Meals (Mon - Thu)',
        branches: ['SZR', 'IBN'],
        preparationStation: 'kitchen'
      },
      {
        name: 'Rice Kofta',
        nameAr: 'كفتة أرز',
        description: 'A flavorful blend of ground rice, meat and spices, crafted into rice kofta topped with tomato sauce and served with rice and your choice of soup, salad and soft drink',
        price: 45,
        category: 'Lunch Meals (Mon - Thu)',
        branches: ['SZR', 'IBN'],
        preparationStation: 'kitchen'
      },

      // ========== SOUPS ==========
      {
        name: 'Risoni Soup',
        nameAr: 'شوربة لسان العصفور',
        description: 'A traditional Egyptian favorite that combines the rich flavors of delicate risoni (orzo) and a savory broth',
        price: 20,
        category: 'Soups',
        branches: ['SZR', 'IBN'],
        preparationStation: 'kitchen'
      },
      {
        name: 'Lentil Soup',
        nameAr: 'شوربة عدس',
        description: 'Our classic healthy lentil soup, a favorite in egypt that features tender yellow lentils cooked in a tasty broth',
        price: 20,
        category: 'Soups',
        branches: ['SZR', 'IBN'],
        preparationStation: 'kitchen'
      },
      {
        name: 'Pigeon Soup',
        nameAr: 'شوربة حمام',
        description: 'A flavorful pigeon soup, served with tender pieces of pigeon cooked in a rich, aromatic broth',
        price: 35,
        category: 'Soups',
        branches: ['SZR', 'IBN'],
        preparationStation: 'kitchen'
      },
      {
        name: 'Trotters Soup',
        nameAr: 'شوربة كوارع',
        description: 'A delightful soup cooked with tender, boneless trotters simmered in a rich broth',
        price: 39,
        category: 'Soups',
        branches: ['SZR', 'IBN'],
        preparationStation: 'kitchen'
      },
      {
        name: 'Mushroom Soup',
        nameAr: 'شوربة مشروم',
        description: 'Creamy mushroom soup',
        price: 20,
        category: 'Soups',
        branches: ['IBN'],
        preparationStation: 'kitchen'
      },

      // ========== SALADS ==========
      {
        name: 'Baladi Salad',
        nameAr: 'سلطة بلدي',
        description: 'Contains tomatoes, cucumber, lettuce, onions and hadoota dressing',
        price: 30,
        category: 'Salads',
        branches: ['SZR', 'IBN'],
        preparationStation: 'kitchen'
      },
      {
        name: 'Fatoush',
        nameAr: 'فتوش',
        description: 'A vibrant middle eastern salad that contains tomatoes, cucumbers, radishes, toasted pita bread, and a zesty sumac dressing',
        price: 30,
        category: 'Salads',
        branches: ['SZR', 'IBN'],
        preparationStation: 'kitchen'
      },
      {
        name: 'Taboula Salad',
        nameAr: 'تبولة',
        description: 'A delightful combination of finely chopped parsley, tomatoes, onions, mint, bulgur wheat, tossed with olive oil and lemon juice',
        price: 30,
        category: 'Salads',
        branches: ['SZR', 'IBN'],
        preparationStation: 'kitchen'
      },
      {
        name: 'Rocca Salad',
        nameAr: 'سلطة جرجير',
        description: 'Contains rocca, olives, tomatoes, parmesan cheese, balsamic vinegar, pomegranate molasses',
        price: 30,
        category: 'Salads',
        branches: ['SZR', 'IBN'],
        preparationStation: 'kitchen'
      },
      {
        name: 'Eggplant Salad',
        nameAr: 'سلطة باذنجان',
        description: 'Fresh eggplant salad',
        price: 35,
        category: 'Salads',
        branches: ['SZR', 'IBN'],
        preparationStation: 'kitchen'
      },
      {
        name: 'Rocca & Feta with Watermelon',
        nameAr: 'جرجير وفيتا بالبطيخ',
        description: 'Cubes of ripe watermelon are paired with feta cheese',
        price: 35,
        category: 'Salads',
        branches: ['SZR', 'IBN'],
        preparationStation: 'kitchen'
      },
      {
        name: 'Rocca Salad with Beetroot & Feta Cheese',
        nameAr: 'سلطة جرجير بالشمندر والفيتا',
        description: 'Contains rocca, beetroot, feta cheese and a vinegrette dressing',
        price: 38,
        category: 'Salads',
        branches: ['SZR', 'IBN'],
        preparationStation: 'kitchen'
      },
      {
        name: 'Rocca Salad with Chicken',
        nameAr: 'سلطة جرجير بالدجاج',
        description: 'Contains rocca, olives, tomatoes, parmesan cheese, balsamic vinegar, pomegranate molasses, with slices of grilled chicken breasts. Add avocado - 15 AED',
        price: 50,
        category: 'Salads',
        branches: ['SZR', 'IBN'],
        preparationStation: 'kitchen'
      },

      // ========== COLD APPETIZERS ==========
      {
        name: 'Hadoota Appetizers Platter',
        nameAr: 'طبق مقبلات حدوتة',
        description: 'A selection of hadoota\'s finest appetizers, featuring tangy pickled lemons, zesty spicy hummus, baba ghanouj, yoghurt with beetroot and feta cheese',
        price: 45,
        category: 'Appetizers',
        subcategory: 'Cold Appetizers',
        branches: ['SZR', 'IBN'],
        preparationStation: 'kitchen'
      },
      {
        name: 'Hummus Trio',
        nameAr: 'تريو حمص',
        description: 'A selection of classic hummus, spicy hummus, and avocado hummus',
        price: 30,
        category: 'Appetizers',
        subcategory: 'Cold Appetizers',
        branches: ['SZR', 'IBN'],
        preparationStation: 'kitchen'
      },
      {
        name: 'Hummus with Pastrami',
        nameAr: 'حمص بالبسطرمة',
        description: 'Creamy hummus topped with fried pastrami slices',
        price: 35,
        category: 'Appetizers',
        subcategory: 'Cold Appetizers',
        branches: ['SZR', 'IBN'],
        preparationStation: 'kitchen'
      },
      {
        name: 'Hummus with Pickled Lemon',
        nameAr: 'حمص بالليمون المخلل',
        description: 'Creamy hummus with pickled lemon',
        price: 35,
        category: 'Appetizers',
        subcategory: 'Cold Appetizers',
        branches: ['SZR', 'IBN'],
        preparationStation: 'kitchen'
      },
      {
        name: 'Hummus with Avocado',
        nameAr: 'حمص بالأفوكادو',
        description: 'Creamy hummus with smooth mashed avocado',
        price: 35,
        category: 'Appetizers',
        subcategory: 'Cold Appetizers',
        branches: ['SZR', 'IBN'],
        preparationStation: 'kitchen'
      },
      {
        name: 'Spicy Hummus',
        nameAr: 'حمص حار',
        description: 'A spicy variation of the traditional hummus',
        price: 30,
        category: 'Appetizers',
        subcategory: 'Cold Appetizers',
        branches: ['SZR', 'IBN'],
        preparationStation: 'kitchen'
      },
      {
        name: 'Hummus',
        nameAr: 'حمص',
        description: 'Cooked & mashed chickpeas, blended with tahini, olive oil, lemon juice, garlic, and various spices',
        price: 30,
        category: 'Appetizers',
        subcategory: 'Cold Appetizers',
        branches: ['SZR', 'IBN'],
        preparationStation: 'kitchen'
      },
      {
        name: 'Baba Ghanoug',
        nameAr: 'بابا غنوج',
        description: 'Roasted mashed eggplant mixed with tahini & spices',
        price: 30,
        category: 'Appetizers',
        subcategory: 'Cold Appetizers',
        branches: ['SZR', 'IBN'],
        preparationStation: 'kitchen'
      },
      {
        name: 'Yoghurt with Beetroot',
        nameAr: 'زبادي بالشمندر',
        description: 'Fresh yoghurt mixed with beetroot',
        price: 30,
        category: 'Appetizers',
        subcategory: 'Cold Appetizers',
        branches: ['SZR', 'IBN'],
        preparationStation: 'kitchen'
      },
      {
        name: 'Feta Cheese with Tomatoes',
        nameAr: 'جبنة فيتا بالطماطم',
        description: 'Feta cheese, tomatoes, mint & olive oil',
        price: 30,
        category: 'Appetizers',
        subcategory: 'Cold Appetizers',
        branches: ['SZR', 'IBN'],
        preparationStation: 'kitchen'
      },
      {
        name: 'Besara',
        nameAr: 'بصارة',
        description: 'A mixture of beans and vegetables, cooked, seasoned and mashed',
        price: 30,
        category: 'Appetizers',
        subcategory: 'Cold Appetizers',
        branches: ['SZR', 'IBN'],
        preparationStation: 'kitchen'
      },
      {
        name: 'Keshk',
        nameAr: 'كشك',
        description: 'A mix of cooked yogurt & flour, topped with fried onion',
        price: 30,
        category: 'Appetizers',
        subcategory: 'Cold Appetizers',
        branches: ['SZR', 'IBN'],
        preparationStation: 'kitchen'
      },
      {
        name: 'Tomato Slices with Feta Cheese',
        nameAr: 'شرائح طماطم بالفيتا',
        description: 'Freshly sliced tomatoes layered with crumbled feta cheese and with a drizzle of olive oil',
        price: 22,
        category: 'Appetizers',
        subcategory: 'Cold Appetizers',
        branches: ['SZR', 'IBN'],
        preparationStation: 'kitchen'
      },
      {
        name: 'Tomato & Eggplant with Garlic & Vinegar',
        nameAr: 'طماطم وباذنجان بالثوم والخل',
        description: 'Eggplant & tomato slices, topped with garlic and vinegar dressing',
        price: 28,
        category: 'Appetizers',
        subcategory: 'Cold Appetizers',
        branches: ['SZR', 'IBN'],
        preparationStation: 'kitchen'
      },
      {
        name: 'Eggplant with Garlic & Vinegar',
        nameAr: 'باذنجان بالثوم والخل',
        description: 'Fried eggplant slices, topped with garlic and vinegar dressing',
        price: 28,
        category: 'Appetizers',
        subcategory: 'Cold Appetizers',
        branches: ['SZR', 'IBN'],
        preparationStation: 'kitchen'
      },
      {
        name: 'Tomato with Garlic & Vinegar',
        nameAr: 'طماطم بالثوم والخل',
        description: 'Tomato slices, topped with garlic and vinegar dressing',
        price: 28,
        category: 'Appetizers',
        subcategory: 'Cold Appetizers',
        branches: ['SZR', 'IBN'],
        preparationStation: 'kitchen'
      },
      {
        name: 'Eggplant Fatta',
        nameAr: 'فتة باذنجان',
        description: 'Contains fried eggplant pieces, yogurt, tahini, roasted almonds',
        price: 38,
        category: 'Appetizers',
        subcategory: 'Cold Appetizers',
        branches: ['SZR', 'IBN'],
        preparationStation: 'kitchen'
      },
      {
        name: 'Tahini',
        nameAr: 'طحينة',
        description: 'Lemon & cumin seasoned ground sesame seeds paste',
        price: 28,
        category: 'Appetizers',
        subcategory: 'Cold Appetizers',
        branches: ['SZR', 'IBN'],
        preparationStation: 'kitchen'
      },
      {
        name: 'Yoghurt with Cucumbers',
        nameAr: 'زبادي بالخيار',
        description: 'Yoghurt, cucumber, mint and garlic',
        price: 20,
        category: 'Appetizers',
        subcategory: 'Cold Appetizers',
        branches: ['SZR', 'IBN'],
        preparationStation: 'kitchen'
      },
      {
        name: 'Tomeya',
        nameAr: 'ثومية',
        description: 'Garlic paste',
        price: 25,
        category: 'Appetizers',
        subcategory: 'Cold Appetizers',
        branches: ['SZR', 'IBN'],
        preparationStation: 'kitchen'
      },
      {
        name: 'Pickled Lemon Paste',
        nameAr: 'معجون ليمون مخلل',
        description: 'Pickled lemon paste',
        price: 25,
        category: 'Appetizers',
        subcategory: 'Cold Appetizers',
        branches: ['SZR', 'IBN'],
        preparationStation: 'kitchen'
      },
      {
        name: 'Mesh Cheese',
        nameAr: 'جبنة مش',
        description: 'Aged traditional salty cheese',
        price: 28,
        category: 'Appetizers',
        subcategory: 'Cold Appetizers',
        branches: ['SZR', 'IBN'],
        preparationStation: 'kitchen'
      },
      {
        name: 'Pickled Lemon Whole',
        nameAr: 'ليمون مخلل كامل',
        description: 'Whole pickled lemon',
        price: 15,
        category: 'Appetizers',
        subcategory: 'Cold Appetizers',
        branches: ['SZR', 'IBN'],
        preparationStation: 'kitchen'
      },
      {
        name: 'Mixed Pickles',
        nameAr: 'مخلل مشكل',
        description: 'Assorted pickles',
        price: 10,
        category: 'Appetizers',
        subcategory: 'Cold Appetizers',
        branches: ['SZR', 'IBN'],
        preparationStation: 'kitchen'
      },

      // ========== HOT APPETIZERS ==========
      {
        name: 'Samboosa Meat or Mixed Cheese',
        nameAr: 'سمبوسة لحم أو جبن',
        description: 'Crispy on the outside with delicious fillings: seasoned minced meat or rich cheese mix',
        price: 35,
        category: 'Appetizers',
        subcategory: 'Hot Appetizers',
        branches: ['SZR', 'IBN'],
        preparationStation: 'kitchen'
      },
      {
        name: 'Cheese Pastrami Rolls',
        nameAr: 'رولات جبن وبسطرمة',
        description: 'Crispy on the outside with delicious filling of cheese & pastrami',
        price: 28,
        category: 'Appetizers',
        subcategory: 'Hot Appetizers',
        branches: ['SZR', 'IBN'],
        preparationStation: 'kitchen'
      },
      {
        name: 'Roqaq W Minced Meat',
        nameAr: 'رقاق باللحم المفروم',
        description: 'Layers of delicate pastry dough & minced meat',
        price: 55,
        category: 'Appetizers',
        subcategory: 'Hot Appetizers',
        branches: ['SZR', 'IBN'],
        preparationStation: 'kitchen'
      },
      {
        name: 'Small Hawawshi',
        nameAr: 'حواوشي صغير',
        description: 'One loaf served with your choice of 1 side order',
        price: 35,
        category: 'Appetizers',
        subcategory: 'Hot Appetizers',
        branches: ['SZR', 'IBN'],
        preparationStation: 'kitchen'
      },
      {
        name: 'Alexandrian Sausages',
        nameAr: 'سجق إسكندراني',
        description: 'With spices on the alexandrian way',
        price: 43,
        category: 'Appetizers',
        subcategory: 'Hot Appetizers',
        branches: ['SZR', 'IBN'],
        preparationStation: 'kitchen'
      },
      {
        name: 'Hadoota Sausages',
        nameAr: 'سجق حدوتة',
        description: 'Sizzling sausages with tomato slices, peppers and tomato sauce',
        price: 43,
        category: 'Appetizers',
        subcategory: 'Hot Appetizers',
        branches: ['SZR', 'IBN'],
        preparationStation: 'kitchen'
      },
      {
        name: 'Alexandrian Liver (Beef)',
        nameAr: 'كبدة إسكندراني',
        description: 'Beef liver with green pepper and garlic',
        price: 35,
        category: 'Appetizers',
        subcategory: 'Hot Appetizers',
        branches: ['SZR', 'IBN'],
        preparationStation: 'kitchen'
      },
      {
        name: 'Chicken Liver',
        nameAr: 'كبدة فراخ',
        description: 'Egyptian spiced chicken liver. Pomegranate molasses can be added to your preference',
        price: 30,
        category: 'Appetizers',
        subcategory: 'Hot Appetizers',
        branches: ['SZR', 'IBN'],
        preparationStation: 'kitchen'
      },
      {
        name: 'Spicy Potatoes',
        nameAr: 'بطاطس حارة',
        description: 'Spicy coriander & garlic potatoes served with spicy sauce',
        price: 25,
        category: 'Appetizers',
        subcategory: 'Hot Appetizers',
        branches: ['SZR', 'IBN'],
        preparationStation: 'kitchen'
      },
      {
        name: 'Fried Sweet Potatoes',
        nameAr: 'بطاطا حلوة مقلية',
        description: 'Strips of sweet potatoes deep-fried until crispy and golden',
        price: 20,
        category: 'Appetizers',
        subcategory: 'Hot Appetizers',
        branches: ['SZR', 'IBN'],
        preparationStation: 'kitchen'
      },

      // ========== LIGHT SNACKS (IBN ONLY) ==========
      {
        name: 'Termes',
        nameAr: 'ترمس',
        description: 'Traditional Egyptian lupini beans',
        price: 15,
        category: 'Appetizers',
        subcategory: 'Light Snacks',
        branches: ['IBN'],
        preparationStation: 'kitchen'
      },
      {
        name: 'Halabesa',
        nameAr: 'حلبسة',
        description: 'Traditional Egyptian chickpea snack',
        price: 20,
        category: 'Appetizers',
        subcategory: 'Light Snacks',
        branches: ['IBN'],
        preparationStation: 'kitchen'
      },
    ];

    // Part 1 of data inserted
    console.log('Inserting menu items (Part 1: Breakfast, Lunch, Soups, Salads, Appetizers)...\n');

    let insertedCount = 0;

    for (const item of menuItemsData) {
      const categoryId = item.subcategory
        ? getCategoryId(item.subcategory, item.category)
        : getCategoryId(item.category);

      if (!categoryId) {
        console.warn(`⚠ Category not found for: ${item.name} (${item.category}${item.subcategory ? ` > ${item.subcategory}` : ''})`);
        continue;
      }

      // Insert menu item (handle both old and new schema columns)
      const priceInFils = Math.round(item.price * 100);
      const [insertedItem] = await db.insert(menuItems).values({
        name: item.name,
        nameAr: item.nameAr,
        description: item.description,
        descriptionAr: '', // Can be added later
        // New schema
        categoryId: categoryId,
        basePrice: priceInFils,
        // Old schema (still required as NOT NULL)
        price: priceInFils as any,
        category: (item.subcategory || item.category) as any,
        // Common fields
        preparationStation: item.preparationStation || 'kitchen',
        isActive: true,
        isAvailable: true,
        isFeatured: false,
        sortOrder: 0
      }).returning();

      // Set up branch availability
      for (const branchCode of item.branches) {
        const branch = branchCode === 'SZR' ? szrBranch : ibnBranch;
        await db.insert(menuItemBranches).values({
          menuItemId: insertedItem.id,
          branchId: branch.id,
          isAvailable: true
        });
      }

      insertedCount++;
      if (insertedCount % 10 === 0) {
        console.log(`  ✓ Inserted ${insertedCount} items...`);
      }
    }

    console.log(`\n✓ Part 1 complete! Inserted ${insertedCount} items.\n`);
    console.log('⚠ This is Part 1. Need to create Part 2 for remaining categories:');
    console.log('  - Feteer (Savory, Sweet, Meshaltet)');
    console.log('  - Main Courses (all subcategories)');
    console.log('  - Grills');
    console.log('  - Kids Meals');
    console.log('  - Side Orders');
    console.log('  - Desserts');
    console.log('  - Beverages (all subcategories)');
    console.log('  - Shisha\n');

  } catch (error) {
    console.error('Error importing menu items:', error);
  } finally {
    process.exit(0);
  }
}

importMenuItems();
