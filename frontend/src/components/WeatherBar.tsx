import React from 'react'

type Weather = { temperatureC?: number; humidity?: number; raining?: boolean; feelsIcon?: string }

type Props = { weather: Weather | null }

export const WeatherBar: React.FC<Props> = ({ weather }) => {
  if (!weather) return null
  const t = weather.temperatureC ?? undefined
  const humid = weather.humidity ?? undefined
  const isRain = !!weather.raining
  const cls = isRain ? 'weatherbar weatherbar--rain' : classifyTemp(t)
  const icon = isRain ? '☔' : iconForTemp(t)
  return (
    <div className={cls} aria-label="現在の天気">
      <div className="weatherbar__left">
        <span className="weatherbar__icon" aria-hidden>{icon}</span>
        {typeof t === 'number' && (<span className="weatherbar__temp">{t.toFixed(1)}℃</span>)}
        {typeof humid === 'number' && (<span className="weatherbar__hum">湿度 {humid}%</span>)}
      </div>
      <div className="weatherbar__right">
        {weather.feelsIcon && <span title="体感">{weather.feelsIcon}</span>}
      </div>
    </div>
  )
}

function classifyTemp(t?: number) {
  if (typeof t !== 'number') return 'weatherbar weatherbar--mild'
  if (t <= 8) return 'weatherbar weatherbar--cold'
  if (t >= 28) return 'weatherbar weatherbar--hot'
  return 'weatherbar weatherbar--mild'
}

function iconForTemp(t?: number) {
  if (typeof t !== 'number') return '⛅'
  if (t <= 8) return '❄️'
  if (t >= 28) return '☀️'
  return '⛅'
}






