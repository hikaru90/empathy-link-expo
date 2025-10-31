/**
 * Script to fetch needs data from PocketBase and save it to a TypeScript file
 * Run with: node scripts/fetch-needs-from-pocketbase.js
 */

const PocketBase = require('pocketbase');
const fs = require('fs');
const path = require('path');

// PocketBase connection
const pb = new PocketBase('https://pbempathy.clustercluster.de');

async function fetchNeeds() {
  try {
    console.log('Connecting to PocketBase...');

    // Authenticate as admin
    await pb.admins.authWithPassword('alexbueckner@gmail.com', 'Dif6rix43alex4n!2');
    console.log('Authenticated successfully!');

    // Fetch all needs
    console.log('Fetching needs from PocketBase...');
    const records = await pb.collection('needs').getFullList({
      sort: 'category,sort'
    });

    console.log(`Fetched ${records.length} needs`);

    // Transform to match the required format
    const needs = records.map(record => ({
      id: record.id,
      nameDE: record.nameDE,
      nameEN: record.nameEN,
      category: record.category,
      sort: record.sort || 0
    }));

    // Generate TypeScript file content
    const tsContent = `/**
 * Needs data fetched from PocketBase
 * Generated on: ${new Date().toISOString()}
 */

export interface Need {
  id: string;
  nameDE: string;
  nameEN: string;
  category: string;
  sort: number;
}

export const needsData: Need[] = ${JSON.stringify(needs, null, 2)};
`;

    // Write to backend data file
    const outputPath = path.join(__dirname, '../../empathy-link-backend/src/lib/data/needs.ts');
    fs.writeFileSync(outputPath, tsContent, 'utf-8');

    console.log(`✓ Needs data written to: ${outputPath}`);
    console.log(`✓ Total needs: ${needs.length}`);

    // Show categories
    const categories = [...new Set(needs.map(n => n.category))];
    console.log(`✓ Categories (${categories.length}):`, categories);

  } catch (error) {
    console.error('Error fetching needs:', error);
    process.exit(1);
  }
}

fetchNeeds();
