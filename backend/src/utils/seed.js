/**
 * Seed script — populates MongoDB Atlas with demo data.
 * Usage: npm run seed
 *
 * ⚠️  This CLEARS existing Users, MenuItems, and Inventory before seeding.
 *     Orders are not cleared.
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') })

const mongoose  = require('mongoose')
const User      = require('../models/User')
const MenuItem  = require('../models/MenuItem')
const Inventory = require('../models/Inventory')

// ── Demo users ────────────────────────────────────────────
const USERS = [
  { name: 'Arjun Sharma',    email: 'student@college.edu',  password: 'demo1234', role: 'customer' },
  { name: 'Chef Ravi Kumar', email: 'chef@college.edu',     password: 'demo1234', role: 'chef'     },
  { name: 'Pickup Staff',    email: 'pickup@college.edu',   password: 'demo1234', role: 'pickup'   },
  { name: 'Admin User',      email: 'admin@college.edu',    password: 'demo1234', role: 'admin'    },
]

// ── Menu items (17 items across 6 categories) ─────────────
const MENU_ITEMS = [
  // Breakfast
  { name: 'Masala Dosa',        category: 'Breakfast', price: 45,  preparationTime: 8,  available: true,  description: 'Crispy rice crepe with spiced potato filling and chutneys', image: 'https://images.unsplash.com/photo-1630383249896-424e482df921?w=400&q=80' },
  { name: 'Idli Sambar (3pcs)', category: 'Breakfast', price: 35,  preparationTime: 5,  available: true,  description: 'Steamed rice cakes served with sambar and coconut chutney',  image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&q=80' },
  { name: 'Poha',               category: 'Breakfast', price: 25,  preparationTime: 5,  available: true,  description: 'Flattened rice with onions, mustard seeds and curry leaves',   image: 'https://images.unsplash.com/photo-1567337710282-00832b415979?w=400&q=80' },
  // Snacks
  { name: 'Samosa (2pcs)',      category: 'Snacks',    price: 20,  preparationTime: 3,  available: true,  description: 'Crispy pastry filled with spiced potatoes and peas',            image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&q=80' },
  { name: 'Bread Pakora',       category: 'Snacks',    price: 25,  preparationTime: 4,  available: true,  description: 'Bread stuffed with potato filling, deep fried in batter',      image: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=400&q=80' },
  { name: 'Paneer Roll',        category: 'Snacks',    price: 50,  preparationTime: 7,  available: true,  description: 'Whole wheat wrap with paneer tikka, onions and chutney',        image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&q=80' },
  // Lunch
  { name: 'Veg Biryani',        category: 'Lunch',     price: 80,  preparationTime: 15, available: true,  description: 'Fragrant basmati rice with mixed vegetables and whole spices',  image: 'https://images.unsplash.com/photo-1563379091339-03246963d96d?w=400&q=80' },
  { name: 'Dal Rice',           category: 'Lunch',     price: 60,  preparationTime: 10, available: true,  description: 'Yellow dal with steamed rice, pickle and papad',                image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&q=80' },
  { name: 'Rajma Chawal',       category: 'Lunch',     price: 70,  preparationTime: 10, available: true,  description: 'Kidney bean curry served with steamed rice',                    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&q=80' },
  { name: 'Chole Bhature',      category: 'Lunch',     price: 75,  preparationTime: 12, available: true,  description: 'Spiced chickpeas with fluffy deep-fried bread',                 image: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=400&q=80' },
  // Dinner
  { name: 'Paneer Butter Masala', category:'Dinner',   price: 100, preparationTime: 15, available: true,  description: 'Creamy tomato-based paneer curry with butter naan',             image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&q=80' },
  { name: 'Veg Thali',          category: 'Dinner',    price: 120, preparationTime: 20, available: false, description: 'Complete meal — dal, sabzi, rice, roti, salad and dessert',    image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&q=80' },
  // Beverages
  { name: 'Chai',               category: 'Beverages', price: 15,  preparationTime: 3,  available: true,  description: 'Masala chai made with ginger, cardamom and milk',               image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&q=80' },
  { name: 'Cold Coffee',        category: 'Beverages', price: 40,  preparationTime: 4,  available: true,  description: 'Chilled coffee with milk and ice cream',                        image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&q=80' },
  { name: 'Fresh Lime Soda',    category: 'Beverages', price: 30,  preparationTime: 2,  available: true,  description: 'Fresh lemon juice with soda, sweet or salted',                  image: 'https://images.unsplash.com/photo-1622597467836-f3e6557a4d63?w=400&q=80' },
  // Desserts
  { name: 'Gulab Jamun (2pcs)', category: 'Desserts',  price: 30,  preparationTime: 2,  available: true,  description: 'Soft milk solid balls soaked in rose-flavoured sugar syrup',   image: 'https://images.unsplash.com/photo-1590080876179-3c4e6b8b8c7f?w=400&q=80' },
  { name: 'Kheer',              category: 'Desserts',  price: 35,  preparationTime: 2,  available: false, description: 'Rice pudding with cardamom, saffron and dry fruits',            image: 'https://images.unsplash.com/photo-1563379091339-03246963d96d?w=400&q=80' },
]

// ── Inventory (10 items) ──────────────────────────────────
const INVENTORY = [
  { itemName: 'Rice (kg)',        stock: 50, threshold: 10, unit: 'kg'     },
  { itemName: 'Wheat Flour (kg)', stock: 30, threshold: 8,  unit: 'kg'     },
  { itemName: 'Cooking Oil (L)',  stock: 15, threshold: 5,  unit: 'litres' },
  { itemName: 'Milk (L)',         stock: 20, threshold: 8,  unit: 'litres' },
  { itemName: 'Paneer (kg)',      stock: 5,  threshold: 2,  unit: 'kg'     },
  { itemName: 'Tomatoes (kg)',    stock: 8,  threshold: 3,  unit: 'kg'     },
  { itemName: 'Onions (kg)',      stock: 12, threshold: 4,  unit: 'kg'     },
  { itemName: 'Dal (kg)',         stock: 20, threshold: 5,  unit: 'kg'     },
  { itemName: 'Spice Mix',        stock: 3,  threshold: 2,  unit: 'packets'},
  { itemName: 'Tea Leaves (kg)',  stock: 2,  threshold: 1,  unit: 'kg'     },
]

async function seed() {
  const uri = process.env.MONGO_URI
  if (!uri || uri.includes('<username>')) {
    console.error('\n❌ MONGO_URI not set or still has placeholder values.')
    console.error('   Edit backend/.env and add your real MongoDB Atlas connection string.\n')
    process.exit(1)
  }

  try {
    console.log('\n🌱 Connecting to MongoDB Atlas…')
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 })
    console.log('✅ Connected\n')

    // Clear existing data (not orders)
    const [u, m, i] = await Promise.all([
      User.deleteMany({}),
      MenuItem.deleteMany({}),
      Inventory.deleteMany({}),
    ])
    console.log(`🗑  Cleared: ${u.deletedCount} users, ${m.deletedCount} menu items, ${i.deletedCount} inventory items`)

    // Seed
    const users = await User.create(USERS)
    console.log(`👤 Created ${users.length} users`)

    const items = await MenuItem.create(MENU_ITEMS)
    console.log(`🍔 Created ${items.length} menu items`)

    const inv = await Inventory.create(INVENTORY)
    console.log(`📦 Created ${inv.length} inventory items`)

    console.log('\n🎉 Seed complete!')
    console.log('──────────────────────────────────')
    console.log('Demo login credentials:')
    console.log('  Customer  student@college.edu / demo1234')
    console.log('  Chef      chef@college.edu    / demo1234')
    console.log('  Pickup    pickup@college.edu  / demo1234')
    console.log('  Admin     admin@college.edu   / demo1234')
    console.log('──────────────────────────────────\n')

    await mongoose.connection.close()
    process.exit(0)
  } catch (err) {
    console.error('\n❌ Seed failed:', err.message)
    if (err.message.includes('ECONNREFUSED')) {
      console.error('   Check that your MONGO_URI is correct and your IP is whitelisted in Atlas.')
    }
    process.exit(1)
  }
}

seed()
