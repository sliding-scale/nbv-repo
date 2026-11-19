import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '@backend/_generated/api'
import Button from '../components/common/Button'
import Card from '../components/common/Card'
import FormField from '../components/common/FormField'
import PageHeading from '../components/common/PageHeading'
import Toggle from '../components/common/Toggle'
import { inputClass } from '../components/common/inputClass'
import { readMutationError } from '../utils/errors'

export default function SettingsPage() {
  const settings = useQuery(api.admin.finance.getSettings)
  const setSpeedLimit = useMutation(api.admin.finance.setSpeedLimit)
  const schedule = useQuery(api.admin.trackingSchedule.get)
  const saveSchedule = useMutation(api.admin.trackingSchedule.save)
  const refreshSchedule = useMutation(api.admin.trackingSchedule.refresh)

  const [limit, setLimit] = useState('')
  const [ready, setReady] = useState(false)
  const [limitError, setLimitError] = useState(null)
  const [savingLimit, setSavingLimit] = useState(false)
  const [limitSaved, setLimitSaved] = useState(false)
  const [trackingOn, setTrackingOn] = useState(true)
  const [pickupStart, setPickupStart] = useState('06:00')
  const [pickupEnd, setPickupEnd] = useState('08:00')
  const [dropoffStart, setDropoffStart] = useState('13:00')
  const [dropoffEnd, setDropoffEnd] = useState('15:00')
  const [scheduleReady, setScheduleReady] = useState(false)
  const [scheduleError, setScheduleError] = useState(null)
  const [savingSchedule, setSavingSchedule] = useState(false)
  const [scheduleSaved, setScheduleSaved] = useState(false)
  const refreshed = useRef(false)

  useEffect(() => {
    if (settings === undefined || ready) return
    setLimit(String(settings.speedLimitKmh))
    setReady(true)
  }, [settings, ready])

  useEffect(() => {
    if (refreshed.current) return
    refreshed.current = true
    refreshSchedule().catch(() => {})
  }, [refreshSchedule])

  useEffect(() => {
    if (schedule === undefined || scheduleReady) return
    setTrackingOn(schedule.enabled !== false)
    setPickupStart(schedule.pickupStart)
    setPickupEnd(schedule.pickupEnd)
    setDropoffStart(schedule.dropoffStart)
    setDropoffEnd(schedule.dropoffEnd)
    setScheduleReady(true)
  }, [schedule, scheduleReady])

  const savedLimit = settings?.speedLimitKmh
  const limitUnchanged = savedLimit != null && limit !== '' && Number(limit) === savedLimit

  const saveLimit = async () => {
    const speedLimitKmh = Number(limit)
    if (!limit || !Number.isSafeInteger(speedLimitKmh) || speedLimitKmh < 1) {
      setLimitError('Enter a whole number of km/h.')
      setLimitSaved(false)
      return
    }
    setSavingLimit(true)
    setLimitError(null)
    setLimitSaved(false)
    try {
      await setSpeedLimit({ speedLimitKmh })
      setLimit(String(speedLimitKmh))
      setLimitSaved(true)
    } catch (err) {
      setLimitError(readMutationError(err).message)
    } finally {
      setSavingLimit(false)
    }
  }

  const editTracking = (set) => (value) => {
    set(value)
    setScheduleError(null)
    setScheduleSaved(false)
  }

  const setSchoolTracking = async (on) => {
    setTrackingOn(on)
    setScheduleError(null)
    setScheduleSaved(false)
    setSavingSchedule(true)
    try {
      await saveSchedule({ enabled: on, pickupStart, pickupEnd, dropoffStart, dropoffEnd })
      setScheduleSaved(true)
    } catch (err) {
      setTrackingOn(!on)
      setScheduleError(readMutationError(err).message)
    } finally {
      setSavingSchedule(false)
    }
  }

  const scheduleUnchanged =
    schedule != null &&
    trackingOn === (schedule.enabled !== false) &&
    pickupStart === schedule.pickupStart &&
    pickupEnd === schedule.pickupEnd &&
    dropoffStart === schedule.dropoffStart &&
    dropoffEnd === schedule.dropoffEnd

  const saveTracking = async () => {
    setSavingSchedule(true)
    setScheduleError(null)
    setScheduleSaved(false)
    try {
      await saveSchedule({ enabled: trackingOn, pickupStart, pickupEnd, dropoffStart, dropoffEnd })
      setScheduleSaved(true)
    } catch (err) {
      setScheduleError(readMutationError(err).message)
    } finally {
      setSavingSchedule(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeading title="Settings" description="School-wide options for the admin console." />

      <Card
        title="Speed limit"
        subtitle="A van travelling faster than this raises a speed alert on the dashboard."
      >
        {settings === undefined ? (
          <p className="text-sm text-slate-500">Loading speed limit…</p>
        ) : (
          <div className="max-w-sm">
            <FormField
              label="Limit"
              htmlFor="speed-limit"
              required
              error={limitError}
              hint={savedLimit == null ? 'km/h' : `Saved limit: ${savedLimit} km/h`}
            >
              <input
                id="speed-limit"
                inputMode="numeric"
                autoComplete="off"
                value={limit}
                onChange={(e) => {
                  setLimit(e.target.value.replace(/[^\d]/g, ''))
                  setLimitError(null)
                  setLimitSaved(false)
                }}
                placeholder="60"
                className={inputClass(Boolean(limitError))}
              />
            </FormField>
            <div className="mt-4 flex items-center gap-3">
              <Button onClick={saveLimit} disabled={savingLimit || limitUnchanged || limit === ''}>
                {savingLimit ? 'Saving…' : 'Save limit'}
              </Button>
              {limitSaved && <span className="text-sm font-medium text-green-600">Saved</span>}
            </div>
          </div>
        )}
      </Card>

      <Card
        title="Parent tracking hours"
        subtitle="These hours turn tracking on and off for every parent. The switch turns it off for the whole school, including during pickup and drop-off."
      >
        {schedule === undefined ? (
          <p className="text-sm text-slate-500">Loading tracking hours…</p>
        ) : (
          <div className="max-w-lg space-y-4">
            <div className="rounded-lg border border-slate-200 p-4">
              <Toggle
                id="parent-tracking"
                label="Parent tracking"
                description={trackingOn ? 'Parents can track during pickup and drop-off.' : 'No parent can track until this is turned back on.'}
                checked={trackingOn}
                onChange={setSchoolTracking}
              />
            </div>
            <p className={`text-sm font-medium ${trackingOn && schedule.open ? 'text-green-700' : 'text-slate-600'}`}>
              {scheduleStatus({ ...schedule, enabled: trackingOn })}
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField label="Pickup starts" htmlFor="pickup-start" required>
                <TimeInput id="pickup-start" value={pickupStart} onChange={editTracking(setPickupStart)} />
              </FormField>
              <FormField label="Pickup ends" htmlFor="pickup-end" required>
                <TimeInput id="pickup-end" value={pickupEnd} onChange={editTracking(setPickupEnd)} />
              </FormField>
              <FormField label="Drop-off starts" htmlFor="dropoff-start" required>
                <TimeInput id="dropoff-start" value={dropoffStart} onChange={editTracking(setDropoffStart)} />
              </FormField>
              <FormField label="Drop-off ends" htmlFor="dropoff-end" required>
                <TimeInput id="dropoff-end" value={dropoffEnd} onChange={editTracking(setDropoffEnd)} />
              </FormField>
            </div>
            {scheduleError && <p className="text-xs text-red-600">{scheduleError}</p>}
            <div className="flex items-center gap-3">
              <Button onClick={saveTracking} disabled={savingSchedule || scheduleUnchanged}>
                {savingSchedule ? 'Saving…' : 'Save tracking hours'}
              </Button>
              {scheduleSaved && <span className="text-sm font-medium text-green-600">Saved</span>}
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}

const HOURS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']
const MINUTES = Array.from({ length: 60 }, (_, index) => String(index).padStart(2, '0'))

function clockParts(value) {
  const match = /^(\d{1,2}):(\d{2})/.exec(String(value ?? ''))
  let hour24 = match ? Number(match[1]) : 6
  if (!Number.isInteger(hour24) || hour24 < 0 || hour24 > 23) hour24 = 6
  const minute = match && MINUTES.includes(match[2]) ? match[2] : '00'
  const hour = hour24 % 12 || 12
  return { hour: String(hour), minute, meridiem: hour24 >= 12 ? 'PM' : 'AM' }
}

function clockValue({ hour, minute, meridiem }) {
  let hour24 = Number(hour)
  if (meridiem === 'AM') hour24 = hour24 === 12 ? 0 : hour24
  else hour24 = hour24 === 12 ? 12 : hour24 + 12
  return `${String(hour24).padStart(2, '0')}:${minute}`
}

function TimeInput({ id, value, onChange }) {
  const parts = clockParts(value)
  const setPart = (key) => (event) => onChange(clockValue({ ...parts, [key]: event.target.value }))
  return (
    <div className="flex gap-2">
      <select id={id} aria-label="Hour" value={parts.hour} onChange={setPart('hour')} className={inputClass()}>
        {HOURS.map((hour) => (
          <option key={hour} value={hour}>
            {hour}
          </option>
        ))}
      </select>
      <select aria-label="Minute" value={parts.minute} onChange={setPart('minute')} className={inputClass()}>
        {MINUTES.map((minute) => (
          <option key={minute} value={minute}>
            {minute}
          </option>
        ))}
      </select>
      <select aria-label="AM or PM" value={parts.meridiem} onChange={setPart('meridiem')} className={inputClass()}>
        <option value="AM">AM</option>
        <option value="PM">PM</option>
      </select>
    </div>
  )
}

function scheduleStatus(schedule) {
  if (schedule.enabled === false || schedule.reason === 'forced_off') return 'Parent tracking is turned off for the whole school.'
  if (schedule.reason === 'pickup') return 'Parents can track right now (pickup window).'
  if (schedule.reason === 'dropoff') return 'Parents can track right now (drop-off window).'
  return 'Tracking is off for parents right now (outside both windows).'
}
