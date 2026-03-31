'use strict';

const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'inventory.db');

function initDatabase() {
  const db = new Database(DB_PATH);

  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      sku TEXT UNIQUE NOT NULL,
      price REAL NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 0,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TRIGGER IF NOT EXISTS update_timestamp
    AFTER UPDATE ON products
    FOR EACH ROW
    BEGIN
      UPDATE products SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
    END;
  `);

  const count = db.prepare('SELECT COUNT(*) as cnt FROM products').get();
  if (count.cnt === 0) {
    const insert = db.prepare(`
      INSERT INTO products (name, category, sku, price, quantity, description)
      VALUES (@name, @category, @sku, @price, @quantity, @description)
    `);

    const seedData = [
      { name: 'Marine GPS Chartplotter 7"', category: 'Navigation & Electronics', sku: 'NAV-001', price: 549.00, quantity: 12, description: 'Touchscreen, built-in charts, WiFi & Bluetooth' },
      { name: 'VHF Marine Radio Handheld', category: 'Navigation & Electronics', sku: 'NAV-002', price: 149.99, quantity: 24, description: 'Waterproof IPX7, DSC, 6W output, float-free' },
      { name: 'Marine Compass Bulkhead', category: 'Navigation & Electronics', sku: 'NAV-003', price: 89.99, quantity: 18, description: 'Gimballed, compensatable, 3.5" card, SS bezel' },
      { name: 'Adult Life Jacket / PFD 150N', category: 'Safety & Emergency', sku: 'SAF-001', price: 79.99, quantity: 35, description: 'ISO 12402-3, auto-inflate, harness compatible' },
      { name: 'SOLAS Flare Kit 4-piece', category: 'Safety & Emergency', sku: 'SAF-002', price: 64.99, quantity: 20, description: 'Parachute, hand flares & smoke, 3-year cert' },
      { name: 'Marine First Aid Kit', category: 'Safety & Emergency', sku: 'SAF-003', price: 49.99, quantity: 28, description: 'Waterproof case, 80-piece, ISAF offshore spec' },
      { name: 'Delta Anchor 10 kg', category: 'Anchoring & Docking', sku: 'ANC-001', price: 189.00, quantity: 9, description: 'Hot-dip galvanised steel, suits 8–11 m vessels' },
      { name: 'Anchor Chain 8mm × 15m', category: 'Anchoring & Docking', sku: 'ANC-002', price: 119.00, quantity: 14, description: 'G4 calibrated, hot-dip galvanised, shackle incl.' },
      { name: 'Boat Fender Cylindrical 200mm × 600mm', category: 'Anchoring & Docking', sku: 'ANC-003', price: 34.99, quantity: 60, description: 'PVC, UV-stabilised, adjustable rope, white' },
      { name: 'Dock Line 14mm × 8m', category: 'Anchoring & Docking', sku: 'ANC-004', price: 27.99, quantity: 48, description: 'Double-braid nylon, pre-spliced eye, blue' },
      { name: 'Stainless Steel Cleat 200mm', category: 'Deck Hardware', sku: 'DH-001', price: 22.99, quantity: 55, description: 'Marine grade 316 SS, through-deck base, pair' },
      { name: 'Folding Boat Ladder 3-step', category: 'Deck Hardware', sku: 'DH-002', price: 109.99, quantity: 17, description: '316 SS, anti-slip treads, transom mount' },
      { name: 'Stainless Bow Roller 316', category: 'Deck Hardware', sku: 'DH-003', price: 58.99, quantity: 22, description: 'For chain & rope, 10–12 mm, heavy-duty cast' },
      { name: 'Bilge Pump Electric 1100 GPH', category: 'Engine & Mechanical', sku: 'ENG-001', price: 54.99, quantity: 30, description: '12 V DC, submersible, float switch incl.' },
      { name: 'Outboard Engine Oil 10W-40 4L', category: 'Engine & Mechanical', sku: 'ENG-002', price: 39.99, quantity: 45, description: 'FC-W certified, semi-synthetic, all 4-stroke OBs' },
      { name: 'Water Pump Impeller Kit', category: 'Engine & Mechanical', sku: 'ENG-003', price: 29.99, quantity: 38, description: 'Neoprene, fits Mercury/Yamaha/Honda 15–60 hp' },
      { name: 'Inline Fuel Filter 3/8"', category: 'Engine & Mechanical', sku: 'ENG-004', price: 14.99, quantity: 65, description: 'Universal outboard, clear bowl, 10-micron' },
      { name: 'LED Navigation Light Set', category: 'Lighting', sku: 'LGT-001', price: 74.99, quantity: 26, description: 'COLREGS compliant, port/starboard/stern, 2NM' },
      { name: 'Anti-Fouling Paint 2.5L Dark Blue', category: 'Maintenance & Care', sku: 'MNT-001', price: 89.99, quantity: 16, description: 'Self-polishing, hard matrix, suitable for GRP & Ali' },
      { name: 'Marine Teak Cleaner & Brightener Kit', category: 'Maintenance & Care', sku: 'MNT-002', price: 34.99, quantity: 33, description: '2-part system, 1L each, restores grey teak' },
    ];

    const insertMany = db.transaction((items) => {
      for (const item of items) insert.run(item);
    });
    insertMany(seedData);
  }

  return db;
}

module.exports = { initDatabase };
