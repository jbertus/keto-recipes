
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileDown, Loader2 } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';

export default function ShoppingListPDFExport({ items, deductedItems = [], onExportComplete }) {
  const [generating, setGenerating] = useState(false);

  const handleExport = () => {
    setGenerating(true);
    try {
      const doc = new jsPDF();
      
      // Title
      doc.setFontSize(22);
      doc.text("Keto Contractor Shopping List", 14, 20);
      
      doc.setFontSize(12);
      doc.text(`Generated on: ${format(new Date(), 'MMM d, yyyy h:mm a')}`, 14, 30);

      // Filter and Calculate Final Quantities
      // We want to show what is NEEDED. 
      // Need = Original Requirement - Deducted Amount
      // If Need <= 0, we skip it (or show as fully stocked?) - Let's skip to make the list clean for the store.
      
      const finalItems = items.map(item => {
        const deduction = deductedItems.find(d => d.shoppingItemId === item.id);
        
        // Simple logic: if deducted, assume it was fully covered or partially covered
        // If we have deduction details, we use them.
        // For this implementation, we will assume:
        // If it's in the 'deductedItems' list, it implies the pantry covered SOME of it.
        // If the pantry covered ALL of it, the 'remaining' quantity effectively becomes 0 or reduced.
        // Since we are not strictly tracking "remaining shopping list qty" in DB, we'll do a best effort here.
        
        // However, the main "Use All Ingredients" workflow implies removing them from pantry because we ARE using them.
        // But for a SHOPPING LIST PDF, we want to know what to BUY.
        // If I "deducted from pantry" (meaning I have it), I don't need to buy it.
        
        // If deduction exists and covered the full amount, skip.
        if (deduction && deduction.fullyCovered) return null;
        
        return {
          category: item.category || 'Other',
          name: item.name,
          quantity: item.quantity, // Ideally we'd show reduced quantity, but string parsing is complex here.
          checked: item.checked
        };
      }).filter(Boolean); // Remove nulls

      // Group by Category
      const grouped = finalItems.reduce((acc, item) => {
        const cat = item.category;
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(item);
        return acc;
      }, {});

      // Table Data
      const tableRows = [];
      const categories = Object.keys(grouped).sort();

      categories.forEach(cat => {
        // Category Header Row
        tableRows.push([{ content: cat.toUpperCase(), colSpan: 3, styles: { fillColor: [220, 220, 220], fontStyle: 'bold' } }]);
        
        // Items
        grouped[cat].forEach(item => {
          tableRows.push([
            { content: '', styles: { cellWidth: 10 } }, // Checkbox placeholder
            item.name,
            item.quantity
          ]);
        });
      });

      doc.autoTable({
        startY: 40,
        head: [['', 'Item', 'Qty']],
        body: tableRows,
        theme: 'plain',
        styles: { fontSize: 11, cellPadding: 3 },
        columnStyles: {
          0: { cellWidth: 8 }, // Box
          1: { cellWidth: 'auto' },
          2: { cellWidth: 30, halign: 'right' }
        },
        didDrawCell: function(data) {
          if (data.section === 'body' && data.column.index === 0 && data.cell.raw === '') {
            // Draw checkbox square
            doc.setDrawColor(100);
            doc.rect(data.cell.x + 2, data.cell.y + 2, 4, 4);
          }
        }
      });

      doc.save(`shopping-list-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      
      if (onExportComplete) onExportComplete();

    } catch (err) {
      console.error("PDF Generation Error", err);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Button 
      onClick={handleExport} 
      variant="outline" 
      disabled={generating}
      className="gap-2"
    >
      {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
      Export to PDF
    </Button>
  );
}
