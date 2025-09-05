import useFilterState from 'lib/useFilterState'
import { useEffect, useState } from 'react'
import { supabase } from 'lib/supabaseClient'
import { ProductJob } from 'lib/definitions'
import { useRouter } from 'next/router'
import { CalendarIcon, MapPinIcon, UserGroupIcon } from '@heroicons/react/24/solid'

export default function JobList() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [jobs, setJobs] = useState<ProductJob[]>([])
  const filterState = useFilterState()
  const searchText = filterState.q
  const selectedTypes = filterState.types

  useEffect(() => {
    loadPage()
  }, [searchText])

  // Fetch page data
  const loadPage = async () => {
    try {
      setLoading(true)

      // Build the query for enriched jobs table
      const fetchJobs = supabase.from('jobs').select(
        `
        id, title, description, type, created_at, apply_url,
        company, seniority_level, location_metro, work_arrangement,
        salary_min, salary_max, company_stage, primary_responsibilities
        `
      )

      // Use Postgres FTS if the user has searched
      if (searchText) {
        fetchJobs.textSearch('fts', searchText)
      }

      // Fetch all data
      const { data, error } = await fetchJobs.order('title')
      if (error) throw error
      console.log('data', data)
      setJobs((data as ProductJob[]) || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  // Apply filters on the client
  let filtered: ProductJob[] = jobs
  if (selectedTypes.length) filtered = filtered.filter((x) => selectedTypes.includes(x.type))

  // Render results
  return (
    <div className="flex flex-col w-full ">
      <div className="shadow-md overflow-hidden sm:rounded-md divide-y">
        {filtered.map((job) => (
          <JobCard job={job} key={job.id} />
        ))}
      </div>
    </div>
  )
}

const JobCard = ({ job }: { job: ProductJob }) => {
  return (
    <a href="#" className="block hover:bg-gray-50">
      <div className="flex items-center px-4">
        <div className="flex-shrink-0">
          <img
            className="h-12 w-12 rounded-md"
            src={
              'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
            }
            alt=""
          />
        </div>
        <div className="px-4 py-4 flex-1">
          <div className="flex items-center justify-between">
            <p className="text-md font-bold truncate text-brand">
              {job.title} at {job.company}
            </p>
            <div className="ml-2 flex-shrink-0 flex">
              <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-brand-100 text-brand-800">
                {job.type}
              </p>
            </div>
          </div>
          <div className="mt-2 sm:flex sm:justify-between">
            <div className="sm:flex">
              <p className="flex items-center text-sm text-gray-500">
                <UserGroupIcon
                  className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400"
                  aria-hidden="true"
                />
                {job.seniority_level || 'PM Role'}
              </p>
              <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                <MapPinIcon
                  className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400"
                  aria-hidden="true"
                />
                {job.location_metro || job.work_arrangement || 'Remote'}
              </p>
            </div>
            <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
              <CalendarIcon
                className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400"
                aria-hidden="true"
              />
              <p>
                {job.salary_min && job.salary_max 
                  ? `$${job.salary_min}k - $${job.salary_max}k`
                  : 'Competitive Salary'
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    </a>
  )
}
