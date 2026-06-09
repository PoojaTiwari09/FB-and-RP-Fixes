import * as XLSX from 'xlsx';

const excelPath = 'C:\\Users\\Relanto\\Downloads\\deal_intelligence_dataset_cleaned.xlsx';

try {
  const workbook = XLSX.readFile(excelPath);
  
  console.log('📊 Excel File Structure:');
  console.log('Sheet Names:', workbook.SheetNames);
  console.log('');
  
  workbook.SheetNames.forEach(sheetName => {
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    console.log(`\n📄 Sheet: ${sheetName}`);
    console.log(`   Rows: ${data.length}`);
    
    if (data.length > 0) {
      console.log('   Columns:', Object.keys(data[0] as any));
      console.log('   Sample Row:', JSON.stringify(data[0], null, 2));
    }
  });
} catch (error) {
  console.error('Error reading Excel file:', error);
}
