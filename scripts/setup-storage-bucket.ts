import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupStorageBucket() {
  try {
    console.log('Setting up Supabase Storage bucket for menu items...\n');

    // Check if bucket already exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();

    if (listError) {
      console.error('Error listing buckets:', listError);
      return;
    }

    const bucketExists = buckets?.some(b => b.name === 'menu-items');

    if (bucketExists) {
      console.log('✓ Bucket "menu-items" already exists');
    } else {
      // Create the bucket
      const { data, error } = await supabase.storage.createBucket('menu-items', {
        public: true,
        fileSizeLimit: 5242880, // 5MB in bytes
      });

      if (error) {
        console.error('Error creating bucket:', error);
        return;
      }

      console.log('✓ Created public bucket "menu-items"');
    }

    console.log('\nBucket configuration:');
    console.log('  - Name: menu-items');
    console.log('  - Public: Yes');
    console.log('  - Max file size: 5MB');
    console.log('\n✅ Storage bucket setup complete!');

  } catch (error) {
    console.error('Setup failed:', error);
  } finally {
    process.exit(0);
  }
}

setupStorageBucket();
