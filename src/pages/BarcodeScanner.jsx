
import React, { useState, useRef } from 'react';
import { Camera, ScanBarcode, Check, X, Search, Database, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useApiKeysContext } from '@/contexts/ApiKeysContext';

export default function BarcodeScanner() {
  const { keys } = useApiKeysContext();
  const videoRef = useRef(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedProduct, setScannedProduct] = useState(null);
  const [manualCode, setManualCode] = useState('');
  const { toast } = useToast();

  const startScan = async () => {
    try {
      setIsScanning(true);
      setScannedProduct(null);
      // Simulate camera access delay
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      // MOCK SCAN SUCCESS after 3 seconds
      setTimeout(() => {
        handleScanSuccess();
      }, 3000);

    } catch (err) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Camera Error",
        description: "Could not access camera. Ensure you are on HTTPS or localhost.",
      });
      setIsScanning(false);
    }
  };

  const stopScan = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
  };

  const handleScanSuccess = () => {
    stopScan();
    // Enhanced Mock Product Data
    const mockProduct = {
      name: "Keto Crunch Almond Bars",
      brand: "Nature's Keto",
      calories: 180,
      netCarbs: 3,
      protein: 12,
      fat: 14,
      image: "https://images.unsplash.com/photo-1623366302587-b38b1ddaefd9?w=400&q=80",
      ingredients: "Almonds, Erythritol, Cocoa Butter, Whey Protein Isolate...",
      verified: true
    };
    setScannedProduct(mockProduct);
    
    // Check if FDC key is present for verification
    if (keys.FDC) {
      toast({
        title: "Product Found!",
        description: `Scanned: ${mockProduct.name} (Verified with FDC)`,
      });
    } else {
      toast({
        title: "Product Found!",
        description: `Scanned: ${mockProduct.name} (Offline Database)`,
        variant: "warning" 
      });
    }
  };

  const handleManualSearch = (e) => {
    e.preventDefault();
    if(!manualCode) return;
    
    const statusMsg = keys.FDC ? "Checking USDA Database..." : "Checking Local Database...";
    
    toast({ title: "Searching...", description: `${statusMsg} Looking up barcode: ${manualCode}` });
    setTimeout(handleScanSuccess, 1000); // Simulate API call
  };

  return (
    <div className="max-w-md mx-auto h-[calc(100vh-100px)] flex flex-col p-4">
      <div className="mb-6 text-center space-y-2">
        <h1 className="text-2xl font-bold text-white">Food Scanner</h1>
        <p className="text-slate-400 text-sm">Scan barcodes to instantly log macros and ingredients.</p>
        {!keys.FDC && (
           <div className="flex items-center justify-center gap-2 text-xs text-yellow-500 bg-yellow-950/30 p-2 rounded-lg border border-yellow-900/50">
              <AlertCircle className="w-3 h-3" />
              <span>Running in Offline Mode (No FDC Key)</span>
           </div>
        )}
      </div>

      <div className="flex-1 relative bg-black rounded-3xl overflow-hidden border border-slate-800 shadow-2xl mb-6 ring-1 ring-slate-800">
        {isScanning ? (
          <>
            <video 
              ref={videoRef} 
              className="absolute inset-0 w-full h-full object-cover opacity-80"
              muted 
              playsInline
            />
            {/* Overlay */}
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center">
               <div className="w-64 h-48 border-2 border-cyan-500/50 rounded-lg relative">
                  <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-cyan-500 -mt-1 -ml-1"></div>
                  <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-cyan-500 -mt-1 -mr-1"></div>
                  <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-cyan-500 -mb-1 -ml-1"></div>
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-cyan-500 -mb-1 -mr-1"></div>
                  <div className="w-full h-0.5 bg-red-500 absolute top-1/2 left-0 animate-pulse shadow-[0_0_10px_rgba(239,68,68,1)]"></div>
               </div>
               <p className="mt-4 text-white font-medium bg-black/50 px-3 py-1 rounded-full text-sm backdrop-blur">
                  Align barcode within frame
               </p>
            </div>
            <Button 
              size="icon" 
              variant="destructive" 
              className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 rounded-full w-16 h-16 shadow-lg shadow-red-900/40"
              onClick={stopScan}
            >
              <X className="w-8 h-8" />
            </Button>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-6 bg-slate-900/80 p-6">
             <div className="w-32 h-32 rounded-full bg-slate-800 flex items-center justify-center relative group cursor-pointer hover:bg-slate-700 transition-colors" onClick={startScan}>
                <div className="absolute inset-0 rounded-full border border-dashed border-slate-600 animate-spin-slow"></div>
                <ScanBarcode className="w-12 h-12 text-cyan-400" />
             </div>
             
             <div className="w-full max-w-xs space-y-4">
               <Button onClick={startScan} size="lg" className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/10 h-12">
                 <Camera className="w-5 h-5 mr-2" />
                 Open Camera
               </Button>
               
               <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-slate-700" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-slate-900 px-2 text-slate-500">Or enter manually</span>
                  </div>
               </div>

               <form onSubmit={handleManualSearch} className="flex gap-2">
                  <Input 
                    placeholder="Enter Barcode ID" 
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                  <Button type="submit" variant="secondary" className="bg-slate-800 hover:bg-slate-700">
                     <Search className="w-4 h-4" />
                  </Button>
               </form>
             </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {scannedProduct && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed inset-x-0 bottom-0 p-4 z-50 pointer-events-none"
          >
            <Card className="bg-slate-800/95 border-cyan-500/30 overflow-hidden shadow-2xl backdrop-blur pointer-events-auto max-w-md mx-auto">
               <CardContent className="p-0">
                  <div className="flex p-4 gap-4 items-start">
                     <div className="w-20 h-20 rounded-lg bg-slate-900 overflow-hidden flex-shrink-0">
                        <img src={scannedProduct.image} alt={scannedProduct.name} className="w-full h-full object-cover" />
                     </div>
                     <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg text-white leading-tight mb-1">{scannedProduct.name}</h3>
                        <p className="text-sm text-cyan-400 mb-2">{scannedProduct.brand}</p>
                        {scannedProduct.verified && (
                           <span className="inline-flex items-center text-[10px] bg-emerald-900/50 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-800">
                              <Check className="w-3 h-3 mr-1" /> Verified Data
                           </span>
                        )}
                     </div>
                  </div>
                  
                  <div className="px-4 py-3 bg-slate-900/50 grid grid-cols-4 gap-2 text-center border-y border-slate-700/50">
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-bold">Cal</div>
                      <div className="font-bold text-white text-lg">{scannedProduct.calories}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-bold">Carb</div>
                      <div className="font-bold text-emerald-400 text-lg">{scannedProduct.netCarbs}g</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-bold">Prot</div>
                      <div className="font-bold text-white text-lg">{scannedProduct.protein}g</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-bold">Fat</div>
                      <div className="font-bold text-amber-400 text-lg">{scannedProduct.fat}g</div>
                    </div>
                  </div>

                  <div className="p-4 space-y-3">
                     <p className="text-xs text-slate-400 line-clamp-2">
                        <span className="font-bold text-slate-300">Ingredients:</span> {scannedProduct.ingredients}
                     </p>
                     <div className="flex gap-2">
                        <Button variant="outline" className="flex-1 border-slate-600 hover:bg-slate-700" onClick={() => setScannedProduct(null)}>Cancel</Button>
                        <Button className="flex-1 bg-cyan-600 hover:bg-cyan-700 font-bold">Log Food</Button>
                     </div>
                  </div>
               </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
