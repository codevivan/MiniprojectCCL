import { menuRepo } from '../repositories/menuRepo.js';
import { settingsRepo } from '../repositories/settingsRepo.js';
import { userRepo } from '../repositories/userRepo.js';
import bcrypt from 'bcryptjs';

const SEED_MENU_ITEMS = [
  // BREAKFAST
  {
    itemId: 'item_bf_poha',
    name: 'Poha',
    description: 'Steamed flattened rice cooked with onions, mustard seeds, green chilies, roasted peanuts, and fresh coriander.',
    category: 'BREAKFAST',
    price: 35,
    imageUrl: '/images/food/poha.jpg',
    isAvailable: true,
    prepTimeMinutes: 5
  },
  {
    itemId: 'item_bf_upma',
    name: 'Upma',
    description: 'Traditional semolina porridge tempered with curry leaves, cashews, ginger, and mustard seeds.',
    category: 'BREAKFAST',
    price: 35,
    imageUrl: '/images/food/upma.jpg',
    isAvailable: true,
    prepTimeMinutes: 7
  },
  {
    itemId: 'item_bf_idli',
    name: 'Idli (2 pcs)',
    description: 'Puffy steamed rice cakes served hot with authentic coconut chutney and flavorful sambar.',
    category: 'BREAKFAST',
    price: 40,
    imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80',
    isAvailable: true,
    prepTimeMinutes: 6
  },
  {
    itemId: 'item_bf_dosa',
    name: 'Masala Dosa',
    description: 'Crispy golden crepe stuffed with spiced potato mash, served with tangy sambar and fresh coconut chutney.',
    category: 'BREAKFAST',
    price: 60,
    imageUrl: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=600&q=80',
    isAvailable: true,
    prepTimeMinutes: 12
  },
  {
    itemId: 'item_bf_vada',
    name: 'Medu Vada (2 pcs)',
    description: 'Crisp golden lentil fritters spiced with black peppercorns and curry leaves, served with sambar.',
    category: 'BREAKFAST',
    price: 45,
    imageUrl: '/images/food/medu_vada.jpg',
    isAvailable: true,
    prepTimeMinutes: 8
  },

  // LUNCH
  {
    itemId: 'item_lu_thali',
    name: 'Veg Thali',
    description: 'Complete wholesome meal with 3 Chapatis, Dal Fry, Paneer Sabzi, Jeera Rice, Salad, and Pickle.',
    category: 'LUNCH',
    price: 110,
    imageUrl: 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?auto=format&fit=crop&w=600&q=80',
    isAvailable: true,
    prepTimeMinutes: 15
  },
  {
    itemId: 'item_lu_paneer_rice',
    name: 'Paneer Rice',
    description: 'Fragrant basmati rice tossed with marinated cottage cheese cubes, bell peppers, and mild aromatic spices.',
    category: 'LUNCH',
    price: 90,
    imageUrl: '/images/food/paneer_rice.jpg',
    isAvailable: true,
    prepTimeMinutes: 12
  },
  {
    itemId: 'item_lu_pulao',
    name: 'Veg Pulao',
    description: 'Aromatic basmati rice cooked with fresh seasonal vegetables, bay leaves, and desi ghee.',
    category: 'LUNCH',
    price: 75,
    imageUrl: '/images/food/veg_pulao.jpg',
    isAvailable: true,
    prepTimeMinutes: 10
  },
  {
    itemId: 'item_lu_dal_rice',
    name: 'Dal Rice',
    description: 'Comforting yellow toor dal tempered with cumin, garlic, and ghee, served with steamed basmati rice.',
    category: 'LUNCH',
    price: 65,
    imageUrl: '/images/food/dal_rice.jpg',
    isAvailable: true,
    prepTimeMinutes: 8
  },
  {
    itemId: 'item_lu_chapati_bhaji',
    name: 'Chapati Bhaji',
    description: '3 soft whole wheat chapatis served with hearty homestyle mixed vegetable bhaji and onion salad.',
    category: 'LUNCH',
    price: 70,
    imageUrl: '/images/food/chapati_bhaji.jpg',
    isAvailable: true,
    prepTimeMinutes: 10
  },

  // FAST FOOD
  {
    itemId: 'item_ff_veg_sandwich',
    name: 'Veg Sandwich',
    description: 'Fresh sandwich bread layered with cucumber, tomato, potato, green mint chutney, and chaat masala.',
    category: 'FAST FOOD',
    price: 45,
    imageUrl: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=600&q=80',
    isAvailable: true,
    prepTimeMinutes: 8
  },
  {
    itemId: 'item_ff_cheese_sandwich',
    name: 'Cheese Sandwich',
    description: 'Grilled sandwich loaded with melted cheddar and mozzarella cheese, spiced potato slice, and butter.',
    category: 'FAST FOOD',
    price: 65,
    imageUrl: '/images/food/cheese_sandwich.jpg',
    isAvailable: true,
    prepTimeMinutes: 10
  },
  {
    itemId: 'item_ff_veg_burger',
    name: 'Veg Burger',
    description: 'Crispy vegetable patty in a toasted sesame bun with lettuce, tomatoes, creamy mayo, and tangy sauce.',
    category: 'FAST FOOD',
    price: 70,
    imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80',
    isAvailable: true,
    prepTimeMinutes: 12
  },
  {
    itemId: 'item_ff_pizza',
    name: 'Margherita Pizza',
    description: 'Personal 7-inch thin crust pizza with rich tomato basil marinara sauce and gooey mozzarella.',
    category: 'FAST FOOD',
    price: 110,
    imageUrl: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=600&q=80',
    isAvailable: true,
    prepTimeMinutes: 15
  },
  {
    itemId: 'item_ff_frankie',
    name: 'Veg Frankie',
    description: 'Mumbai-style spiced potato & vegetable roll wrapped in a flaky flatbread with onions and tangy frankie masala.',
    category: 'FAST FOOD',
    price: 55,
    imageUrl: '/images/food/veg_frankie.jpg',
    isAvailable: true,
    prepTimeMinutes: 9
  },
  {
    itemId: 'item_ea76bd1bb6',
    name: 'Chef Special Paneer Roll',
    description: 'Marinated paneer tikka wrapped in a warm crispy paratha with bell peppers, mint chutney, and spices.',
    category: 'FAST FOOD',
    price: 85,
    imageUrl: '/images/food/paneer_roll.jpg',
    isAvailable: true,
    prepTimeMinutes: 10
  },

  // CHAAT
  {
    itemId: 'item_ch_pani_puri',
    name: 'Pani Puri (6 pcs)',
    description: 'Crispy hollow puris filled with boiled potatoes, chickpeas, spicy mint pani, and sweet tamarind sauce.',
    category: 'CHAAT',
    price: 35,
    imageUrl: '/images/food/pani_puri.jpg',
    isAvailable: true,
    prepTimeMinutes: 5
  },
  {
    itemId: 'item_ch_sev_puri',
    name: 'Sev Puri',
    description: 'Flat papdis topped with potatoes, finely chopped onions, tangy chutneys, and a mountain of crisp sev.',
    category: 'CHAAT',
    price: 45,
    imageUrl: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&w=600&q=80',
    isAvailable: true,
    prepTimeMinutes: 6
  },
  {
    itemId: 'item_ch_bhel_puri',
    name: 'Bhel Puri',
    description: 'Light puffed rice snack mixed with onions, tomatoes, raw mango, peanuts, tangy tamarind & coriander chutney.',
    category: 'CHAAT',
    price: 40,
    imageUrl: '/images/food/bhel_puri.jpg',
    isAvailable: true,
    prepTimeMinutes: 5
  },
  {
    itemId: 'item_ch_dahi_puri',
    name: 'Dahi Puri',
    description: 'Crisp puris stuffed with spiced potatoes, sweet chilled yogurt, date-tamarind chutney, and sprinkled with sev.',
    category: 'CHAAT',
    price: 50,
    imageUrl: '/images/food/dahi_puri.jpg',
    isAvailable: true,
    prepTimeMinutes: 6
  },

  // BEVERAGES
  {
    itemId: 'item_bv_tea',
    name: 'Masala Tea',
    description: 'Freshly brewed strong Indian chai infused with crushed cardamom, ginger, cloves, and milk.',
    category: 'BEVERAGES',
    price: 15,
    imageUrl: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=600&q=80',
    isAvailable: true,
    prepTimeMinutes: 4
  },
  {
    itemId: 'item_bv_coffee',
    name: 'Filter Coffee',
    description: 'Authentic South Indian filter coffee frothed to perfection with rich aroma.',
    category: 'BEVERAGES',
    price: 25,
    imageUrl: '/images/food/filter_coffee.jpg',
    isAvailable: true,
    prepTimeMinutes: 5
  },
  {
    itemId: 'item_bv_cold_coffee',
    name: 'Cold Coffee',
    description: 'Thick creamy blended cold coffee served chilled with chocolate drizzle.',
    category: 'BEVERAGES',
    price: 50,
    imageUrl: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=600&q=80',
    isAvailable: true,
    prepTimeMinutes: 5
  },
  {
    itemId: 'item_bv_lime_soda',
    name: 'Fresh Lime Soda',
    description: 'Refreshing sparkling soda squeezed with fresh lime juice, choice of sweet or salted.',
    category: 'BEVERAGES',
    price: 30,
    imageUrl: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80',
    isAvailable: true,
    prepTimeMinutes: 3
  },
  {
    itemId: 'item_bv_buttermilk',
    name: 'Spiced Buttermilk (Chaas)',
    description: 'Cooling churned curd drink spiced with roasted cumin, green chili, rock salt, and coriander.',
    category: 'BEVERAGES',
    price: 25,
    imageUrl: '/images/food/chaas.jpg',
    isAvailable: true,
    prepTimeMinutes: 3
  },
  {
    itemId: 'item_bv_mango_lassi',
    name: 'Mango Lassi',
    description: 'Thick sweet yogurt smoothie blended with ripe Alphonso mango pulp and a pinch of cardamom.',
    category: 'BEVERAGES',
    price: 55,
    imageUrl: '/images/food/mango_lassi.jpg',
    isAvailable: true,
    prepTimeMinutes: 5
  },

  // DESSERTS
  {
    itemId: 'item_ds_brownie',
    name: 'Chocolate Brownie',
    description: 'Warm, gooey dark chocolate fudge brownie with a crusty top.',
    category: 'DESSERTS',
    price: 60,
    imageUrl: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=600&q=80',
    isAvailable: true,
    prepTimeMinutes: 4
  },
  {
    itemId: 'item_ds_ice_cream',
    name: 'Vanilla Ice Cream Scoop',
    description: 'Two scoops of rich Madagascar vanilla bean ice cream topped with chocolate chips.',
    category: 'DESSERTS',
    price: 45,
    imageUrl: 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?auto=format&fit=crop&w=600&q=80',
    isAvailable: true,
    prepTimeMinutes: 3
  },
  {
    itemId: 'item_ds_choc_pastry',
    name: 'Chocolate Pastry',
    description: 'Decadent multi-layered chocolate sponge pastry smothered in rich chocolate ganache.',
    category: 'DESSERTS',
    price: 55,
    imageUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80',
    isAvailable: true,
    prepTimeMinutes: 3
  }
];

export async function runSeed() {
  console.log('--- Starting CampusBite Seed Script ---');

  // 1. Seed or Update Menu Items
  let inserted = 0;
  let updated = 0;
  for (const item of SEED_MENU_ITEMS) {
    const existing = await menuRepo.getById(item.itemId);
    if (!existing) {
      await menuRepo.create(item);
      inserted++;
    } else {
      await menuRepo.update(item.itemId, item);
      updated++;
    }
  }
  console.log(`[Seed] Menu items synchronized: ${inserted} new items, ${updated} items updated with exact images (${SEED_MENU_ITEMS.length} total).`);

  // 2. Seed Default Canteen Settings
  await settingsRepo.getSettings();
  console.log('[Seed] Canteen operational settings initialized.');

  // 3. Check Owner Status (Never overwrite existing Owner!)
  const ownerCount = await userRepo.getOwnerCount();
  if (ownerCount === 0) {
    console.log('[Seed] No Owner account found. First-time owner setup is enabled at /owner/setup.');
  } else {
    console.log('[Seed] Master Owner account already exists. Security policy preserved.');
  }

  console.log('--- Seed Script Finished Successfully ---');
}

// Auto-run if executed directly
if (process.argv[1]?.endsWith('seedData.js')) {
  runSeed().then(() => process.exit(0)).catch(err => {
    console.error('Seed script error:', err);
    process.exit(1);
  });
}
