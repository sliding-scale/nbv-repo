import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { LoaderCircle, Plus, Search } from 'lucide-react'
import Button from '../components/common/Button'
import Card from '../components/common/Card'
import ConfirmDialog from '../components/common/ConfirmDialog'
import EmptyState from '../components/common/EmptyState'
import PageHeading from '../components/common/PageHeading'
import { inputClass } from '../components/common/inputClass'
import VehicleFormModal from '../components/vehicles/VehicleFormModal'
import VehiclesTable from '../components/vehicles/VehiclesTable'
import VehicleDetailsModal from '../components/vehicle-details/VehicleDetailsModal'
import { useStudents } from '../store/StudentsContext'
import { useVehicles } from '../store/VehiclesContext'
import { indexById } from '../utils/dashboard'
import { readMutationError } from '../utils/errors'

const statusFilters = [
  { id: 'all', label: 'All statuses' },
  { id: 'active', label: 'Active' },
  { id: 'inactive', label: 'Inactive' },
]

export default function VehiclesPage() {
  const { vehicles, isLoading, addVehicle, updateVehicle, deleteVehicle, setVehicleStatus } = useVehicles()
  const { students } = useStudents()
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  // { vehicle: null } = adding, { vehicle } = editing, null = closed
  const [form, setForm] = useState(null)
  // { type: 'delete' | 'deactivate', vehicle } | null
  const [confirm, setConfirm] = useState(null)
  const [viewingId, setViewingId] = useState(null)
  const [params, setParams] = useSearchParams()
  const requestedId = params.get('vehicle')

  // The top-bar search arrives as ?vehicle=<id>, opens that van once, then drops the id.
  useEffect(() => {
    if (!requestedId || isLoading) return
    if (vehicles.some((vehicle) => vehicle.id === requestedId)) setViewingId(requestedId)
    const next = new URLSearchParams(params)
    next.delete('vehicle')
    setParams(next, { replace: true })
  }, [requestedId, isLoading, vehicles, params, setParams])

  const studentsById = useMemo(() => indexById(students), [students])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return vehicles.filter((v) => {
      if (statusFilter !== 'all' && v.status !== statusFilter) return false
      if (!q) return true
      return [v.name, v.registrationNumber, v.model, v.driverName]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(q))
    })
  }, [vehicles, query, statusFilter])

  const activeCount = vehicles.filter((v) => v.status === 'active').length
  const closeForm = useCallback(() => setForm(null), [])
  const closeConfirm = useCallback(() => setConfirm(null), [])

  // The vehicle and its riders are saved together in one backend transaction.
  // Errors are thrown back to the form, which shows them next to the right field.
  const handleSave = async (data) => {
    if (form.vehicle) await updateVehicle(form.vehicle.id, data)
    else await addVehicle(data)
    setForm(null)
  }

  const run = async (action) => {
    try {
      await action()
    } catch (err) {
      window.alert(readMutationError(err).message)
    }
  }

  const handleToggleStatus = (vehicle) => {
    if (vehicle.status === 'inactive') run(() => setVehicleStatus(vehicle.id, 'active'))
    else setConfirm({ type: 'deactivate', vehicle })
  }

  const handleConfirm = () => {
    const { type, vehicle } = confirm
    setConfirm(null)
    if (type === 'delete') run(() => deleteVehicle(vehicle.id))
    else run(() => setVehicleStatus(vehicle.id, 'inactive'))
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeading
        title="Vehicle management"
        description={`${vehicles.length} vehicles · ${activeCount} active · ${vehicles.length - activeCount} inactive`}
      >
        <Button icon={Plus} onClick={() => setForm({ vehicle: null })}>
          Add vehicle
        </Button>
      </PageHeading>

      <Card>
        <div className="-mx-5 -mt-4 -mb-5">
          <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center">
            <label className="relative flex-1">
              <Search size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name, registration, driver or device…"
                className={`${inputClass()} pl-9`}
              />
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`${inputClass()} sm:w-44`}
              aria-label="Filter by status"
            >
              {statusFilters.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center gap-2 p-10 text-sm text-slate-500">
              <LoaderCircle size={18} className="animate-spin" /> Loading vehicles…
            </div>
          ) : visible.length === 0 ? (
            <div className="p-8 text-center">
              <EmptyState>
                {vehicles.length === 0 ? 'No vehicles yet. Add your first van to get started.' : 'No vehicles match your search.'}
              </EmptyState>
            </div>
          ) : (
            <VehiclesTable
              vehicles={visible}
              studentsById={studentsById}
              onView={(vehicle) => setViewingId(vehicle.id)}
              onEdit={(vehicle) => setForm({ vehicle })}
              onToggleStatus={handleToggleStatus}
              onDelete={(vehicle) => setConfirm({ type: 'delete', vehicle })}
            />
          )}
        </div>
      </Card>

      {form && (
        <VehicleFormModal
          key={form.vehicle?.id ?? 'new'}
          open
          vehicle={form.vehicle}
          vehicles={vehicles}
          students={students}
          onSave={handleSave}
          onClose={closeForm}
        />
      )}

      {(() => {
        const viewing = vehicles.find((v) => v.id === viewingId)
        return viewing ? <VehicleDetailsModal vehicle={viewing} onClose={() => setViewingId(null)} /> : null
      })()}

      <ConfirmDialog
        open={Boolean(confirm)}
        onCancel={closeConfirm}
        onConfirm={handleConfirm}
        danger={confirm?.type === 'delete'}
        title={confirm?.type === 'delete' ? `Delete ${confirm.vehicle.name}?` : `Deactivate ${confirm?.vehicle.name}?`}
        confirmLabel={confirm?.type === 'delete' ? 'Delete vehicle' : 'Deactivate'}
        message={
          confirm?.type === 'delete'
            ? `This permanently removes ${confirm.vehicle.name} (${confirm.vehicle.registrationNumber}), unassigns its students and deletes its trip and GPS history. This can't be undone.`
            : 'The van will be marked out of service. Its students and settings are kept, and you can reactivate it at any time.'
        }
      />
    </div>
  )
}
