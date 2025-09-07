I'll review and update the implementation plan with the actual schema we've created, ensuring each phase is accurate and leverages the existing Supabase views and tables.

## Updated Implementation Plan (Phases 0-5) - Schema-Aligned

### Phase 0: Groundwork ✅ COMPLETED (v0.1.0)
**Status**: Released and deployed
- Branding updated to Product Careers
- CI/CD pipeline with GitHub Actions
- Placeholder routes scaffolded
- OLED theme tokens prepared
- Quality gates (lint, typecheck, build)

### Phase 1: Data Foundation ✅ COMPLETED (v0.2.0)
**Status**: Released, requires Supabase SQL execution
- Schema: `public.tags`, `public.job_tags`, `public.analytics_events` tables
- View: `public.jobs_with_tags` with inline FTS and tag aggregation
- API: `lib/api.ts` with typed `getJobs()` and `getJobById()`
- UI: JobList uses new view with search and empty states

**To Complete Phase 1**: Run `database/supabase_schema.sql` in Supabase SQL Editor

---

## Phase 2: Core UI & Filtering (R2 - Product-Specific Discovery)

### Objectives
- Replace generic filters with product management filters
- Implement tag system with clickable refinement
- Add job detail page with full context
- Implement apply flow with analytics tracking

### Step-by-Step Implementation

#### 2.1 Enhanced Filter State Management (Week 1)

**File: useFilterState.ts**
```typescript
// Replace existing with:
export type FilterState = {
  q?: string
  seniority?: string
  companyStage?: string
  location?: string
  workArrangement?: string
  tags: string[]
  page: number
  limit: number
}

// Add URL encoding/decoding for arrays and complex state
```

**File: `lib/api.ts` - Enhanced Query Builder**
```typescript
export type ListParams = FilterState & {
  offset?: number
}

export async function getJobs(params: ListParams) {
  const { q, seniority, companyStage, location, workArrangement, tags = [], limit = 20, offset = 0 } = params
  
  let query = supabase.from('jobs_with_tags').select('*')
  
  // Search with FTS
  if (q?.trim()) {
    query = query.textSearch('fts', q)
  }
  
  // Product-specific filters using actual schema fields
  if (seniority) {
    query = query.eq('seniority_level', seniority)
  }
  if (companyStage) {
    query = query.eq('company_stage_resolved', companyStage)
  }
  if (location) {
    query = query.eq('location_metro', location)
  }
  if (workArrangement) {
    query = query.eq('work_arrangement', workArrangement)
  }
  
  // Tag filtering - ALL selected tags must be present (AND logic)
  if (tags.length > 0) {
    query = query.contains('tag_names', tags)
  }
  
  const { data, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)
    
  if (error) throw error
  return data as JobWithTags[]
}

// Add filter options fetchers
export async function getFilterOptions() {
  const [seniorities, stages, locations, arrangements] = await Promise.all([
    supabase.from('jobs').select('seniority_level').not('seniority_level', 'is', null),
    supabase.from('jobs').select('company_stage_resolved').not('company_stage_resolved', 'is', null),
    supabase.from('jobs').select('location_metro').not('location_metro', 'is', null),
    supabase.from('jobs').select('work_arrangement').not('work_arrangement', 'is', null)
  ])
  
  return {
    seniorities: [...new Set(seniorities.data?.map(r => r.seniority_level))],
    stages: [...new Set(stages.data?.map(r => r.company_stage_resolved))],
    locations: [...new Set(locations.data?.map(r => r.location_metro))],
    arrangements: [...new Set(arrangements.data?.map(r => r.work_arrangement))]
  }
}
```

#### 2.2 Replace Filters Component (Week 1)

**File: Filters.tsx - Complete Rebuild**
```tsx
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { getFilterOptions } from 'lib/api'
import useFilterState from 'lib/useFilterState'

export default function Filters() {
  const [options, setOptions] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const filterState = useFilterState()

  useEffect(() => {
    loadOptions()
  }, [])

  const loadOptions = async () => {
    try {
      const data = await getFilterOptions()
      setOptions(data)
    } catch (e) {
      console.error('Failed to load filter options:', e)
    } finally {
      setLoading(false)
    }
  }

  const updateFilter = (key: string, value: string | null) => {
    const newQuery = { ...router.query }
    if (value) {
      newQuery[key] = value
    } else {
      delete newQuery[key]
    }
    router.push({ pathname: '/', query: newQuery }, undefined, { shallow: true })
  }

  const addTag = (tagName: string) => {
    const currentTags = filterState.tags
    if (!currentTags.includes(tagName)) {
      const newTags = [...currentTags, tagName]
      updateFilter('tags', newTags.join(','))
    }
  }

  const removeTag = (tagName: string) => {
    const newTags = filterState.tags.filter(t => t !== tagName)
    updateFilter('tags', newTags.length ? newTags.join(',') : null)
  }

  const clearAllFilters = () => {
    router.push('/', undefined, { shallow: true })
  }

  if (loading) return <div className="p-4">Loading filters...</div>

  return (
    <div className="space-y-6">
      {/* Clear All */}
      <button 
        onClick={clearAllFilters}
        className="text-sm text-blue-600 hover:text-blue-800"
      >
        Clear all filters
      </button>

      {/* Seniority Level */}
      <FilterGroup 
        title="Seniority Level"
        options={options.seniorities}
        selected={filterState.seniority}
        onChange={(value) => updateFilter('seniority', value)}
      />

      {/* Company Stage */}
      <FilterGroup 
        title="Company Stage"
        options={options.stages}
        selected={filterState.companyStage}
        onChange={(value) => updateFilter('companyStage', value)}
      />

      {/* Location */}
      <FilterGroup 
        title="Location"
        options={options.locations}
        selected={filterState.location}
        onChange={(value) => updateFilter('location', value)}
      />

      {/* Work Arrangement */}
      <FilterGroup 
        title="Work Arrangement"
        options={options.arrangements}
        selected={filterState.workArrangement}
        onChange={(value) => updateFilter('workArrangement', value)}
      />

      {/* Active Tags */}
      {filterState.tags.length > 0 && (
        <div>
          <h3 className="font-medium mb-2">Active Tags</h3>
          <div className="flex flex-wrap gap-2">
            {filterState.tags.map(tag => (
              <TagPill 
                key={tag} 
                name={tag} 
                removable 
                onRemove={() => removeTag(tag)} 
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

const FilterGroup = ({ title, options, selected, onChange }) => (
  <div>
    <h3 className="font-medium mb-2">{title}</h3>
    <select 
      value={selected || ''} 
      onChange={(e) => onChange(e.target.value || null)}
      className="w-full p-2 border rounded"
    >
      <option value="">All {title}</option>
      {options?.map(option => (
        <option key={option} value={option}>{option}</option>
      ))}
    </select>
  </div>
)
```

#### 2.3 Tag System Implementation (Week 1)

**File: `components/TagPill.tsx`**
```tsx
interface TagPillProps {
  name: string
  category?: string
  removable?: boolean
  onClick?: () => void
  onRemove?: () => void
}

export default function TagPill({ name, category, removable, onClick, onRemove }: TagPillProps) {
  const categoryColors = {
    product_area: 'bg-blue-100 text-blue-800 border-blue-200',
    skill: 'bg-green-100 text-green-800 border-green-200',
    methodology: 'bg-purple-100 text-purple-800 border-purple-200',
    technical: 'bg-orange-100 text-orange-800 border-orange-200',
    industry: 'bg-gray-100 text-gray-800 border-gray-200'
  }

  const colorClass = categoryColors[category] || categoryColors.skill

  return (
    <span 
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm border cursor-pointer hover:scale-105 transition-transform ${colorClass}`}
      onClick={onClick}
    >
      {name}
      {removable && (
        <button 
          onClick={(e) => { e.stopPropagation(); onRemove?.() }}
          className="ml-2 text-xs hover:text-red-600"
        >
          ×
        </button>
      )}
    </span>
  )
}
```

#### 2.4 Enhanced JobList with Tags (Week 1)

**File: JobList.tsx - Add Tag Integration**
```tsx
// Add to existing JobCard component:
<div className="mt-2 flex flex-wrap gap-1">
  {job.tag_names.slice(0, 5).map((tagName, idx) => {
    const category = job.tag_categories[idx]
    return (
      <TagPill 
        key={tagName}
        name={tagName}
        category={category}
        onClick={() => addTagToFilter(tagName)}
      />
    )
  })}
  {job.tag_names.length > 5 && (
    <span className="text-xs text-gray-500">+{job.tag_names.length - 5} more</span>
  )}
</div>

// Add helper function:
const addTagToFilter = (tagName: string) => {
  const currentTags = filterState.tags
  if (!currentTags.includes(tagName)) {
    const newTags = [...currentTags, tagName]
    router.push({
      pathname: '/',
      query: { ...router.query, tags: newTags.join(',') }
    }, undefined, { shallow: true })
  }
}
```

#### 2.5 Job Detail Page (Week 2)

**File: `pages/jobs/[id].tsx`**
```tsx
import { GetServerSideProps } from 'next'
import { getJobById } from 'lib/api'
import { JobWithTags } from 'lib/api'
import ApplyButton from 'components/ApplyButton'
import TagPill from 'components/TagPill'

interface Props {
  job: JobWithTags
}

export default function JobDetail({ job }: Props) {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">{job.title}</h1>
        <p className="text-xl text-gray-600">
          {job.company_name} • {job.location_metro} • {job.work_arrangement}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="prose max-w-none">
            <div dangerouslySetInnerHTML={{ __html: job.description || '' }} />
          </div>
        </div>

        <div className="space-y-6">
          <ApplyButton jobId={job.id} applyUrl={job.apply_url} companyName={job.company_name} />
          
          <div>
            <h3 className="font-semibold mb-2">Job Details</h3>
            <dl className="space-y-2 text-sm">
              <div><dt className="font-medium">Seniority:</dt><dd>{job.seniority_level}</dd></div>
              <div><dt className="font-medium">Company Stage:</dt><dd>{job.company_stage_resolved}</dd></div>
              <div><dt className="font-medium">Salary:</dt><dd>{job.salary_min && job.salary_max ? `$${job.salary_min.toLocaleString()} - $${job.salary_max.toLocaleString()}` : 'Not specified'}</dd></div>
            </dl>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Skills & Focus Areas</h3>
            <div className="flex flex-wrap gap-2">
              {job.tag_names.map((tagName, idx) => (
                <TagPill 
                  key={tagName}
                  name={tagName}
                  category={job.tag_categories[idx]}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  try {
    const job = await getJobById(params?.id as string)
    return { props: { job } }
  } catch (error) {
    return { notFound: true }
  }
}
```

#### 2.6 Apply Flow with Analytics (Week 2)

**File: `components/ApplyButton.tsx`**
```tsx
import { useState } from 'react'
import { trackEvent } from 'lib/analytics'

interface Props {
  jobId: string
  applyUrl: string | null
  companyName: string | null
}

export default function ApplyButton({ jobId, applyUrl, companyName }: Props) {
  const [applying, setApplying] = useState(false)

  const handleApply = async () => {
    setApplying(true)
    
    try {
      // Track apply click
      await trackEvent('apply_clicked', {
        job_id: jobId,
        company_name: companyName,
        source_section: 'detail_page'
      })

      // Validate and open URL
      if (applyUrl && isValidUrl(applyUrl)) {
        window.open(applyUrl, '_blank', 'noopener,noreferrer')
      } else {
        // Fallback
        alert(`Please visit ${companyName}'s website to apply for this position.`)
      }
    } catch (error) {
      console.error('Apply tracking failed:', error)
      // Still allow application even if tracking fails
      if (applyUrl) {
        window.open(applyUrl, '_blank', 'noopener,noreferrer')
      }
    } finally {
      setApplying(false)
    }
  }

  return (
    <button
      onClick={handleApply}
      disabled={applying}
      className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
    >
      {applying ? 'Opening...' : 'Apply for this role'}
    </button>
  )
}

const isValidUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}
```

**File: `lib/analytics.ts`**
```typescript
import { supabase } from './supabaseClient'

export async function trackEvent(eventName: string, eventData: Record<string, any>) {
  try {
    const { error } = await supabase
      .from('analytics_events')
      .insert({
        event_name: eventName,
        event_data: eventData,
        user_session_id: getSessionId(), // Generate/retrieve session ID
      })
    
    if (error) throw error
  } catch (error) {
    console.error('Analytics tracking failed:', error)
  }
}

function getSessionId(): string {
  let sessionId = localStorage.getItem('session_id')
  if (!sessionId) {
    sessionId = Math.random().toString(36).substring(2, 15)
    localStorage.setItem('session_id', sessionId)
  }
  return sessionId
}

// Event helpers
export const analytics = {
  searchPerformed: (query: string, resultsCount: number) =>
    trackEvent('search_performed', { query, results_count: resultsCount }),
  
  filterApplied: (filterType: string, filterValue: string, resultsCount: number) =>
    trackEvent('filter_applied', { filter_type: filterType, filter_value: filterValue, results_count: resultsCount }),
  
  tagClicked: (tagName: string, jobId: string, position: number) =>
    trackEvent('tag_clicked', { tag_name: tagName, job_id: jobId, position_in_list: position }),
  
  jobDetailViewed: (jobId: string, referrer: string) =>
    trackEvent('job_detail_viewed', { job_id: jobId, referrer }),
}
```

### Phase 2 Deliverables
- Product-specific filter sidebar with real data
- Clickable tag system with category colors
- Job detail page with full context
- Apply flow with external redirect and tracking
- Analytics events stored in Supabase
- URL state persistence for all filters

### Phase 2 Acceptance Criteria
- Filter composition works with AND logic
- Tags can be clicked to refine search
- Apply button opens new tab and logs event
- URL sharing reproduces exact filter state
- Zero results shows helpful suggestions

---

## Phase 3: OLED Theme & Polish (R3 - Design Excellence)

### Objectives
- Implement OLED black theme with sophisticated styling
- Add micro-interactions and loading states
- Ensure responsive design and accessibility
- Performance optimizations

### Step-by-Step Implementation

#### 3.1 OLED Theme Implementation (Week 1)

**File: globals.css - Activate OLED Theme**
```css
/* Apply OLED theme globally */
body {
  background: var(--background-primary);
  color: var(--text-primary);
}

/* Component-specific OLED classes */
.job-card {
  background: var(--background-tertiary);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  padding: 24px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.job-card:hover {
  background: var(--surface-elevated);
  border-color: var(--accent-primary);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 102, 255, 0.15);
}

.filter-sidebar {
  background: var(--background-secondary);
  border-right: 1px solid var(--border-subtle);
  backdrop-filter: blur(10px);
}

.search-input {
  background: var(--background-tertiary);
  border: 2px solid var(--border-subtle);
  border-radius: 16px;
  color: var(--text-primary);
  transition: all 0.2s ease;
}

.search-input:focus {
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 4px rgba(0, 102, 255, 0.1);
  outline: none;
}

.btn-primary {
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px 24px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 15px rgba(0, 102, 255, 0.3);
}
```

#### 3.2 Component Polish (Week 1)

**Update All Components with OLED Classes:**

1. **SearchBar.tsx**: Add `search-input` class
2. **JobList.tsx**: Add `job-card` classes to JobCard
3. **Filters.tsx**: Add `filter-sidebar` styling
4. **ApplyButton.tsx**: Use `btn-primary` class

#### 3.3 Responsive Design (Week 1)

**File: SidebarLayout.tsx - Enhanced Layout**
```tsx
// Update with responsive grid and mobile sidebar toggle
const [showMobileFilters, setShowMobileFilters] = useState(false)

return (
  <div className="min-h-screen bg-background-primary">
    <NavBar />
    <Hero />
    
    <div className="max-w-7xl mx-auto px-4">
      {/* Mobile filter toggle */}
      <div className="lg:hidden mb-4">
        <button 
          onClick={() => setShowMobileFilters(!showMobileFilters)}
          className="btn-secondary w-full"
        >
          {showMobileFilters ? 'Hide' : 'Show'} Filters
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters sidebar */}
        <aside className={`lg:col-span-1 ${showMobileFilters ? 'block' : 'hidden lg:block'}`}>
          <div className="filter-sidebar p-6 rounded-lg sticky top-4">
            <Filters />
          </div>
        </aside>

        {/* Main content */}
        <main className="lg:col-span-3">
          {children}
        </main>
      </div>
    </div>

    <Footer />
  </div>
)
```

#### 3.4 Loading States & Skeletons (Week 2)

**File: `components/LoadingStates.tsx`**
```tsx
export function JobCardSkeleton() {
  return (
    <div className="job-card animate-pulse">
      <div className="flex items-start space-x-4">
        <div className="w-12 h-12 bg-gray-700 rounded-md" />
        <div className="flex-1 space-y-2">
          <div className="h-6 bg-gray-700 rounded w-3/4" />
          <div className="h-4 bg-gray-700 rounded w-1/2" />
          <div className="flex space-x-2">
            <div className="h-6 bg-gray-700 rounded w-16" />
            <div className="h-6 bg-gray-700 rounded w-20" />
          </div>
        </div>
      </div>
    </div>
  )
}

export function JobListSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <JobCardSkeleton key={i} />
      ))}
    </div>
  )
}
```

#### 3.5 Accessibility Enhancements (Week 2)

**Focus management, ARIA labels, keyboard navigation:**
```tsx
// Add to all interactive components:
- aria-label attributes
- role attributes for custom elements
- keyboard event handlers (onKeyDown)
- focus-visible styles
- screen reader text for icons
```

### Phase 3 Deliverables
- OLED theme applied across all components
- Responsive design with mobile sidebar
- Loading skeletons and micro-interactions
- Accessibility compliance (WCAG AA)
- Performance optimizations

---

## Phase 4: Optional User Accounts (R4 - Saved Jobs)

### Objectives
- Basic authentication via Supabase Auth
- Saved jobs functionality
- User preferences

### Step-by-Step Implementation

#### 4.1 Supabase Auth Setup (Week 1)

**Add to `database/supabase_schema.sql`:**
```sql
-- Auth tables (Supabase handles auth.users automatically)
create table if not exists public.users (
  id uuid references auth.users(id) primary key,
  email text unique,
  created_at timestamptz default now()
);

create table if not exists public.saved_jobs (
  user_id uuid not null references public.users(id) on delete cascade,
  job_id text not null references public.jobs(id) on delete cascade,
  saved_at timestamptz default now(),
  primary key(user_id, job_id)
);

-- RLS policies
alter table public.users enable row level security;
alter table public.saved_jobs enable row level security;

create policy "Users can view own profile" on public.users for select using (auth.uid() = id);
create policy "Users can update own profile" on public.users for update using (auth.uid() = id);
create policy "Users can view own saved jobs" on public.saved_jobs for select using (auth.uid() = user_id);
create policy "Users can manage own saved jobs" on public.saved_jobs for all using (auth.uid() = user_id);
```

#### 4.2 Auth Context (Week 1)

**File: `lib/auth.tsx`**
```tsx
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import { User } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
```

#### 4.3 Saved Jobs API (Week 1)

**File: `lib/api.ts` - Add Saved Jobs Functions**
```typescript
export async function getSavedJobs(userId: string) {
  const { data, error } = await supabase
    .from('saved_jobs')
    .select(`
      job_id,
      saved_at,
      jobs_with_tags!inner(*)
    `)
    .eq('user_id', userId)
    .order('saved_at', { ascending: false })
  
  if (error) throw error
  return data.map(item => item.jobs_with_tags) as JobWithTags[]
}

export async function saveJob(userId: string, jobId: string) {
  const { error } = await supabase
    .from('saved_jobs')
    .insert({ user_id: userId, job_id: jobId })
  
  if (error) throw error
}

export async function unsaveJob(userId: string, jobId: string) {
  const { error } = await supabase
    .from('saved_jobs')
    .delete()
    .eq('user_id', userId)
    .eq('job_id', jobId)
  
  if (error) throw error
}

export async function isJobSaved(userId: string, jobId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('saved_jobs')
    .select('job_id')
    .eq('user_id', userId)
    .eq('job_id', jobId)
    .single()
  
  return !error && !!data
}
```

#### 4.4 Save Button Component (Week 2)

**File: `components/SaveButton.tsx`**
```tsx
import { useState, useEffect } from 'react'
import { useAuth } from 'lib/auth'
import { saveJob, unsaveJob, isJobSaved } from 'lib/api'
import { HeartIcon } from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid'

interface Props {
  jobId: string
}

export default function SaveButton({ jobId }: Props) {
  const { user } = useAuth()
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) {
      checkSavedStatus()
    }
  }, [user, jobId])

  const checkSavedStatus = async () => {
    if (!user) return
    try {
      const isSaved = await isJobSaved(user.id, jobId)
      setSaved(isSaved)
    } catch (error) {
      console.error('Failed to check saved status:', error)
    }
  }

  const toggleSave = async () => {
    if (!user) {
      // Show login modal
      return
    }

    setLoading(true)
    try {
      if (saved) {
        await unsaveJob(user.id, jobId)
        setSaved(false)
      } else {
        await saveJob(user.id, jobId)
        setSaved(true)
      }
    } catch (error) {
      console.error('Failed to toggle save:', error)
    } finally {
      setLoading(false)
    }
  }

  const Icon = saved ? HeartSolidIcon : HeartIcon

  return (
    <button
      onClick={toggleSave}
      disabled={loading}
      className={`p-2 rounded-full transition-colors ${
        saved 
          ? 'text-red-500 hover:text-red-600' 
          : 'text-gray-400 hover:text-red-500'
      }`}
      aria-label={saved ? 'Unsave job' : 'Save job'}
    >
      <Icon className="w-5 h-5" />
    </button>
  )
}
```

### Phase 4 Deliverables
- Supabase Auth integration
- User registration/login
- Save/unsave jobs functionality
- Saved jobs page
- User profile (basic)

---

## Phase 5: Optimization & Real-time (R5 - Performance & Live Updates)

### Objectives
- Database query optimization
- Client-side performance improvements
- Optional real-time job updates
- Admin analytics

### Step-by-Step Implementation

#### 5.1 Database Optimization (Week 1)

**Enhanced Indexes:**
```sql
-- Composite indexes for common filter combinations
create index if not exists idx_jobs_filters_combo1 on public.jobs(is_currently_active, seniority_level, company_stage) where is_currently_active = true;
create index if not exists idx_jobs_filters_combo2 on public.jobs(is_currently_active, location_metro, work_arrangement) where is_currently_active = true;
create index if not exists idx_jobs_text_search on public.jobs using gin(to_tsvector('english', title || ' ' || description || ' ' || company));

-- Materialized view for better performance (optional)
create materialized view if not exists public.job_search_index as
select * from public.jobs_with_tags;

create unique index on public.job_search_index(id);
create index on public.job_search_index using gin(fts);

-- Refresh function
create or replace function refresh_job_search_index()
returns void language sql as $$
  refresh materialized view concurrently public.job_search_index;
$$;
```

#### 5.2 Client Optimizations (Week 1)

**File: `lib/api.ts` - Caching & Debouncing**
```typescript
// Add query caching
const queryCache = new Map()

export async function getJobsCached(params: ListParams) {
  const cacheKey = JSON.stringify(params)
  
  if (queryCache.has(cacheKey)) {
    return queryCache.get(cacheKey)
  }
  
  const result = await getJobs(params)
  queryCache.set(cacheKey, result)
  
  // Clear cache after 5 minutes
  setTimeout(() => queryCache.delete(cacheKey), 300000)
  
  return result
}

// Debounced search
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(handler)
  }, [value, delay])

  return debouncedValue
}
```

#### 5.3 Real-time Updates (Week 2)

**File: `lib/realtime.ts`**
```typescript
import { supabase } from './supabaseClient'

export function useRealtimeJobs(onNewJob: (job: any) => void) {
  useEffect(() => {
    const subscription = supabase
      .channel('public:jobs')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'jobs' },
        (payload) => {
          onNewJob(payload.new)
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [onNewJob])
}

// Usage in JobList:
const [newJobsCount, setNewJobsCount] = useState(0)

useRealtimeJobs((newJob) => {
  // Check if new job matches current filters
  if (jobMatchesFilters(newJob, filterState)) {
    setNewJobsCount(prev => prev + 1)
  }
})

// Show notification
{newJobsCount > 0 && (
  <div className="bg-blue-600 text-white p-3 rounded-lg mb-4">
    {newJobsCount} new job{newJobsCount > 1 ? 's' : ''} available. 
    <button onClick={refreshList}>Refresh to see them</button>
  </div>
)}
```

#### 5.4 Analytics Dashboard (Week 2)

**File: `pages/admin/analytics.tsx`**
```tsx
// Basic admin analytics page
export default function Analytics() {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    loadAnalytics()
  }, [])

  const loadAnalytics = async () => {
    const { data } = await supabase.rpc('get_analytics_summary')
    setStats(data)
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Analytics Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Jobs" value={stats?.total_jobs} />
        <StatCard title="Active Jobs" value={stats?.active_jobs} />
        <StatCard title="Total Searches" value={stats?.total_searches} />
        <StatCard title="Apply Clicks" value={stats?.apply_clicks} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TopSearchTerms />
        <PopularTags />
      </div>
    </div>
  )
}
```

**Add Analytics RPC:**
```sql
create or replace function get_analytics_summary()
returns json language sql as $$
  select json_build_object(
    'total_jobs', (select count(*) from public.jobs),
    'active_jobs', (select count(*) from public.jobs where is_currently_active = true),
    'total_searches', (select count(*) from public.analytics_events where event_name = 'search_performed'),
    'apply_clicks', (select count(*) from public.analytics_events where event_name = 'apply_clicked')
  );
$$;
```

### Phase 5 Deliverables
- Optimized database queries and indexes
- Client-side caching and debouncing
- Real-time job notifications
- Basic admin analytics dashboard
- Performance monitoring

---

## Complete Phase Requirements Mapping

### Schema Alignment Summary
- **Existing**: `public.jobs` table with text ID and extensive PM-specific fields
- **Added**: `public.tags`, `public.job_tags`, `public.analytics_events`
- **View**: `public.jobs_with_tags` with inline FTS and tag aggregation
- **API**: Typed client using Supabase with proper filtering

### Release Schedule
- **R0**: v0.1.0 ✅ (Groundwork)
- **R1**: v0.2.0 ✅ (Data Foundation - requires SQL execution)
- **R2**: v0.3.0 (Core UI & Filtering - 2 weeks)
- **R3**: v0.4.0 (OLED Theme & Polish - 2 weeks)  
- **R4**: v0.5.0 (User Accounts - 1 week)
- **R5**: v0.6.0 (Optimization - 2 weeks)

Each phase builds incrementally and remains deployable, with the existing data pipeline continuing to populate the jobs table while we add the enhanced UI and filtering layers.

Similar code found with 1 license type