import React from 'react'
import { motion } from 'framer-motion'
import { MapPin, Train, TreePine, Coffee, Utensils, Landmark, Plane, Ship } from 'lucide-react'

type Event = {
  time: string
  activity_type: 'arrival'|'sightseeing'|'departure'|'travel'
  location?: string
  description?: string
  duration_minutes?: number
  from?: string
  to?: string
  travel_time_minutes?: number
  distance_km?: number
}

export default function TravelBrochure({ events }: { events: Event[] }): JSX.Element {
  const iconFor = (ev: Event) => {
    switch (ev.activity_type) {
      case 'arrival': return Plane
      case 'departure': return Ship
      case 'travel': return Train
      case 'sightseeing': return TreePine
      default: return MapPin
    }
  }
  const colorFor = (ev: Event) => {
    switch (ev.activity_type) {
      case 'arrival': return 'text-blue-600'
      case 'departure': return 'text-purple-600'
      case 'travel': return 'text-amber-600'
      case 'sightseeing': return 'text-emerald-600'
      default: return 'text-gray-600'
    }
  }
  const titleFor = (ev: Event) => {
    if (ev.activity_type === 'sightseeing') return ev.location || 'スポット'
    if (ev.activity_type === 'arrival' || ev.activity_type === 'departure') return ev.description || (ev.activity_type === 'arrival' ? '到着' : '出発')
    if (ev.activity_type === 'travel') return `${ev.from ?? ''} → ${ev.to ?? ''}`.trim()
    return ev.description || ''
  }
  const descFor = (ev: Event) => {
    if (ev.activity_type === 'sightseeing') return `滞在 ${ev.duration_minutes ?? '-'}分`
    if (ev.activity_type === 'travel') return `移動 ${ev.distance_km ?? '-'}km / ${ev.travel_time_minutes ?? '-'}分`
    return ev.description || ''
  }

  return (
    <motion.div className="w-full max-w-md md:max-w-lg mx-auto bg-white rounded-3xl shadow-lg overflow-hidden border-4 border-gray-200"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 relative">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 font-medium">travel brochure</p>
            <div className="flex items-center gap-2 mt-1">
              <h1 className="text-xl font-bold text-gray-800">旅のしおり</h1>
            </div>
          </div>
          <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
            <div className="w-8 h-8 bg-gray-400 rounded-full" />
          </div>
        </div>
        <p className="text-sm text-gray-600 mt-2 italic">Have a nice day!</p>
      </div>

      <div className="p-4 md:p-6 relative bg-cover bg-center bg-no-repeat" style={{ backgroundImage: "url('/beach.jpg')" }}>
        <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px]" />
        <div className="relative z-10">
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200" />
          {events.map((ev, index) => {
            const IconComponent = iconFor(ev)
            const color = colorFor(ev)
            return (
              <motion.div key={index} className="relative flex items-start gap-3 md:gap-4 pb-5 md:pb-6 last:pb-0"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: index * 0.05 }}
                whileHover={{ scale: 1.01 }}
              >
                <div className="w-14 md:w-16 text-right">
                  <span className="text-xs md:text-sm font-semibold text-gray-700">{ev.time}</span>
                </div>
                <div className={`relative z-10 w-7 h-7 md:w-8 md:h-8 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center ${color}`}>
                  <IconComponent size={14} className="md:hidden" />
                  <IconComponent size={16} className="hidden md:block" />
                  {index < events.length - 1 && (
                    <div className="absolute top-8 left-1/2 transform -translate-x-1/2 text-gray-300">⋮</div>
                  )}
                </div>
                <div className="flex-1 pt-0.5 md:pt-1">
                  <h3 className="font-semibold text-gray-800 text-sm md:text-base">{titleFor(ev)}</h3>
                  <p className="text-xs md:text-sm text-gray-500 mt-0.5">{descFor(ev)}</p>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      <div className="px-6 pb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-6 bg-green-200 rounded-sm flex items-center justify-center">
              <MapPin size={12} className="text-green-700" />
            </div>
            <div className="w-12 h-1 border-t-2 border-dashed border-gray-300" />
            <div className="w-6 h-4 bg-gray-200 rounded-sm" />
          </div>
          <div className="w-12 h-10 bg-amber-100 rounded border-2 border-amber-200 flex items-center justify-center">
            <div className="w-2 h-2 bg-amber-400 rounded-full" />
          </div>
        </div>
      </div>
    </motion.div>
  )
}


