import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const lat = '31.9539';
    const lon = '35.9106';

    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,surface_pressure,uv_index`;
    const aqiUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=european_aqi,pm10,pm2_5`;

    const [weatherRes, aqiRes] = await Promise.all([
      fetch(weatherUrl),
      fetch(aqiUrl)
    ]);

    if (!weatherRes.ok || !aqiRes.ok) {
      throw new Error('Failed to fetch from Open-Meteo');
    }

    const weatherData = await weatherRes.json();
    const aqiData = await aqiRes.json();

    const currentW = weatherData.current;
    const currentAqi = aqiData.current;

    return NextResponse.json({
      weather_temp: currentW.temperature_2m,
      weather_humidity: currentW.relative_humidity_2m,
      weather_pressure: currentW.surface_pressure,
      weather_uv: currentW.uv_index,
      weather_aqi: currentAqi.european_aqi,
      weather_pm: { pm25: currentAqi.pm2_5, pm10: currentAqi.pm10 }
    });
  } catch (error) {
    console.error('Weather API error:', error);
    return NextResponse.json({ error: 'Failed to fetch weather data' }, { status: 500 });
  }
}
