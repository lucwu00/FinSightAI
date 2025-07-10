function analyzeDataQuality(rows) {
    const warnings = [];
  
    rows.forEach((row, rowIndex) => {
      if (!row.email || !row.email.includes('@')) {
        warnings.push({ row: rowIndex + 1, field: 'email', warning: 'Missing or invalid email' });
      }
      if (!row.phone || !/^\d{8}$/.test(row.phone)) {
        warnings.push({ row: rowIndex + 1, field: 'phone', warning: 'Invalid phone format' });
      }
      if (!row.clientId || row.clientId.length < 5) {
        warnings.push({ row: rowIndex + 1, field: 'clientId', warning: 'Client ID seems invalid' });
      }
    });
  
    return warnings;
  }
  
  module.exports = { analyzeDataQuality };

  
  