import { createContext, useContext } from 'react'

export const StudentsContext = createContext(null)

/**
 * Returns { students, isLoading, addStudent, updateStudent, setStudentStatus }.
 * Backed by Convex: backend/convex/admin/students.ts. The mutations return promises.
 */
export function useStudents() {
  const ctx = useContext(StudentsContext)
  if (!ctx) throw new Error('useStudents must be used inside <FleetProvider>')
  return ctx
}
