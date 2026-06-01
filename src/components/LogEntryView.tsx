'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, CloudRain, Save, Plus, AlertCircle, XCircle, Camera, X } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { analyzeAllergens } from '@/utils/allergenAnalyzer';
import { MCASLog } from '@/lib/supabase';

const DEFAULT_SYMPTOM_TAGS = ['Flushing', 'Hives', 'Brain Fog', 'Fatigue', 'Tachycardia', 'GI Pain', 'Nausea', 'Headache'];
const DEFAULT_FOOD_TAGS = ['High Histamine Food', 'Dairy', 'Gluten', 'Sugar', 'Caffeine', 'Alcohol', 'Nightshades'];
const DEFAULT_MED_TAGS = ['H1 Blocker', 'H2 Blocker', 'Cromolyn', 'Quercetin', 'Vitamin C', 'DAO Enzyme'];
const MENSTRUAL_PHASES = ['None', 'Follicular', 'Ovulation', 'Luteal', 'Menstruation'];
const TIME_BLOCKS = ['Morning', 'Afternoon', 'Evening', 'Night'];

export function LogEntryView({ editingLog, onClearEdit }: { editingLog?: MCASLog | null, onClearEdit?: () => void }) {
  const [allergyIndex, setAllergyIndex] = useState(1);
  const [stressLevel, setStressLevel] = useState(1);
  const [isFlarePhase, setIsFlarePhase] = useState(false);
  const [timeBlock, setTimeBlock] = useState('Morning');
  const [menstrualPhase, setMenstrualPhase] = useState('None');
  const [logDate, setLogDate] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  });
  
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  // We add 'allergens' to the state to display auto-analyzed results
  const [selectedFoods, setSelectedFoods] = useState<{item: string, qty: string, is_leftover: boolean, allergens?: string[]}[]>([]);
  const [selectedMeds, setSelectedMeds] = useState<{item: string, dose: string, type: 'daily_supplement'|'rescue_medication'}[]>([]);
  
  // Custom Tags State
  const [symptomTags, setSymptomTags] = useState<string[]>(DEFAULT_SYMPTOM_TAGS);
  const [foodTags, setFoodTags] = useState<string[]>(DEFAULT_FOOD_TAGS);
  const [medTags, setMedTags] = useState<string[]>(DEFAULT_MED_TAGS);

  const [newSymptom, setNewSymptom] = useState('');
  const [newFood, setNewFood] = useState('');
  const [newMed, setNewMed] = useState('');

  const [foodImageFile, setFoodImageFile] = useState<File | null>(null);
  const [foodImagePreview, setFoodImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [weatherFallback, setWeatherFallback] = useState(false);
  const [manualWeather, setManualWeather] = useState({ temp: '', humidity: '', pressure: '', uv: '', aqi: '' });

  useEffect(() => {
    const savedSymptoms = localStorage.getItem('mcas_symptom_tags');
    if (savedSymptoms) setSymptomTags(JSON.parse(savedSymptoms));
    const savedFoods = localStorage.getItem('mcas_food_tags');
    if (savedFoods) setFoodTags(JSON.parse(savedFoods));
    const savedMeds = localStorage.getItem('mcas_med_tags');
    if (savedMeds) setMedTags(JSON.parse(savedMeds));
  }, []);

  useEffect(() => {
    if (editingLog) {
      setAllergyIndex(editingLog.allergy_index);
      setStressLevel(editingLog.stress_level);
      setIsFlarePhase(editingLog.is_flare_phase);
      setTimeBlock(editingLog.time_block);
      setMenstrualPhase(editingLog.menstrual_phase || 'None');
      setSelectedSymptoms(editingLog.symptoms || []);
      setSelectedFoods(editingLog.foods || []);
      setSelectedMeds(editingLog.meds_and_supps || []);
      
      const ed = new Date(editingLog.created_at);
      setLogDate(`${ed.getFullYear()}-${String(ed.getMonth() + 1).padStart(2, '0')}-${String(ed.getDate()).padStart(2, '0')}`);

      if (editingLog.food_image_url) {
        setFoodImagePreview(editingLog.food_image_url);
      }

      // Pre-fill manual weather if editing an old log that had weather
      if (editingLog.weather_temp !== null) {
        setManualWeather({
          temp: editingLog.weather_temp?.toString() || '',
          humidity: editingLog.weather_humidity?.toString() || '',
          pressure: editingLog.weather_pressure?.toString() || '',
          uv: editingLog.weather_uv?.toString() || '',
          aqi: editingLog.weather_aqi?.toString() || ''
        });
      }
    }
  }, [editingLog]);

  const addNewTag = (type: 'symptom'|'food'|'med', val: string) => {
    if (!val.trim()) return;
    const tag = val.trim();
    if (type === 'symptom' && !symptomTags.includes(tag)) {
      const newTags = [...symptomTags, tag];
      setSymptomTags(newTags);
      localStorage.setItem('mcas_symptom_tags', JSON.stringify(newTags));
      toggleSymptom(tag);
    } else if (type === 'food' && !foodTags.includes(tag)) {
      const newTags = [...foodTags, tag];
      setFoodTags(newTags);
      localStorage.setItem('mcas_food_tags', JSON.stringify(newTags));
      addFood(tag);
    } else if (type === 'med' && !medTags.includes(tag)) {
      const newTags = [...medTags, tag];
      setMedTags(newTags);
      localStorage.setItem('mcas_med_tags', JSON.stringify(newTags));
      addMed(tag);
    }
  };

  const removeTag = (type: 'symptom'|'food'|'med', tag: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (type === 'symptom') {
      const newTags = symptomTags.filter(t => t !== tag);
      setSymptomTags(newTags);
      localStorage.setItem('mcas_symptom_tags', JSON.stringify(newTags));
      setSelectedSymptoms(prev => prev.filter(t => t !== tag));
    } else if (type === 'food') {
      const newTags = foodTags.filter(t => t !== tag);
      setFoodTags(newTags);
      localStorage.setItem('mcas_food_tags', JSON.stringify(newTags));
      setSelectedFoods(prev => prev.filter(t => t.item !== tag));
    } else if (type === 'med') {
      const newTags = medTags.filter(t => t !== tag);
      setMedTags(newTags);
      localStorage.setItem('mcas_med_tags', JSON.stringify(newTags));
      setSelectedMeds(prev => prev.filter(t => t.item !== tag));
    }
  };

  const getSliderColor = (val: number) => {
    if (val <= 3) return 'from-green-500 to-green-400';
    if (val <= 6) return 'from-yellow-500 to-orange-400';
    return 'from-red-500 to-rose-600';
  };

  const toggleSymptom = (s: string) => {
    setSelectedSymptoms(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  const addFood = (item: string) => {
    if (!selectedFoods.find(f => f.item === item)) {
      const detectedAllergens = analyzeAllergens(item);
      setSelectedFoods([...selectedFoods, { item, qty: '1 portion', is_leftover: false, allergens: detectedAllergens }]);
    } else {
      setSelectedFoods(selectedFoods.filter(f => f.item !== item));
    }
  };

  const updateFood = (item: string, key: 'is_leftover'|'qty', val: any) => {
    setSelectedFoods(prev => prev.map(f => f.item === item ? { ...f, [key]: val } : f));
  };

  const addMed = (item: string) => {
    if (!selectedMeds.find(m => m.item === item)) {
      setSelectedMeds([...selectedMeds, { item, dose: '1 dose', type: 'daily_supplement' }]);
    } else {
      setSelectedMeds(selectedMeds.filter(m => m.item !== item));
    }
  };

  const updateMedType = (item: string, type: 'daily_supplement'|'rescue_medication') => {
    setSelectedMeds(prev => prev.map(m => m.item === item ? { ...m, type } : m));
  };
  
  const updateMedDose = (item: string, dose: string) => {
    setSelectedMeds(prev => prev.map(m => m.item === item ? { ...m, dose } : m));
  };

  const compressImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => {
              if (blob) resolve(blob);
              else reject(new Error('Canvas to Blob failed'));
            },
            'image/jpeg',
            0.7
          );
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressedBlob = await compressImage(file);
      const compressedFile = new File([compressedBlob], file.name, {
        type: 'image/jpeg',
        lastModified: Date.now(),
      });
      setFoodImageFile(compressedFile);
      setFoodImagePreview(URL.createObjectURL(compressedFile));
    } catch (err) {
      console.error('Compression failed', err);
      alert('Failed to process image');
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    let weatherData = null;

    try {
      const wRes = await fetch('/api/weather');
      if (wRes.ok) {
        weatherData = await wRes.json();
        if (weatherData.error) throw new Error('API Error');
      } else {
        throw new Error('Fetch failed');
      }
    } catch (e) {
      console.warn('Weather API failed, using fallback if provided', e);
      if (!weatherFallback) {
        setWeatherFallback(true);
        setIsSaving(false);
        alert('Weather API failed. Please fill manual weather data or try saving again.');
        return;
      }
      weatherData = {
        weather_temp: parseFloat(manualWeather.temp) || null,
        weather_humidity: parseFloat(manualWeather.humidity) || null,
        weather_pressure: parseFloat(manualWeather.pressure) || null,
        weather_uv: parseFloat(manualWeather.uv) || null,
        weather_aqi: parseInt(manualWeather.aqi) || null,
      };
    }

    const now = new Date();
    const formattedToday = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    let finalDateString = now.toISOString();

    if (editingLog) {
      const orig = new Date(editingLog.created_at);
      const [y, m, d] = logDate.split('-');
      orig.setFullYear(parseInt(y), parseInt(m) - 1, parseInt(d));
      finalDateString = orig.toISOString();
    } else {
      if (logDate !== formattedToday) {
        finalDateString = new Date(`${logDate}T12:00:00`).toISOString();
      }
    }

    let finalImageUrl = editingLog?.food_image_url || null;

    if (foodImageFile) {
      const fileExt = 'jpg';
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `public/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('food-images')
        .upload(filePath, foodImageFile, { upsert: true });

      if (uploadError) {
        setIsSaving(false);
        alert('Failed to upload image: ' + uploadError.message);
        return;
      }
      
      const { data: { publicUrl } } = supabase.storage.from('food-images').getPublicUrl(filePath);
      finalImageUrl = publicUrl;
    }

    const logData = {
      created_at: finalDateString,
      time_block: timeBlock,
      allergy_index: allergyIndex,
      is_flare_phase: isFlarePhase,
      symptoms: selectedSymptoms,
      foods: selectedFoods,
      food_image_url: finalImageUrl,
      meds_and_supps: selectedMeds,
      stress_level: stressLevel,
      menstrual_phase: menstrualPhase,
      ...weatherData
    };

    if (editingLog) {
      const { error } = await supabase.from('mcas_logs').update(logData).eq('id', editingLog.id);
      setIsSaving(false);
      if (error) {
        alert('Error updating record: ' + error.message);
      } else {
        alert('Record updated successfully!');
        if (onClearEdit) onClearEdit();
      }
    } else {
      const { error } = await supabase.from('mcas_logs').insert([logData]);
      setIsSaving(false);
      if (error) {
        alert('Error saving record: ' + error.message);
      } else {
        alert('Record saved successfully!');
        setAllergyIndex(1);
        setStressLevel(1);
        setSelectedSymptoms([]);
        setSelectedFoods([]);
        setSelectedMeds([]);
        setFoodImageFile(null);
        setFoodImagePreview(null);
      }
    }
  };

  return (
    <div className="p-5 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 text-slate-200">
      <header className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            {editingLog ? '編輯舊紀錄' : '🦊 狐狸的專屬日記'}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {editingLog ? `Editing record from ${new Date(editingLog.created_at).toLocaleDateString()}` : 'Record your MCAS metrics'}
          </p>
        </div>
        {editingLog && onClearEdit && (
          <button 
            onClick={onClearEdit}
            className="text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 p-2 rounded-full transition-colors"
          >
            <XCircle size={20} />
          </button>
        )}
      </header>

      {/* Date & Time Block */}
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Log Date</label>
          <input 
            type="date"
            value={logDate}
            onChange={(e) => setLogDate(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Time Block</label>
            <select 
              value={timeBlock} onChange={e => setTimeBlock(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
            >
              {TIME_BLOCKS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Cycle Phase</label>
            <select 
              value={menstrualPhase} onChange={e => setMenstrualPhase(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
            >
              {MENSTRUAL_PHASES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Sliders */}
      <div className="space-y-6 glass-panel p-5">
        <div>
          <div className="flex justify-between items-end mb-3">
            <label className="text-sm font-semibold text-slate-300 block">Allergy Index</label>
            <span className={clsx("text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r", getSliderColor(allergyIndex))}>{allergyIndex}</span>
          </div>
          <input 
            type="range" min="1" max="10" 
            value={allergyIndex} onChange={(e) => setAllergyIndex(parseInt(e.target.value))}
            className="w-full"
          />
        </div>

        <div>
          <div className="flex justify-between items-end mb-3">
            <label className="text-sm font-semibold text-slate-300 block">Stress Level</label>
            <span className={clsx("text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r", getSliderColor(stressLevel))}>{stressLevel}</span>
          </div>
          <input 
            type="range" min="1" max="10" 
            value={stressLevel} onChange={(e) => setStressLevel(parseInt(e.target.value))}
            className="w-full"
          />
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-700/50">
          <div>
            <p className="font-medium text-slate-200">Baseline Flare Phase</p>
            <p className="text-xs text-slate-400">Mark if currently highly sensitive</p>
          </div>
          <button 
            onClick={() => setIsFlarePhase(!isFlarePhase)}
            className={twMerge(
              "w-12 h-6 rounded-full transition-colors relative flex items-center",
              isFlarePhase ? "bg-rose-500" : "bg-slate-700"
            )}
          >
            <div className={twMerge(
              "w-4 h-4 bg-white rounded-full absolute shadow-sm transition-all",
              isFlarePhase ? "right-1" : "left-1"
            )} />
          </button>
        </div>
      </div>

      {/* Symptoms Tag Cloud */}
      <div>
        <label className="text-xs font-semibold text-slate-400 mb-3 block uppercase tracking-wider">Symptoms</label>
        <div className="flex flex-wrap gap-2.5 mb-4">
          {symptomTags.map(s => (
            <button
              key={s} onClick={() => toggleSymptom(s)}
              className={twMerge(
                "capitalize px-4 py-2 rounded-2xl text-sm border transition-all flex items-center gap-1.5",
                selectedSymptoms.includes(s) 
                  ? "bg-indigo-500/20 border-indigo-500 text-indigo-300" 
                  : "bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-500 hover:bg-slate-800/80"
              )}
            >
              <span>{s}</span>
              <div 
                onClick={(e) => removeTag('symptom', s, e)} 
                className="opacity-40 hover:opacity-100 hover:text-rose-400 p-0.5 rounded-full transition-all"
              >
                <XCircle size={14} />
              </div>
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input 
            value={newSymptom} onChange={e => setNewSymptom(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { addNewTag('symptom', newSymptom); setNewSymptom(''); } }}
            placeholder="+ Custom symptom" 
            className="bg-slate-800 border border-slate-700 rounded-full px-3 py-1.5 text-sm outline-none focus:border-indigo-500 w-40 flex-1"
          />
          <button onClick={() => { addNewTag('symptom', newSymptom); setNewSymptom(''); }} className="bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-full text-sm transition-colors flex items-center justify-center">
            <Plus size={16} />
          </button>
        </div>
      </div>

      {/* Foods Tag Cloud */}
      <div>
        <div className="flex justify-between items-end mb-3">
          <label className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">Foods & Triggers</label>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-1.5 rounded-full border border-emerald-500/20 transition-colors"
          >
            <Camera size={14} /> Add Photo
          </button>
        </div>
        <input 
          type="file" 
          accept="image/*" 
          className="hidden" 
          ref={fileInputRef}
          onChange={handleImageSelect}
        />
        {foodImagePreview && (
          <div className="relative mb-4 rounded-xl overflow-hidden border border-slate-700/50 h-40 w-full bg-black/40 flex justify-center items-center group">
            <img src={foodImagePreview} alt="Food preview" className="object-cover h-full w-full opacity-80 group-hover:opacity-100 transition-opacity" />
            <button 
              onClick={() => { setFoodImagePreview(null); setFoodImageFile(null); }}
              className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-rose-500 text-white rounded-full backdrop-blur-md transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        )}
        <div className="flex flex-wrap gap-2.5 mb-4">
          {foodTags.map(f => (
            <button
              key={f} onClick={() => addFood(f)}
              className={twMerge(
                "capitalize px-4 py-2 rounded-2xl text-sm border transition-all flex items-center gap-1.5",
                selectedFoods.find(x => x.item === f)
                  ? "bg-emerald-500/20 border-emerald-500 text-emerald-300" 
                  : "bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-500 hover:bg-slate-800/80"
              )}
            >
              <span>{f}</span>
              <div 
                onClick={(e) => removeTag('food', f, e)} 
                className="opacity-40 hover:opacity-100 hover:text-rose-400 p-0.5 rounded-full transition-all"
              >
                <XCircle size={14} />
              </div>
            </button>
          ))}
        </div>
        <div className="flex gap-2 mb-4">
          <input 
            value={newFood} onChange={e => setNewFood(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { addNewTag('food', newFood); setNewFood(''); } }}
            placeholder="+ Custom food/trigger" 
            className="bg-slate-800 border border-slate-700 rounded-full px-3 py-1.5 text-sm outline-none focus:border-emerald-500 w-40 flex-1"
          />
          <button onClick={() => { addNewTag('food', newFood); setNewFood(''); }} className="bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-full text-sm transition-colors flex items-center justify-center">
            <Plus size={16} />
          </button>
        </div>
        {selectedFoods.map(sf => (
          <div key={sf.item} className="flex flex-col gap-2 bg-slate-800/30 p-3 rounded-lg mb-2 text-sm border border-slate-700/50">
            <div className="flex items-center gap-2">
              <span className="flex-1 text-emerald-400 font-medium truncate">{sf.item}</span>
              
              <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 rounded focus-within:border-emerald-500 px-2 shrink-0">
                <input 
                  type="number" 
                  value={sf.qty} 
                  onChange={e => updateFood(sf.item, 'qty', e.target.value)} 
                  placeholder="0"
                  className="w-10 sm:w-12 bg-transparent py-1 text-xs text-white text-right outline-none"
                />
                <span className="text-xs text-slate-400 font-medium">g</span>
              </div>

              <label className="flex items-center gap-1 text-xs text-slate-300 cursor-pointer bg-slate-900 px-2 py-1 rounded border border-slate-700">
                <input type="checkbox" checked={sf.is_leftover} onChange={e => updateFood(sf.item, 'is_leftover', e.target.checked)} className="accent-emerald-500" />
                Leftover
              </label>
            </div>
            
            {/* Auto Allergen Analysis Badge */}
            {sf.allergens && sf.allergens.length > 0 && (
              <div className="flex flex-wrap items-center gap-1 mt-1 border-t border-slate-700/50 pt-2">
                <span className="text-[10px] text-orange-400 flex items-center gap-1 mr-1">
                  <AlertCircle size={10} /> Detected:
                </span>
                {sf.allergens.map(a => (
                  <span key={a} className="bg-orange-500/20 text-orange-300 border border-orange-500/30 px-1.5 py-0.5 rounded-full text-[10px]">{a}</span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Meds Tag Cloud */}
      <div>
        <label className="text-xs font-semibold text-slate-400 mb-3 block uppercase tracking-wider">Meds & Supps</label>
        <div className="flex flex-wrap gap-2.5 mb-4">
          {medTags.map(m => (
            <button
              key={m} onClick={() => addMed(m)}
              className={twMerge(
                "capitalize px-4 py-2 rounded-2xl text-sm border transition-all flex items-center gap-1.5",
                selectedMeds.find(x => x.item === m)
                  ? "bg-cyan-500/20 border-cyan-500 text-cyan-300" 
                  : "bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-500 hover:bg-slate-800/80"
              )}
            >
              <span>{m}</span>
              <div 
                onClick={(e) => removeTag('med', m, e)} 
                className="opacity-40 hover:opacity-100 hover:text-rose-400 p-0.5 rounded-full transition-all"
              >
                <XCircle size={14} />
              </div>
            </button>
          ))}
        </div>
        <div className="flex gap-2 mb-4">
          <input 
            value={newMed} onChange={e => setNewMed(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { addNewTag('med', newMed); setNewMed(''); } }}
            placeholder="+ Custom med/supp" 
            className="bg-slate-800 border border-slate-700 rounded-full px-3 py-1.5 text-sm outline-none focus:border-cyan-500 w-40 flex-1"
          />
          <button onClick={() => { addNewTag('med', newMed); setNewMed(''); }} className="bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-full text-sm transition-colors flex items-center justify-center">
            <Plus size={16} />
          </button>
        </div>
        {selectedMeds.map(sm => (
          <div key={sm.item} className="flex items-center gap-2 bg-slate-800/30 p-3 rounded-lg mb-2 text-sm border border-slate-700/50">
            <span className="flex-1 text-cyan-400 font-medium truncate">{sm.item}</span>
            
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 rounded focus-within:border-cyan-500 px-2 shrink-0">
              <input 
                type="number" 
                value={sm.dose} 
                onChange={e => updateMedDose(sm.item, e.target.value)} 
                placeholder="0"
                className="w-10 sm:w-12 bg-transparent py-1 text-xs text-white text-right outline-none"
              />
              <span className="text-xs text-slate-400 font-medium">mg</span>
            </div>

            <div className="flex bg-slate-900 rounded-md p-1 border border-slate-700">
              <button 
                onClick={() => updateMedType(sm.item, 'daily_supplement')}
                className={twMerge("px-2 py-1 text-[10px] sm:text-xs rounded transition-colors", sm.type === 'daily_supplement' ? "bg-slate-700 text-white" : "text-slate-500")}
              >Daily</button>
              <button 
                onClick={() => updateMedType(sm.item, 'rescue_medication')}
                className={twMerge("px-2 py-1 text-[10px] sm:text-xs rounded transition-colors", sm.type === 'rescue_medication' ? "bg-rose-500/20 text-rose-400" : "text-slate-500")}
              >Rescue</button>
            </div>
          </div>
        ))}
      </div>

      {/* Manual Weather Fallback */}
      {weatherFallback && (
        <div className="p-4 border border-orange-500/30 bg-orange-500/5 rounded-xl space-y-3">
          <p className="text-sm text-orange-400 font-semibold flex items-center gap-2">
            <CloudRain size={16} /> Manual Weather Fallback
          </p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <input placeholder="Temp (°C)" value={manualWeather.temp} onChange={e => setManualWeather({...manualWeather, temp: e.target.value})} className="bg-slate-800 border-slate-700 rounded p-2 text-white" />
            <input placeholder="Humidity (%)" value={manualWeather.humidity} onChange={e => setManualWeather({...manualWeather, humidity: e.target.value})} className="bg-slate-800 border-slate-700 rounded p-2 text-white" />
            <input placeholder="Pressure (hPa)" value={manualWeather.pressure} onChange={e => setManualWeather({...manualWeather, pressure: e.target.value})} className="bg-slate-800 border-slate-700 rounded p-2 text-white" />
            <input placeholder="UV Index" value={manualWeather.uv} onChange={e => setManualWeather({...manualWeather, uv: e.target.value})} className="bg-slate-800 border-slate-700 rounded p-2 text-white" />
          </div>
        </div>
      )}

      {/* Save Button */}
      <div className="flex gap-3">
        {editingLog && onClearEdit && (
          <button 
            onClick={onClearEdit} disabled={isSaving}
            className="w-1/3 bg-slate-800 hover:bg-slate-700 text-white font-semibold py-4 rounded-xl shadow-lg border border-slate-700 transition-all active:scale-95"
          >
            Cancel
          </button>
        )}
        <button 
          onClick={handleSave} disabled={isSaving}
          className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 transition-all active:scale-95"
        >
          {isSaving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
          {isSaving ? 'Saving...' : (editingLog ? 'Update Record' : 'Save Record')}
        </button>
      </div>

    </div>
  );
}
