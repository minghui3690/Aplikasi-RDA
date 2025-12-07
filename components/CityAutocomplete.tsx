
import React, { useState, useEffect, useRef } from 'react';

interface CityAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
}

// Simulated Database of Cities (Expanded with Indonesian Cities)
const CITIES_DB = [
  // --- INDONESIA (Major Cities & Regencies) ---
  // Sumatera
  "Banda Aceh, Aceh, Indonesia",
  "Lhokseumawe, Aceh, Indonesia",
  "Langsa, Aceh, Indonesia",
  "Medan, North Sumatra, Indonesia",
  "Pematangsiantar, North Sumatra, Indonesia",
  "Binjai, North Sumatra, Indonesia",
  "Padang, West Sumatra, Indonesia",
  "Bukittinggi, West Sumatra, Indonesia",
  "Pekanbaru, Riau, Indonesia",
  "Dumai, Riau, Indonesia",
  "Tanjung Pinang, Riau Islands, Indonesia",
  "Batam, Riau Islands, Indonesia",
  "Jambi City, Jambi, Indonesia",
  "Palembang, South Sumatra, Indonesia",
  "Lubuklinggau, South Sumatra, Indonesia",
  "Bengkulu City, Bengkulu, Indonesia",
  "Bandar Lampung, Lampung, Indonesia",
  "Metro, Lampung, Indonesia",
  "Pangkal Pinang, Bangka Belitung, Indonesia",
  
  // Java
  "Jakarta, Jakarta, Indonesia",
  "North Jakarta, Jakarta, Indonesia",
  "West Jakarta, Jakarta, Indonesia",
  "Central Jakarta, Jakarta, Indonesia",
  "South Jakarta, Jakarta, Indonesia",
  "East Jakarta, Jakarta, Indonesia",
  "Serang, Banten, Indonesia",
  "Cilegon, Banten, Indonesia",
  "Tangerang, Banten, Indonesia",
  "South Tangerang, Banten, Indonesia",
  "Bandung, West Java, Indonesia",
  "Bogor, West Java, Indonesia",
  "Depok, West Java, Indonesia",
  "Bekasi, West Java, Indonesia",
  "Cirebon, West Java, Indonesia",
  "Sukabumi, West Java, Indonesia",
  "Tasikmalaya, West Java, Indonesia",
  "Cimahi, West Java, Indonesia",
  "Semarang, Central Java, Indonesia",
  "Surakarta (Solo), Central Java, Indonesia",
  "Tegal, Central Java, Indonesia",
  "Pekalongan, Central Java, Indonesia",
  "Salatiga, Central Java, Indonesia",
  "Magelang, Central Java, Indonesia",
  "Yogyakarta, DI Yogyakarta, Indonesia",
  "Surabaya, East Java, Indonesia",
  "Malang, East Java, Indonesia",
  "Kediri, East Java, Indonesia",
  "Madiun, East Java, Indonesia",
  "Mojokerto, East Java, Indonesia",
  "Probolinggo, East Java, Indonesia",
  "Pasuruan, East Java, Indonesia",
  "Blitar, East Java, Indonesia",
  "Batu, East Java, Indonesia",

  // Bali & Nusa Tenggara
  "Denpasar, Bali, Indonesia",
  "Singaraja, Bali, Indonesia",
  "Mataram, West Nusa Tenggara, Indonesia",
  "Bima, West Nusa Tenggara, Indonesia",
  "Kupang, East Nusa Tenggara, Indonesia",

  // Kalimantan
  "Pontianak, West Kalimantan, Indonesia",
  "Singkawang, West Kalimantan, Indonesia",
  "Palangka Raya, Central Kalimantan, Indonesia",
  "Banjarmasin, South Kalimantan, Indonesia",
  "Banjarbaru, South Kalimantan, Indonesia",
  "Samarinda, East Kalimantan, Indonesia",
  "Balikpapan, East Kalimantan, Indonesia",
  "Bontang, East Kalimantan, Indonesia",
  "Tarakan, North Kalimantan, Indonesia",

  // Sulawesi
  "Manado, North Sulawesi, Indonesia",
  "Bitung, North Sulawesi, Indonesia",
  "Tomohon, North Sulawesi, Indonesia",
  "Kotamobagu, North Sulawesi, Indonesia",
  "Gorontalo City, Gorontalo, Indonesia",
  "Palu, Central Sulawesi, Indonesia",
  "Makassar, South Sulawesi, Indonesia",
  "Parepare, South Sulawesi, Indonesia",
  "Palopo, South Sulawesi, Indonesia",
  "Kendari, Southeast Sulawesi, Indonesia",
  "Bau-Bau, Southeast Sulawesi, Indonesia",

  // Maluku & Papua
  "Ambon, Maluku, Indonesia",
  "Tual, Maluku, Indonesia",
  "Ternate, North Maluku, Indonesia",
  "Tidore Kepulauan, North Maluku, Indonesia",
  "Jayapura, Papua, Indonesia",
  "Sorong, West Papua, Indonesia",
  "Manokwari, West Papua, Indonesia",
  "Merauke, South Papua, Indonesia",

  // --- INTERNATIONAL (Selected Major Cities) ---
  "Medellín, Antioquia, Colombia",
  "Medina, Medina Region, Saudi Arabia",
  "New York, New York, United States",
  "Los Angeles, California, United States",
  "London, England, United Kingdom",
  "Paris, Île-de-France, France",
  "Tokyo, Tokyo, Japan",
  "Seoul, Seoul, South Korea",
  "Beijing, Beijing, China",
  "Shanghai, Shanghai, China",
  "Mumbai, Maharashtra, India",
  "Singapore, Singapore",
  "Kuala Lumpur, Federal Territory, Malaysia",
  "Bangkok, Bangkok, Thailand",
  "Sydney, New South Wales, Australia",
  "Melbourne, Victoria, Australia",
  "Berlin, Berlin, Germany",
  "Dubai, Dubai, United Arab Emirates",
  "Istanbul, Istanbul, Turkey",
  "Moscow, Moscow, Russia",
  "Mecca, Makkah, Saudi Arabia"
];

const CityAutocomplete: React.FC<CityAutocompleteProps> = ({ value, onChange }) => {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    // Click outside handler
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    onChange(val);

    if (val.length > 1) {
      // Limit to top 10 matches for performance in UI
      const filtered = CITIES_DB.filter(city => 
        city.toLowerCase().includes(val.toLowerCase())
      ).slice(0, 10);
      setSuggestions(filtered);
      setIsOpen(true);
    } else {
      setSuggestions([]);
      setIsOpen(false);
    }
  };

  const handleSelectCity = (city: string) => {
    setQuery(city);
    onChange(city);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <input
        type="text"
        value={query}
        onChange={handleInputChange}
        onFocus={() => query.length > 1 && setIsOpen(true)}
        className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        placeholder="Type to search city (e.g., Surabaya, Medan)..."
      />
      
      {isOpen && suggestions.length > 0 && (
        <ul className="absolute z-50 w-full bg-white border border-gray-200 rounded-lg mt-1 max-h-60 overflow-y-auto shadow-xl">
          {suggestions.map((city, idx) => (
            <li
              key={idx}
              onClick={() => handleSelectCity(city)}
              className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-sm text-gray-700 border-b border-gray-50 last:border-0"
            >
              {city}
            </li>
          ))}
        </ul>
      )}
      
      {isOpen && query.length > 1 && suggestions.length === 0 && (
        <div className="absolute z-50 w-full bg-white border border-gray-200 rounded-lg mt-1 p-3 shadow-lg text-sm text-gray-500">
          No cities found in database.
        </div>
      )}
    </div>
  );
};

export default CityAutocomplete;
