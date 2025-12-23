import openpyxl
import os

excel_files = [
    'full_backup_2025-12-17.xlsx',
    'full_backup_2025-12-22.xlsx',
    'full_backup_2025-12-23.xlsx'
]

base_path = r'c:\.github_mhmdnvn18@gmail.com\emaklaundry_kasir\database\backup\excel'
output_file = os.path.join(base_path, 'excel_summary.txt')

with open(output_file, 'w', encoding='utf-8') as f:
    for filename in excel_files:
        filepath = os.path.join(base_path, filename)
        
        if not os.path.exists(filepath):
            f.write(f'File tidak ditemukan: {filename}\n\n')
            continue
        
        f.write(f'\n{"="*80}\n')
        f.write(f'FILE: {filename}\n')
        f.write(f'{"="*80}\n\n')
        
        try:
            # Load workbook WITHOUT read_only mode
            wb = openpyxl.load_workbook(filepath, data_only=True)
            
            f.write(f'Jumlah sheets: {len(wb.sheetnames)}\n')
            f.write(f'Nama sheets: {", ".join(wb.sheetnames)}\n\n')
            
            # Iterate through each sheet
            for sheet_name in wb.sheetnames:
                ws = wb[sheet_name]
                
                f.write(f'\n{"─"*60}\n')
                f.write(f'Sheet: {sheet_name}\n')
                f.write(f'{"─"*60}\n')
                f.write(f'Jumlah baris: {ws.max_row}\n')
                f.write(f'Jumlah kolom: {ws.max_column}\n\n')
                
                # Show first 15 rows
                f.write('15 Baris Pertama:\n')
                for i in range(1, min(16, ws.max_row + 1)):
                    row_data = []
                    for j in range(1, min(ws.max_column + 1, 11)):  # Max 10 columns
                        cell_value = ws.cell(row=i, column=j).value
                        row_data.append(str(cell_value) if cell_value is not None else '')
                    f.write(f'  Row {i}: {" | ".join(row_data)}\n')
                
                f.write('\n')
            
            wb.close()
            
        except Exception as e:
            f.write(f'Error membaca file: {e}\n\n')
            import traceback
            f.write(traceback.format_exc())
    
    f.write(f'\n{"="*80}\n')
    f.write('Selesai membaca semua file Excel\n')
    f.write(f'{"="*80}\n')

print(f'Summary berhasil disimpan ke: {output_file}')
