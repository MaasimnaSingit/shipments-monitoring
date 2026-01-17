const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Manually read .env.local since dotenv might not be installed
try {
  const envConfig = fs.readFileSync('.env.local', 'utf8');
  envConfig.split(/\r?\n/).forEach(line => {
    const [key, val] = line.split('=');
    if (key && val) {
      process.env[key.trim()] = val.trim();
    }
  });
} catch (e) {
  console.log('Could not read .env.local');
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrate() {
  console.log('🚀 Starting migration of VIPs to Supabase...');

  // 1. Read local JSON
  const jsonPath = path.join(__dirname, 'lib/vip-structure.json');
  const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

  let totalCount = 0;
  let successCount = 0;
  let failCount = 0;

  for (const branch of jsonData.branches) {
    const branchName = branch.name;
    console.log(`\nProcessing branch: ${branchName} (${branch.vips.length} VIPs)`);

    for (const vip of branch.vips) {
      totalCount++;
      const payload = {
        branch_name: branchName,
        vip_code: vip.code,
        vip_name: vip.name
      };

      const { error } = await supabase
        .from('vip_clients')
        .upsert(payload, { onConflict: 'branch_name,vip_code' });

      if (error) {
        console.error(`  ❌ Failed: ${vip.code} (${vip.name}) - ${error.message}`);
        failCount++;
      } else {
        process.stdout.write('.'); // Progress dot
        successCount++;
      }
    }
  }

  console.log('\n\n========================================');
  console.log(`Migration Complete!`);
  console.log(`Total: ${totalCount}`);
  console.log(`✅ Success: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log('========================================');
}

migrate();
