import { useCallback, useMemo, useState } from 'react'
import { LoaderCircle, Plus, Search } from 'lucide-react'
import Button from '../components/common/Button'
import Card from '../components/common/Card'
import ConfirmDialog from '../components/common/ConfirmDialog'
import EmptyState from '../components/common/EmptyState'
import PageHeading from '../components/common/PageHeading'
import { inputClass } from '../components/common/inputClass'
import StudentDetailsModal from '../components/students/StudentDetailsModal'
import StudentFormModal from '../components/students/StudentFormModal'
import StudentsTable from '../components/students/StudentsTable'
import { useParents } from '../store/ParentsContext'
import { useStudents } from '../store/StudentsContext'
import { useVehicles } from '../store/VehiclesContext'
import { indexById } from '../utils/dashboard'
import { readMutationError } from '../utils/errors'
import { collectSavedLocations } from '../utils/students'

export default function StudentsPage() {
  const { students, isLoading, addStudent, updateStudent, setStudentStatus } = useStudents()
  const { vehicles } = useVehicles()
  const { parents } = useParents()

  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [vehicleFilter, setVehicleFilter] = useState('all')

  const [viewingId, setViewingId] = useState(null)
  // { student: null } = adding, { student } = editing, null = closed
  const [form, setForm] = useState(null)
  const [deactivating, setDeactivating] = useState(null)

  const parentsById = useMemo(() => indexById(parents), [parents])
  const vehiclesById = useMemo(() => indexById(vehicles), [vehicles])
  const savedLocations = useMemo(() => collectSavedLocations(students), [students])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return students.filter((s) => {
      if (statusFilter !== 'all' && s.status !== statusFilter) return false
      if (vehicleFilter === 'none' && s.vehicleId) return false
      if (vehicleFilter !== 'all' && vehicleFilter !== 'none' && s.vehicleId !== vehicleFilter) return false
      if (!q) return true
      const parentNames = s.parentIds.map((id) => parentsById[id]?.fullName ?? '')
      return [s.fullName, s.gsId, ...parentNames].some((f) => f.toLowerCase().includes(q))
    })
  }, [students, query, statusFilter, vehicleFilter, parentsById])

  const activeCount = students.filter((s) => s.status === 'active').length
  const viewing = students.find((s) => s.id === viewingId)

  const closeForm = useCallback(() => setForm(null), [])

  // Errors are thrown back to the form, which shows them next to the right field.
  const handleSave = async (data) => {
    if (form.student) await updateStudent(form.student.id, data)
    else await addStudent(data)
    setForm(null)
  }

  const changeStatus = async (student, status) => {
    try {
      await setStudentStatus(student.id, status)
    } catch (err) {
      window.alert(readMutationError(err).message)
    }
  }

  const handleToggleStatus = (student) => {
    if (student.status === 'inactive') changeStatus(student, 'active')
    else setDeactivating(student)
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeading
        title="Student management"
        description={`${students.length} students · ${activeCount} active · ${students.length - activeCount} inactive`}
      >
        <Button icon={Plus} onClick={() => setForm({ student: null })}>
          Add student
        </Button>
      </PageHeading>

      <Card>
        <div className="-mx-5 -mt-4 -mb-5">
          <div className="flex flex-col gap-3 border-b border-slate-200 p-4 lg:flex-row lg:items-center">
            <label className="relative flex-1">
              <Search size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name, GS ID or parent…"
                className={`${inputClass()} pl-9`}
              />
            </label>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <select value={vehicleFilter} onChange={(e) => setVehicleFilter(e.target.value)} className={`${inputClass()} sm:w-44`} aria-label="Filter by vehicle">
                <option value="all">All vehicles</option>
                <option value="none">No vehicle</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={`${inputClass()} sm:w-36`} aria-label="Filter by status">
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center gap-2 p-10 text-sm text-slate-500">
              <LoaderCircle size={18} className="animate-spin" /> Loading students…
            </div>
          ) : visible.length === 0 ? (
            <div className="p-8 text-center">
              <EmptyState>{students.length === 0 ? 'No students yet. Add the first one to get started.' : 'No students match these filters.'}</EmptyState>
            </div>
          ) : (
            <StudentsTable
              students={visible}
              parentsById={parentsById}
              vehiclesById={vehiclesById}
              onView={(s) => setViewingId(s.id)}
              onEdit={(s) => setForm({ student: s })}
              onToggleStatus={handleToggleStatus}
            />
          )}
        </div>
      </Card>

      {viewing && (
        <StudentDetailsModal
          student={viewing}
          parentsById={parentsById}
          vehiclesById={vehiclesById}
          onClose={() => setViewingId(null)}
          onEdit={() => {
            setViewingId(null)
            setForm({ student: viewing })
          }}
        />
      )}

      {form && (
        <StudentFormModal
          key={form.student?.id ?? 'new'}
          student={form.student}
          students={students}
          parents={parents}
          vehicles={vehicles}
          savedLocations={savedLocations}
          onSave={handleSave}
          onClose={closeForm}
        />
      )}

      <ConfirmDialog
        open={Boolean(deactivating)}
        onCancel={() => setDeactivating(null)}
        onConfirm={() => {
          changeStatus(deactivating, 'inactive')
          setDeactivating(null)
        }}
        danger
        title={`Deactivate ${deactivating?.fullName}?`}
        confirmLabel="Deactivate"
        message="The student record is kept, including their vehicle and locations, but it is marked inactive. You can reactivate it at any time."
      />
    </div>
  )
}
