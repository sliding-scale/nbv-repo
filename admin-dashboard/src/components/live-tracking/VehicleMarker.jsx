import { AdvancedMarker } from '@vis.gl/react-google-maps'
import { Bus, Navigation2 } from 'lucide-react'
import { gpsLabelFor } from '../../config/gpsStatus'
import { useSpeedLimit } from '../../hooks/useSpeedLimit'
import { isSpeeding, movementStateFor, movementStates, positionOf } from '../../utils/liveTracking'

/**
 * One van on the live map: a coloured badge (arrow pointing along its heading while moving,
 * bus icon otherwise) with its name underneath. Stale/unavailable GPS is drawn faded.
 */
export default function VehicleMarker({ vehicle, highlighted, onClick }) {
  const speedLimit = useSpeedLimit()
  const stateId = movementStateFor(vehicle)
  const state = movementStates[stateId]
  const speeding = isSpeeding(vehicle, speedLimit)
  const stale = vehicle.gpsStatus !== 'online'
  const showArrow = stateId === 'moving' && vehicle.heading !== null

  return (
    <AdvancedMarker
      position={positionOf(vehicle)}
      onClick={() => onClick(vehicle)}
      zIndex={highlighted ? 1000 : stateId === 'moving' ? 500 : 100}
      title={`${vehicle.name} · ${state.label} · ${vehicle.speed} km/h · ${gpsLabelFor(vehicle)}`}
    >
      <div className={`flex cursor-pointer flex-col items-center ${stale ? 'opacity-60' : ''}`}>
        <div
          className={`grid size-9 place-items-center rounded-full border-2 border-white text-white shadow-lg transition-transform ${
            highlighted ? 'scale-125' : ''
          } ${speeding ? 'ring-4 ring-red-500/70' : highlighted ? 'ring-4 ring-blue-300' : ''}`}
          style={{ background: state.color }}
        >
          {showArrow ? (
            <Navigation2 size={17} fill="currentColor" style={{ transform: `rotate(${vehicle.heading}deg)` }} />
          ) : (
            <Bus size={17} />
          )}
        </div>
        <div className="mt-1 rounded bg-white/95 px-1.5 py-0.5 text-[0.68rem] leading-tight font-semibold whitespace-nowrap text-slate-800 shadow">
          {vehicle.name}
          {stateId === 'moving' && <span className="ml-1 font-normal text-slate-500 tabular-nums">{vehicle.speed} km/h</span>}
        </div>
      </div>
    </AdvancedMarker>
  )
}
