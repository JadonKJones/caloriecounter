import { useState, useEffect } from 'react'
import { supabase } from '../services/supabaseClient'
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode'

export default function SearchView({ onBack, userId }) {
  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [loading, setLoading] = useState(false)
  const [isScannerOpen, setIsScannerOpen] = useState(false)

  // Logging States
  const [meal, setMeal] = useState('breakfast')
  const [amount, setAmount] = useState(1)
  const [unit, setUnit] = useState('serving')

  // --- SCANNER SETUP ---
  useEffect(() => {
    let scanner = null;
    if (isScannerOpen) {
      scanner = new Html5QrcodeScanner("reader", {
        fps: 30,
        qrbox: { width: 300, height: 150 },
        formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E
        ],
        experimentalFeatures: { useBarCodeDetectorIfSupported: true }
      });

      scanner.render((decodedText) => {
        setQuery(decodedText);
        setIsScannerOpen(false);
        performSearch(decodedText);
        scanner.clear();
      }, (err) => { });
    }
    return () => { if (scanner) scanner.clear(); };
  }, [isScannerOpen]);

  // --- HYBRID SEARCH LOGIC ---
  const performSearch = async (manualBarcode) => {
    const searchTerm = manualBarcode || query;
    if (!searchTerm) return;
    setLoading(true);
    setSelectedProduct(null);

    try {
      const USDA_API_KEY = 'OaHgSz0pBfMjz5JmLKc9jgOb7ubby5sYZe1SLy2D '; // Replace with your real key from FDC

      const [usdaRes, offRes] = await Promise.all([
        fetch(`https://api.nal.usda.gov/fdc/v1/foods/search?query=${searchTerm}&api_key=${USDA_API_KEY}&pageSize=5&dataType=Foundation,Survey%20(FNDDS)`),
        fetch(`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${searchTerm}&json=1&page_size=15`)
      ]);

      const usdaData = await usdaRes.json();
      const offData = await offRes.json();

      // 1. USDA (Generics) - Resolving Household Measures
      const usdaFormatted = (usdaData.foods || []).map(f => {
        const getNutrient = (id) => f.foodNutrients.find(n => n.nutrientId === id)?.value || 0;
        
        // Find a household measure (e.g., "1 medium banana") instead of 100g
        const measure = f.foodMeasures?.[0]; 
        const servingQty = measure ? measure.gramWeight : 100;
        const servingLabel = measure ? `${measure.disseminationText}` : "100g";

        return {
          code: `usda-${f.fdcId}`,
          product_name: f.description,
          brands: 'Generic Food',
          nutriments: {
            'energy-kcal_100g': getNutrient(1008),
            proteins_100g: getNutrient(1003),
            carbohydrates_100g: getNutrient(1005),
            fat_100g: getNutrient(1004)
          },
          display_serving: servingLabel,
          serving_quantity: servingQty,
          serving_unit: 'g'
        };
      });

      // 2. OpenFoodFacts (Branded)
      const offFormatted = (offData.products || []).map(p => {
        const rawServing = p.serving_quantity || "100";
        const unitStr = String(p.serving_size || p.serving_quantity || 'g')
          .replace(/[0-9.]/g, '')
          .trim() || 'g';

        return {
          code: p.code,
          product_name: p.product_name,
          brands: p.brands || 'Branded Product',
          nutriments: {
            'energy-kcal_100g': p.nutriments?.['energy-kcal_100g'] || 0,
            proteins_100g: p.nutriments?.proteins_100g || 0,
            carbohydrates_100g: p.nutriments?.carbohydrates_100g || 0,
            fat_100g: p.nutriments?.fat_100g || 0
          },
          display_serving: p.serving_size || `${rawServing}${unitStr}`,
          serving_quantity: parseFloat(rawServing) || 100,
          serving_unit: unitStr,
          image_front_url: p.image_front_url
        };
      });

      setSearchResults([...usdaFormatted, ...offFormatted]);

    } catch (err) {
      console.error("Search Error:", err);
    } finally {
      setLoading(false);
    }
  };

  // --- CALCULATIONS ---
  const calculate = (val100g, product) => {
    if (!val100g || !product) return 0;
    let multiplier = (unit === 'g') 
      ? (amount / 100) 
      : (amount * product.serving_quantity) / 100;
    return Math.round(val100g * multiplier);
  };

  const calculateServing = (val100g, servingSize) => {
    if (!val100g) return 0;
    return Math.round((val100g * (servingSize || 100)) / 100);
  };

  // --- DATABASE LOGGING ---
  const handleLogFood = async () => {
    if (!selectedProduct) return;
    setLoading(true);

    const logData = {
      user_id: userId,
      product_name: selectedProduct.product_name,
      barcode: selectedProduct.code,
      image_url: selectedProduct.image_front_url || null,
      meal,
      total_calories: calculate(selectedProduct.nutriments['energy-kcal_100g'], selectedProduct),
      total_protein: calculate(selectedProduct.nutriments.proteins_100g, selectedProduct),
      total_carbs: calculate(selectedProduct.nutriments.carbohydrates_100g, selectedProduct),
      total_fat: calculate(selectedProduct.nutriments.fat_100g, selectedProduct),
      calories_per_100g: selectedProduct.nutriments['energy-kcal_100g'],
      protein_per_100g: selectedProduct.nutriments.proteins_100g,
      carbs_per_100g: selectedProduct.nutriments.carbohydrates_100g,
      fat_per_100g: selectedProduct.nutriments.fat_100g,
      standard_serving_size_g: selectedProduct.serving_quantity || 100
    };

    const { error } = await supabase.from('nutrition_logs').insert([logData]);

    if (error) {
      alert("Error logging: " + error.message);
    } else {
      alert("Logged to your Diary!");
      onBack();
    }
    setLoading(false);
  };

  return (
    <div className="dashboard-container" style={{ padding: '0px', paddingBottom: '100px', backgroundColor: '#000', minHeight: '100vh' }}>

      {/* SEARCH LIST VIEW */}
      {!selectedProduct && (
        <>
          <div style={{ padding: '20px', borderBottom: '1px solid #222', backgroundColor: '#111' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px' }}>
              <button onClick={onBack} style={{ color: '#32d74b', background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer' }}>✕</button>
              <span style={{ fontWeight: 'bold', color: 'white', fontSize: '1.2rem' }}>Food Search</span>
              <div style={{ width: '28px' }}></div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <input
                  style={{ width: '100%', padding: '12px 15px 12px 40px', background: '#1c1c1e', color: 'white', border: 'none', borderRadius: '10px', boxSizing: 'border-box' }}
                  placeholder="Banana, Chicken, Shake..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && performSearch()}
                />
                <span style={{ position: 'absolute', left: '12px', top: '12px' }}>🔍</span>
              </div>
              <button onClick={() => setIsScannerOpen(!isScannerOpen)} style={{ padding: '8px 12px', background: '#1c1c1e', border: '1px solid #333', borderRadius: '10px', color: '#32d74b' }}>
                {isScannerOpen ? '✕' : '🔳'}
              </button>
            </div>
          </div>

          {isScannerOpen && (
            <div style={{ padding: '10px', background: '#000' }}>
              <div id="reader" style={{ width: '100%', borderRadius: '12px', overflow: 'hidden' }}></div>
            </div>
          )}

          {loading && <p style={{ textAlign: 'center', color: '#32d74b', marginTop: '20px' }}>Analyzing data sources...</p>}

          {searchResults.map((p) => {
            const servCals = calculateServing(p.nutriments['energy-kcal_100g'], p.serving_quantity);
            const servProt = calculateServing(p.nutriments.proteins_100g, p.serving_quantity);
            const servCarb = calculateServing(p.nutriments.carbohydrates_100g, p.serving_quantity);
            const servFat = calculateServing(p.nutriments.fat_100g, p.serving_quantity);

            return (
              <div
                key={p.code}
                onClick={() => setSelectedProduct(p)}
                style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #222', cursor: 'pointer' }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#0a84ff', fontWeight: '500', fontSize: '1.05rem' }}>{p.product_name}</div>
                  <div style={{ display: 'flex', gap: '10px', fontSize: '0.9rem', marginTop: '4px' }}>
                    <span style={{ color: '#32d74b' }}>{servProt}g P</span>
                    <span style={{ color: '#bf5af2' }}>{servCarb}g C</span>
                    <span style={{ color: '#ff9f0a' }}>{servFat}g F</span>
                  </div>
                  <div style={{ color: '#666', fontSize: '0.8rem', textTransform: 'uppercase', marginTop: '4px' }}>{p.brands}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: '#0a84ff', fontWeight: 'bold', fontSize: '1.1rem' }}>{servCals}</div>
                  <div style={{ color: '#666', fontSize: '0.8rem' }}>cals per serving</div>
                </div>
              </div>
            );
          })}
        </>
      )}

      {/* SELECTION PAGE */}
      {selectedProduct && (
        <div style={{ padding: '20px', color: 'white', minHeight: '100vh', backgroundColor: '#000' }}>
          <button
            onClick={() => setSelectedProduct(null)}
            style={{ color: '#32d74b', background: 'none', border: 'none', marginBottom: '20px', fontSize: '1rem', cursor: 'pointer' }}
          >
            ← Back to results
          </button>

          <div style={{ textAlign: 'center', marginBottom: '25px' }}>
            <h2 style={{ margin: '0 0 5px 0', fontSize: '1.5rem' }}>{selectedProduct.product_name}</h2>
            <p style={{ color: '#888', textTransform: 'uppercase', fontSize: '0.8rem' }}>{selectedProduct.brands}</p>
          </div>

          <div style={{ background: '#1c1c1e', padding: '25px', borderRadius: '25px' }}>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '25px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', color: '#888', fontSize: '0.75rem', marginBottom: '8px', fontWeight: 'bold' }}>AMOUNT</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  style={{ width: '100%', padding: '15px', background: '#2c2c2e', color: 'white', border: '1px solid #444', borderRadius: '12px', textAlign: 'center', fontSize: '1.2rem', fontWeight: 'bold' }}
                />
              </div>
              <div style={{ flex: 2 }}>
                <label style={{ display: 'block', color: '#888', fontSize: '0.75rem', marginBottom: '8px', fontWeight: 'bold' }}>UNIT</label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  style={{ width: '100%', padding: '15px', background: '#2c2c2e', color: 'white', border: '1px solid #444', borderRadius: '12px', fontSize: '1rem' }}
                >
                  <option value="serving">Serving ({selectedProduct.display_serving})</option>
                  <option value="g">Grams (g)</option>
                </select>
              </div>
            </div>

            <label style={{ display: 'block', color: '#888', fontSize: '0.75rem', marginBottom: '8px', fontWeight: 'bold' }}>MEAL</label>
            <select
              value={meal}
              onChange={(e) => setMeal(e.target.value)}
              style={{ width: '100%', padding: '15px', background: '#2c2c2e', color: 'white', border: '1px solid #444', borderRadius: '12px', marginBottom: '25px', fontSize: '1rem' }}
            >
              <option value="breakfast">Breakfast</option>
              <option value="lunch">Lunch</option>
              <option value="dinner">Dinner</option>
              <option value="snack">Snack</option>
            </select>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', textAlign: 'center', marginBottom: '30px', padding: '20px 0', borderTop: '1px solid #333', borderBottom: '1px solid #333' }}>
              <div>
                <div style={{ color: '#32d74b', fontSize: '1.3rem', fontWeight: 'bold' }}>{calculate(selectedProduct.nutriments.proteins_100g, selectedProduct)}g</div>
                <div style={{ fontSize: '0.7rem', color: '#888', marginTop: '4px' }}>PROTEIN</div>
              </div>
              <div>
                <div style={{ color: '#bf5af2', fontSize: '1.3rem', fontWeight: 'bold' }}>{calculate(selectedProduct.nutriments.carbohydrates_100g, selectedProduct)}g</div>
                <div style={{ fontSize: '0.7rem', color: '#888', marginTop: '4px' }}>CARBS</div>
              </div>
              <div>
                <div style={{ color: '#ff9f0a', fontSize: '1.3rem', fontWeight: 'bold' }}>{calculate(selectedProduct.nutriments.fat_100g, selectedProduct)}g</div>
                <div style={{ fontSize: '0.7rem', color: '#888', marginTop: '4px' }}>FAT</div>
              </div>
            </div>

            <div style={{ textAlign: 'center', marginBottom: '25px' }}>
              <div style={{ fontSize: '3rem', fontWeight: 'bold', color: '#32d74b' }}>
                {calculate(selectedProduct.nutriments['energy-kcal_100g'], selectedProduct)}
              </div>
              <div style={{ color: '#888', fontSize: '0.8rem', letterSpacing: '2px' }}>CALORIES</div>
            </div>

            <button
              className="btn-primary"
              style={{ width: '100%', padding: '20px', borderRadius: '18px', fontSize: '1.2rem', fontWeight: 'bold' }}
              onClick={handleLogFood}
              disabled={loading}
            >
              {loading ? 'Logging...' : 'Add to Diary'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

