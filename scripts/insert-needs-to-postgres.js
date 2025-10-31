const fs = require('fs');
const { Client } = require('pg');

const data = JSON.parse(fs.readFileSync('/tmp/needs-raw.json', 'utf8'));

const client = new Client({
  connectionString: 'postgres://postgres:VT11qfA5TZ01Jlmuna0NufaTvaFdWYyGLElk3nRHqYpWdweqQCegThsoIk0KrlgH@168.119.110.251:5432/postgres'
});

async function insertNeeds() {
  await client.connect();

  let inserted = 0;
  for (const item of data.items) {
    try {
      await client.query(
        'INSERT INTO needs (id, name_de, name_en, category, sort, created, updated) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())',
        [item.id, item.nameDE, item.nameEN, item.category, item.sort || 0]
      );
      inserted++;
    } catch (error) {
      if (error.code !== '23505') { // Ignore duplicate key errors
        console.error('Error inserting:', item.nameDE, error.message);
      }
    }
  }

  await client.end();
  console.log('✓ Inserted', inserted, 'needs into Postgres');
}

insertNeeds().catch(console.error);
