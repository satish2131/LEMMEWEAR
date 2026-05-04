const fs = require('fs');

let content = fs.readFileSync('src/data/products.ts', 'utf8');

// A simple regex to add "Oversized T-Shirts" to the styles array of any product that mentions "oversized" (case insensitive)
let changed = false;

// We will split by "export const" to process the arrays, but it's easier to just do it via API for the db
// Wait, I should just write a script that updates the MongoDB directly using mongoose!
const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://lemmewear:lemmewear@cluster0.p2hzh.mongodb.net/lemmewear?retryWrites=true&w=majority&appName=Cluster0')
  .then(async () => {
    const Product = mongoose.models.Product || mongoose.model('Product', new mongoose.Schema({ styles: [String] }, { strict: false }));
    
    // Find all products that match oversized in name, subtitle, or description
    const oversizedProducts = await Product.find({
      $or: [
        { name: /oversize/i },
        { subtitle: /oversize/i },
        { description: /oversize/i }
      ]
    });

    for (const p of oversizedProducts) {
      if (!p.styles) p.styles = [];
      if (!p.styles.includes('Oversized T-Shirts')) {
        p.styles.push('Oversized T-Shirts');
        await p.save();
        console.log(`Updated styles for ${p.name}`);
        changed = true;
      }
    }
    
    if (!changed) console.log('No products needed updating in DB.');
    process.exit(0);
  })
  .catch(err => {
    console.error('DB Error:', err);
    process.exit(1);
  });
