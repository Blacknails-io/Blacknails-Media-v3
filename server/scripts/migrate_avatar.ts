import Database from 'better-sqlite3';

const dbPath = './data/blacknails.db';
const db = new Database(dbPath);

console.log('Adding avatar_url to users table...');
try {
  db.exec('ALTER TABLE users ADD COLUMN avatar_url TEXT;');
  console.log('Column avatar_url added successfully.');
} catch (error: any) {
  if (error.message.includes('duplicate column name')) {
    console.log('Column avatar_url already exists.');
  } else {
    console.error('Error adding column:', error.message);
  }
}

db.close();
