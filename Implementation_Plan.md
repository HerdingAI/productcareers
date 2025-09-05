# Implementation Plan: Climate Jobs → Product Careers Transformation

## Current State vs. Future State Gap Analysis

**Current State**: Basic climate job board with simple filtering, light theme, generic job structure
**Future State**: Sophisticated PM-focused platform with OLED design, advanced filtering, enriched data model

**Core Transformation Required**: 
1. Complete visual redesign (light → OLED black)
2. Data model adaptation (simple jobs → 98-field enriched PM data)
3. Advanced filtering system (basic → category + tag-based)
4. Professional UX patterns (generic → TrueUp/Wellfound inspired)

---

## Phase 1: Foundation & Data Layer (Week 1-2)

### 1.1 Update Data Architecture
**Goal**: Adapt existing job queries to work with enriched 98-field jobs table

**Tasks**:
```typescript
// Update lib/definitions.ts or create new types
interface ProductJob {
  // Core fields (existing)
  id: string
  title: string
  company: string
  description: string
  apply_url: string
  created_at: string
  is_currently_active: boolean
  
  // New PM-specific fields
  seniority_level: string
  pm_focus_area: string
  company_stage: string
  core_pm_skills: string
  technical_skills: string
  location_metro: string
  work_arrangement: string
  salary_min: number
  salary_max: number
  // ... additional 80+ fields as needed
}
```

**Files to Update**:
- `lib/definitions.ts` - Add ProductJob interface
- `components/JobList.tsx` - Update query to select new fields
- Update Supabase queries to match actual table structure

**Acceptance Criteria**:
- [ ] Jobs load successfully from enriched table
- [ ] All PM-specific fields accessible in components
- [ ] No breaking changes to existing functionality

### 1.2 Remove Dependencies on Non-Existent Tables
**Goal**: Eliminate references to departments, categories, companies tables

**Tasks**:
- Update `components/Filters.tsx` to remove department/country queries
- Modify job queries to not JOIN on companies table (use company field directly)
- Remove unused imports and database calls

**Files to Modify**:
- `components/Filters.tsx` - Remove loadPage() department/country fetching
- `components/JobList.tsx` - Simplify query structure
- `database/schema.sql` - Document actual vs. expected schema

---

## Phase 2: Visual Foundation - OLED Theme (Week 2-3)

### 2.1 Design System Implementation
**Goal**: Establish OLED black design foundation

**Tasks**:
```typescript
// tailwind.config.js - Complete replacement
module.exports = {
  content: ['./pages/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // OLED Theme
        'bg-primary': '#000000',
        'bg-secondary': '#0a0a0a', 
        'bg-tertiary': '#141414',
        'text-primary': '#ffffff',
        'text-secondary': '#b3b3b3',
        'text-tertiary': '#666666',
        'accent-primary': '#0066ff',
        'accent-secondary': '#00d4ff',
        'accent-success': '#00ff88',
        'surface-elevated': '#1a1a1a',
        'surface-interactive': '#262626',
        'border-subtle': '#333333'
      },
      fontFamily: {
        'primary': ['Inter', 'system-ui', 'sans-serif']
      },
      animation: {
        'shimmer': 'shimmer 1.5s infinite',
        'fade-in': 'fade-in 0.3s ease-out'
      }
    }
  },
  plugins: [require('@tailwindcss/forms')]
}
```

**Files to Create/Update**:
- `tailwind.config.js` - Complete theme overhaul
- `styles/globals.css` - Add custom properties and animations
- `next.config.js` - Add Inter font optimization

### 2.2 Typography System
**Goal**: Implement sophisticated typography hierarchy

**Tasks**:
```css
/* styles/globals.css additions */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

:root {
  --font-primary: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}

.heading-primary {
  font-size: 2.5rem;
  font-weight: 700;
  letter-spacing: -0.025em;
  line-height: 1.2;
}

.heading-secondary {
  font-size: 1.875rem;
  font-weight: 600;
  letter-spacing: -0.015em;
  line-height: 1.3;
}

/* Additional typography classes */
```

---

## Phase 3: Core Component Redesign (Week 3-4)

### 3.1 Hero Section Transformation
**Goal**: Convert climate-focused hero to PM-focused with OLED aesthetic

**Tasks**:
```typescript
// components/Hero.tsx - Complete rewrite
export default function Hero() {
  return (
    <div className="bg-bg-primary">
      <div className="max-w-7xl mx-auto px-4 py-24">
        <div className="text-center">
          <h1 className="heading-primary text-text-primary mb-6">
            Find Your Next Product Management Role
          </h1>
          <p className="text-text-secondary text-xl mb-10 max-w-2xl mx-auto">
            Curated opportunities for product professionals. Skip the noise, find your fit.
          </p>
          <SearchBar />
        </div>
      </div>
    </div>
  )
}
```

**Files to Update**:
- `components/Hero.tsx` - Complete redesign with PM messaging
- `config/site.ts` - Update to Product Careers branding
- Remove climate-specific imagery and copy

### 3.2 SearchBar Enhancement
**Goal**: Implement command-center aesthetic search

**Tasks**:
```typescript
// components/SearchBar.tsx improvements
export default function SearchBar() {
  return (
    <div className="relative max-w-2xl mx-auto">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center">
        <MagnifyingGlassIcon className="h-6 w-6 text-text-tertiary" />
      </div>
      <input
        className="w-full bg-bg-tertiary border-2 border-border-subtle 
                   rounded-2xl py-4 pl-12 pr-6 text-text-primary 
                   placeholder-text-tertiary text-lg
                   focus:border-accent-primary focus:ring-4 focus:ring-accent-primary/10
                   transition-all duration-200"
        placeholder="Search product management jobs..."
        // ... rest of logic
      />
    </div>
  )
}
```

### 3.3 Job Card Redesign
**Goal**: Implement sophisticated job card with OLED aesthetic

**Tasks**:
```typescript
// components/JobCard.tsx - New component
interface JobCardProps {
  job: ProductJob
  onTagClick: (tag: string) => void
}

export default function JobCard({ job, onTagClick }: JobCardProps) {
  const tags = generateTags(job)
  
  return (
    <div className="bg-bg-tertiary border border-border-subtle rounded-xl p-6
                    hover:bg-surface-elevated hover:border-accent-primary 
                    transform hover:-translate-y-1 transition-all duration-200
                    hover:shadow-lg hover:shadow-accent-primary/20">
      
      {/* Company Logo & Title */}
      <div className="flex items-start gap-4 mb-4">
        <div className="w-12 h-12 bg-bg-secondary rounded-lg flex items-center justify-center">
          <span className="text-text-secondary font-semibold">
            {job.company[0]}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-text-primary font-semibold text-lg mb-1 truncate">
            {job.title}
          </h3>
          <p className="text-text-secondary">{job.company}</p>
        </div>
      </div>

      {/* Job Details */}
      <div className="flex flex-wrap gap-2 text-sm text-text-secondary mb-4">
        <span>{job.location_metro}</span>
        <span>•</span>
        <span>{job.work_arrangement}</span>
        {job.salary_min && (
          <>
            <span>•</span>
            <span className="text-accent-success">
              ${job.salary_min}k - ${job.salary_max}k
            </span>
          </>
        )}
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-4">
        {tags.slice(0, 4).map(tag => (
          <Tag 
            key={tag.name} 
            tag={tag} 
            onClick={() => onTagClick(tag.name)}
          />
        ))}
      </div>

      {/* Apply Button */}
      <button className="w-full bg-gradient-to-r from-accent-primary to-accent-secondary
                         text-white py-3 rounded-lg font-medium
                         hover:shadow-lg hover:shadow-accent-primary/30
                         transform hover:-translate-y-0.5 transition-all duration-200">
        Apply Now
      </button>
    </div>
  )
}
```

---

## Phase 4: Advanced Filtering System (Week 4-5)

### 4.1 Dynamic Tag Generation
**Goal**: Create intelligent tag system from job skill fields

**Tasks**:
```typescript
// lib/tagGenerator.ts - New utility
interface Tag {
  name: string
  category: 'core' | 'technical' | 'leadership' | 'domain'
  color: string
  count?: number
}

export function generateTags(job: ProductJob): Tag[] {
  const tagSources = [
    { field: 'core_pm_skills', category: 'core', color: 'accent-primary' },
    { field: 'technical_skills', category: 'technical', color: 'accent-success' }, 
    { field: 'leadership_skills', category: 'leadership', color: 'accent-secondary' },
    { field: 'domain_expertise', category: 'domain', color: 'accent-warning' }
  ]
  
  return tagSources.flatMap(({ field, category, color }) => 
    job[field]?.split(',').map(skill => ({
      name: skill.trim(),
      category,
      color
    })).filter(tag => tag.name) || []
  )
}

export function generateFilterOptions(jobs: ProductJob[]) {
  return {
    seniority: [...new Set(jobs.map(j => j.seniority_level))].filter(Boolean),
    companyStage: [...new Set(jobs.map(j => j.company_stage))].filter(Boolean),
    focusArea: [...new Set(jobs.map(j => j.pm_focus_area))].filter(Boolean),
    location: [...new Set(jobs.map(j => j.location_metro))].filter(Boolean)
  }
}
```

### 4.2 Advanced Filter Component
**Goal**: Build sophisticated filter sidebar with category + tag support

**Tasks**:
```typescript
// components/Filters.tsx - Complete rewrite
interface FilterState {
  seniority: string[]
  companyStage: string[]
  focusArea: string[]
  workArrangement: string[]
  tags: string[]
}

export default function Filters({ jobs, onFiltersChange }) {
  const [filters, setFilters] = useState<FilterState>({
    seniority: [],
    companyStage: [],
    focusArea: [],
    workArrangement: [],
    tags: []
  })

  const filterOptions = generateFilterOptions(jobs)
  const popularTags = getPopularTags(jobs, 20)

  return (
    <div className="bg-bg-secondary rounded-xl overflow-hidden">
      
      {/* Seniority Filter */}
      <FilterGroup title="Seniority Level">
        {filterOptions.seniority.map(level => (
          <FilterOption
            key={level}
            label={level}
            checked={filters.seniority.includes(level)}
            onChange={(checked) => updateFilter('seniority', level, checked)}
          />
        ))}
      </FilterGroup>

      {/* Company Stage Filter */}
      <FilterGroup title="Company Stage">
        {filterOptions.companyStage.map(stage => (
          <FilterOption
            key={stage}
            label={stage}
            checked={filters.companyStage.includes(stage)}
            onChange={(checked) => updateFilter('companyStage', stage, checked)}
          />
        ))}
      </FilterGroup>

      {/* Popular Tags */}
      <FilterGroup title="Skills & Expertise">
        <div className="flex flex-wrap gap-2">
          {popularTags.map(tag => (
            <TagFilter
              key={tag.name}
              tag={tag}
              selected={filters.tags.includes(tag.name)}
              onClick={() => toggleTag(tag.name)}
            />
          ))}
        </div>
      </FilterGroup>
    </div>
  )
}
```

---

## Phase 5: Enhanced Search & Job Display (Week 5-6)

### 5.1 Optimized Search Implementation
**Goal**: Implement PM-focused search with proper indexing

**Tasks**:
```typescript
// lib/searchService.ts - New service
export class JobSearchService {
  static buildSearchQuery(searchTerm: string, filters: FilterState) {
    let query = supabase
      .from('jobs')
      .select(`
        id, title, company, description, apply_url, created_at,
        seniority_level, pm_focus_area, company_stage, location_metro,
        work_arrangement, salary_min, salary_max, core_pm_skills,
        technical_skills, leadership_skills, domain_expertise
      `)
      .eq('is_currently_active', true)
      .eq('is_product_job', true)
      .in('extraction_confidence', ['high', 'medium'])

    // Text search
    if (searchTerm) {
      query = query.textSearch('search_vector', searchTerm)
    }

    // Apply filters
    if (filters.seniority.length) {
      query = query.in('seniority_level', filters.seniority)
    }
    
    if (filters.companyStage.length) {
      query = query.in('company_stage', filters.companyStage)
    }

    // Tag filtering (requires custom logic)
    if (filters.tags.length) {
      query = this.applyTagFilters(query, filters.tags)
    }

    return query.order('created_at', { ascending: false })
  }

  static applyTagFilters(query, tags: string[]) {
    // Build OR conditions for tag matching across skill fields
    const tagConditions = tags.map(tag => 
      `core_pm_skills.ilike.%${tag}%,technical_skills.ilike.%${tag}%,leadership_skills.ilike.%${tag}%`
    ).join(',')
    
    return query.or(tagConditions)
  }
}
```

### 5.2 Job List Component Enhancement
**Goal**: Implement sophisticated job list with filtering and loading states

**Tasks**:
```typescript
// components/JobList.tsx - Major enhancement
export default function JobList() {
  const router = useRouter()
  const [jobs, setJobs] = useState<ProductJob[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const filterState = useFilterState()
  
  const loadJobs = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const query = JobSearchService.buildSearchQuery(
        filterState.search, 
        filterState.filters
      )
      
      const { data, error } = await query.limit(20)
      
      if (error) throw error
      setJobs(data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadJobs()
  }, [filterState])

  if (loading) return <JobListSkeleton />
  if (error) return <ErrorState message={error} onRetry={loadJobs} />
  if (!jobs.length) return <EmptyState filters={filterState} />

  return (
    <div className="space-y-4">
      {jobs.map(job => (
        <JobCard 
          key={job.id} 
          job={job}
          onTagClick={(tag) => filterState.addTag(tag)}
        />
      ))}
    </div>
  )
}
```

---

## Phase 6: Professional UX Patterns (Week 6-7)

### 6.1 Loading & Empty States
**Goal**: Implement sophisticated loading and empty state patterns

**Tasks**:
```typescript
// components/LoadingStates.tsx - New component collection
export function JobListSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="bg-bg-tertiary rounded-xl p-6 animate-pulse">
          <div className="flex gap-4 mb-4">
            <div className="w-12 h-12 bg-bg-secondary rounded-lg" />
            <div className="flex-1">
              <div className="h-5 bg-bg-secondary rounded w-2/3 mb-2" />
              <div className="h-4 bg-bg-secondary rounded w-1/3" />
            </div>
          </div>
          <div className="flex gap-2 mb-4">
            <div className="h-6 bg-bg-secondary rounded-full w-16" />
            <div className="h-6 bg-bg-secondary rounded-full w-20" />
          </div>
          <div className="h-10 bg-bg-secondary rounded-lg" />
        </div>
      ))}
    </div>
  )
}

export function EmptyState({ filters }: { filters: FilterState }) {
  return (
    <div className="text-center py-16">
      <div className="w-16 h-16 bg-bg-tertiary rounded-full mx-auto mb-6 
                      flex items-center justify-center">
        <MagnifyingGlassIcon className="w-8 h-8 text-text-tertiary" />
      </div>
      <h3 className="text-text-primary text-xl font-semibold mb-2">
        No matching jobs found
      </h3>
      <p className="text-text-secondary mb-6 max-w-md mx-auto">
        Try adjusting your filters or search terms to see more opportunities.
      </p>
      <button 
        onClick={() => filters.clearAll()}
        className="btn-secondary"
      >
        Clear All Filters
      </button>
    </div>
  )
}
```

### 6.2 Micro-interactions & Animations
**Goal**: Add subtle animations that enhance UX without overwhelming

**Tasks**:
```css
/* styles/globals.css - Animation additions */
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

@keyframes fade-in {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-shimmer {
  background: linear-gradient(
    90deg,
    var(--bg-tertiary) 25%,
    var(--surface-elevated) 50%,
    var(--bg-tertiary) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

.animate-fade-in {
  animation: fade-in 0.3s ease-out;
}

/* Hover effects */
.job-card-hover {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.job-card-hover:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 102, 255, 0.15);
}
```

---

## Phase 7: Analytics & Optimization (Week 7-8)

### 7.1 Basic Analytics Implementation
**Goal**: Implement essential user behavior tracking

**Tasks**:
```typescript
// lib/analytics.ts - New service
interface AnalyticsEvent {
  event_name: string
  job_id?: string
  company?: string
  search_query?: string
  filter_type?: string
  filter_value?: string
  results_count?: number
  timestamp: string
  session_id: string
}

export class Analytics {
  private static sessionId = this.generateSessionId()

  static trackEvent(eventName: string, data: Partial<AnalyticsEvent>) {
    if (!process.env.NEXT_PUBLIC_ENABLE_ANALYTICS) return

    const event: AnalyticsEvent = {
      event_name: eventName,
      timestamp: new Date().toISOString(),
      session_id: this.sessionId,
      ...data
    }

    // Send to Supabase analytics table
    supabase.from('analytics_events').insert(event)
  }

  static trackSearch(query: string, resultsCount: number) {
    this.trackEvent('search_performed', {
      search_query: query,
      results_count: resultsCount
    })
  }

  static trackFilterApplied(filterType: string, filterValue: string, resultsCount: number) {
    this.trackEvent('filter_applied', {
      filter_type: filterType,
      filter_value: filterValue,
      results_count: resultsCount
    })
  }

  static trackJobView(job: ProductJob) {
    this.trackEvent('job_detail_viewed', {
      job_id: job.id,
      company: job.company
    })
  }

  static trackApplyClick(job: ProductJob) {
    this.trackEvent('apply_clicked', {
      job_id: job.id,
      company: job.company
    })
  }

  private static generateSessionId(): string {
    return Math.random().toString(36).substring(7)
  }
}
```

### 7.2 Performance Optimization
**Goal**: Ensure sub-500ms search performance and smooth interactions

**Tasks**:
```typescript
// lib/optimizations.ts - Performance utilities
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func.apply(this, args), wait)
  }
}

export function useDebouncedSearch(searchTerm: string, delay: number = 300) {
  const [debouncedTerm, setDebouncedTerm] = useState(searchTerm)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedTerm(searchTerm)
    }, delay)

    return () => clearTimeout(handler)
  }, [searchTerm, delay])

  return debouncedTerm
}

// Implement in SearchBar component
export default function SearchBar() {
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebouncedSearch(query, 300)
  
  useEffect(() => {
    if (debouncedQuery) {
      router.push({
        pathname: '/',
        query: { q: debouncedQuery }
      })
    }
  }, [debouncedQuery])

  // ... rest of component
}
```

---

## Phase 8: Final Polish & Testing (Week 8)

### 8.1 Accessibility Implementation
**Goal**: Ensure WCAG AA compliance with OLED design

**Tasks**:
```typescript
// components/AccessibilityEnhanced.tsx - Enhanced components
export function AccessibleJobCard({ job, onTagClick }: JobCardProps) {
  return (
    <article 
      className="job-card-hover focus-within:ring-2 focus-within:ring-accent-primary"
      role="article"
      aria-labelledby={`job-title-${job.id}`}
    >
      <h3 
        id={`job-title-${job.id}`}
        className="sr-only"
      >
        {job.title} at {job.company}
      </h3>
      
      {/* Enhanced keyboard navigation */}
      <button
        className="w-full text-left focus:outline-none focus:ring-2 focus:ring-accent-primary rounded-lg"
        onClick={() => navigateToJob(job.id)}
        aria-describedby={`job-details-${job.id}`}
      >
        {/* Job card content */}
      </button>

      {/* Screen reader optimizations */}
      <div 
        id={`job-details-${job.id}`}
        className="sr-only"
      >
        Job details: {job.title} at {job.company}, located in {job.location_metro}, 
        requires {job.seniority_level} experience level.
      </div>
    </article>
  )
}
```

### 8.2 Mobile Optimization
**Goal**: Ensure excellent mobile experience with touch-friendly interactions

**Tasks**:
```css
/* Mobile-specific optimizations */
@media (max-width: 768px) {
  .job-card {
    padding: 1rem;
    margin-bottom: 1rem;
  }
  
  .filter-sidebar {
    position: fixed;
    top: 0;
    left: -100%;
    height: 100vh;
    width: 280px;
    z-index: 50;
    transition: left 0.3s ease;
  }
  
  .filter-sidebar.open {
    left: 0;
  }
  
  .tag {
    min-height: 44px; /* Touch target size */
    padding: 0.5rem 1rem;
  }
}
```

### 8.3 Error Handling & Edge Cases
**Goal**: Graceful handling of all failure scenarios

**Tasks**:
```typescript
// lib/errorHandling.ts - Comprehensive error management
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
    Analytics.trackEvent('error_occurred', {
      error_type: error.name,
      error_message: error.message
    })
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />
    }

    return this.props.children
  }
}

export function ErrorFallback({ error }: { error: Error }) {
  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <h2 className="text-text-primary text-2xl font-bold mb-4">
          Something went wrong
        </h2>
        <p className="text-text-secondary mb-6">
          We're sorry, but something unexpected happened. Please try refreshing the page.
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="btn-primary"
        >
          Refresh Page
        </button>
      </div>
    </div>
  )
}
```

---

## Implementation Priority Matrix

### Critical Path (Must Complete):
1. **Data Model Adaptation** - Foundation for everything
2. **OLED Theme Implementation** - Core visual transformation  
3. **Basic Job Card Redesign** - Primary user interface
4. **Essential Filter Categories** - Core functionality
5. **Search Enhancement** - Primary user action

### High Value (Should Complete):
6. **Tag System Implementation** - Differentiation feature
7. **Advanced Filtering** - Competitive advantage
8. **Loading States & Animations** - Professional polish
9. **Mobile Optimization** - User base expansion
10. **Basic Analytics** - Product improvement insights

### Nice to Have (Time Permitting):
11. **User Accounts** - Retention feature
12. **Advanced Analytics Dashboard** - Business insights
13. **Real-time Updates** - Dynamic experience
14. **Performance Optimizations** - Scale preparation

---

## Risk Mitigation Strategies

### High-Risk Areas:
1. **Data Model Assumptions** - Validate actual Supabase schema early
2. **Search Performance** - Test with realistic data volumes
3. **Tag Generation Logic** - Handle edge cases in skill parsing
4. **Mobile Experience** - Test on actual devices, not just browser

### Validation Checkpoints:
- **Week 2**: Data loads successfully from production schema
- **Week 4**: Core filtering works with real job data  
- **Week 6**: Mobile experience tested on 3+ devices
- **Week 8**: Performance meets <500ms search target

### Rollback Plans:
- Keep existing components during redesign (rename, don't delete)
- Feature flag new filtering system
- Maintain fallback to basic search if advanced search fails
- Progressive enhancement approach for animations/interactions

This implementation plan transforms the basic climate job board into a sophisticated PM-focused platform while maintaining systematic risk management and clear success criteria at each phase.