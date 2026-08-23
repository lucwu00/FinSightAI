const fs = require('fs');
const path = require('path');
const { sequelize } = require('../models');

async function runMigration() {
  try {
    console.log('🚀 Starting Policy Store migration...');
    
    const sqlFile = path.join(__dirname, 'create_policy_store_tables.sql');
    if (!fs.existsSync(sqlFile)) {
      throw new Error(`SQL file not found: ${sqlFile}`);
    }
    
    const sql = fs.readFileSync(sqlFile, 'utf8');
    console.log('📖 Read SQL file successfully');
    
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => {
        return stmt.length > 0 && 
               !stmt.startsWith('--') && 
               stmt !== '' &&
               !/^[\s\-]*$/.test(stmt); 
      })
      .map(stmt => {
        return stmt.split('\n')
          .map(line => {
            const commentIndex = line.indexOf('--');
            if (commentIndex !== -1) {
              return line.substring(0, commentIndex).trim();
            }
            return line.trim();
          })
          .filter(line => line.length > 0)
          .join('\n')
          .trim();
      })
      .filter(stmt => stmt.length > 0);
    
    console.log(`📋 Found ${statements.length} SQL statements to execute`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`⚡ Executing statement ${i + 1}/${statements.length}:`);
        console.log(`   ${statement.substring(0, 60)}...`);
        
        try {
          await sequelize.query(statement);
          console.log(`   ✅ Statement ${i + 1} completed`);
        } catch (statementError) {
          console.error(`   ❌ Statement ${i + 1} failed:`, statementError.message);
        }
      }
    }
    
    console.log('🎉 Migration completed successfully!');
  
    const [results] = await sequelize.query(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name IN ('PolicyStore', 'PolicyCategories', 'PolicyProviders')
    `);
    
    console.log('🔍 Created tables:', results.map(r => r.name));
    
    await sequelize.close();
    process.exit(0);
    
  } catch (error) {
    console.error('💥 Migration failed:', error.message);
    console.error('Full error:', error);
    await sequelize.close();
    process.exit(1);
  }
}

if (require.main === module) {
  runMigration();
}

module.exports = runMigration;