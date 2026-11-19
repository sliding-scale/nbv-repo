import { useMemo } from 'react'
import { useConvexAuth, useMutation, useQuery } from 'convex/react'
import { api } from '@backend/_generated/api'
import { useAdminAuth } from '../auth/AuthContext'
import { ParentsContext } from './ParentsContext'
import { StudentsContext } from './StudentsContext'
import { VehiclesContext } from './VehiclesContext'
import { computeParentTracking } from '../utils/tracking'

/*
 * All admin data comes from Convex (backend/convex/admin/*). Every mutation returns a
 * promise that rejects with a ConvexError ({ field, message }) when the backend rejects input.
 * The UI uses `id`; Convex documents use `_id`, so each list is mapped once here.
 */

const EMPTY = []
const withId = (docs) => (docs ? docs.map((d) => ({ ...d, id: d._id })) : EMPTY)

/**
 * Flatten a vehicle's latest tracker report into the fields the UI reads.
 * A vehicle whose tracker has never reported is shown as offline with no location.
 */
function toVehicleView(doc, studentIds, parentTracking) {
  const t = doc.telemetry
  return {
    ...doc,
    id: doc._id,
    studentIds,
    // Effective tracking (van switch + its riders' parents' switches). See utils/tracking.js.
    parentTracking,
    ignition: t?.ignition ?? 'off',
    speed: t?.speed ?? 0,
    gpsStatus: t?.gpsStatus ?? 'offline',
    location: t ? { address: t.address, lat: t.lat, lng: t.lng } : null,
    lastUpdated: t?.reportedAt ?? null,
    heading: t?.heading ?? null, // degrees, from the tracker (Falcon-i "angle")
  }
}

export default function FleetProvider({ children }) {
  // This provider also wraps /login, so only load admin data once Convex has the Clerk
  // sign-in and the user is an admin (otherwise the backend rejects these queries).
  const { isAuthenticated } = useConvexAuth()
  const { isAdmin } = useAdminAuth()
  const args = isAuthenticated && isAdmin ? {} : 'skip'
  const studentDocs = useQuery(api.admin.students.list, args)
  const parentDocs = useQuery(api.admin.parents.list, args)
  const vehicleDocs = useQuery(api.admin.vehicles.list, args)
  const schedule = useQuery(api.admin.trackingSchedule.get, args)
  const scheduleReady = args === 'skip' || schedule !== undefined

  // Who can actually track which van. Recomputed whenever a van, student, parent, or the
  // school tracking hours change, so a closed schedule turns tracking off on every screen.
  const tracking = useMemo(
    () => computeParentTracking(vehicleDocs ?? EMPTY, studentDocs ?? EMPTY, parentDocs ?? EMPTY, schedule),
    [vehicleDocs, studentDocs, parentDocs, schedule],
  )

  // ----- students -----
  const createStudent = useMutation(api.admin.students.create)
  const updateStudent = useMutation(api.admin.students.update)
  const setStudentStatus = useMutation(api.admin.students.setStatus)
  const students = useMemo(() => withId(studentDocs), [studentDocs])

  const studentsValue = useMemo(
    () => ({
      students,
      isLoading: studentDocs === undefined || !scheduleReady,
      addStudent: (data) => createStudent(data),
      updateStudent: (id, data) => updateStudent({ id, ...data }),
      setStudentStatus: (id, status) => setStudentStatus({ id, status }),
    }),
    [students, studentDocs, scheduleReady, createStudent, updateStudent, setStudentStatus],
  )

  // ----- parents -----
  const createParent = useMutation(api.admin.parents.create)
  const updateParent = useMutation(api.admin.parents.update)
  const deactivateParent = useMutation(api.admin.parents.deactivate)
  const reactivateParent = useMutation(api.admin.parents.reactivate)
  const parents = useMemo(
    () => (parentDocs ? parentDocs.map((d) => ({ ...d, id: d._id, parentTracking: tracking.byParent[d._id] })) : EMPTY),
    [parentDocs, tracking],
  )

  const parentsValue = useMemo(
    () => ({
      parents,
      isLoading: parentDocs === undefined || !scheduleReady,
      trackingSchedule: schedule ?? null,
      // data = { fullName, email, phone, relationship, status, trackingEnabled, studentIds }
      addParent: (data) => createParent(data),
      updateParent: (id, data) => updateParent({ id, ...data }),
      deactivateParent: (id) => deactivateParent({ id }),
      reactivateParent: (id) => reactivateParent({ id }),
    }),
    [parents, parentDocs, schedule, scheduleReady, createParent, updateParent, deactivateParent, reactivateParent],
  )

  // ----- vehicles -----
  const createVehicle = useMutation(api.admin.vehicles.create)
  const updateVehicle = useMutation(api.admin.vehicles.update)
  const setVehicleStatus = useMutation(api.admin.vehicles.setStatus)
  const removeVehicle = useMutation(api.admin.vehicles.remove)
  const setVehicleTrackingMutation = useMutation(api.admin.vehicles.setParentTracking)

  const vehiclesValue = useMemo(() => {
    // Riders are stored on students (student.vehicleId).
    const ridersByVehicle = {}
    for (const s of students) if (s.vehicleId) (ridersByVehicle[s.vehicleId] ??= []).push(s.id)

    return {
      vehicles: vehicleDocs
        ? vehicleDocs.map((d) => toVehicleView(d, ridersByVehicle[d._id] ?? [], tracking.byVehicle[d._id]))
        : EMPTY,
      isLoading: vehicleDocs === undefined || !scheduleReady,
      // data = { name, registrationNumber, model, driverName, driverPhone, status, parentTrackingEnabled, studentIds }
      addVehicle: (data) => createVehicle(data),
      updateVehicle: (id, data) => updateVehicle({ id, ...data }),
      deleteVehicle: (id) => removeVehicle({ id }),
      setVehicleStatus: (id, status) => setVehicleStatus({ id, status }),
      setVehicleTracking: (id, enabled) => setVehicleTrackingMutation({ id, enabled }),
    }
  }, [vehicleDocs, students, tracking, scheduleReady, createVehicle, updateVehicle, removeVehicle, setVehicleStatus, setVehicleTrackingMutation])

  return (
    <VehiclesContext.Provider value={vehiclesValue}>
      <StudentsContext.Provider value={studentsValue}>
        <ParentsContext.Provider value={parentsValue}>{children}</ParentsContext.Provider>
      </StudentsContext.Provider>
    </VehiclesContext.Provider>
  )
}
