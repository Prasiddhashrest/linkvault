import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import {
  ArrowDownAZ, ArrowUpRight, Bookmark as BookmarkIcon, BookOpen, Check, CheckCircle2,
  Clock3, ExternalLink, Folder, FolderHeart, Globe, Grid2X2,
  LayoutGrid, Link2, List, LoaderCircle, Menu, MoreHorizontal, Pencil,
  Plus, Search, Sparkles, Star, Tag, Trash2, X
} from 'lucide-react'

type Bookmark = {
  id: number
  title: string
  url: string
  category: string
  notes: string
  favorite: boolean
  createdAt: string
  updatedAt: string
}
type BookmarkInput = Pick<Bookmark, 'title' | 'url' | 'category' | 'notes' | 'favorite'>
type Filter = 'all' | 'favorites' | 'recent'

const CATEGORIES = ['Development', 'Design', 'Learning', 'Productivity', 'Inspiration', 'Articles', 'Tools', 'Videos']
const EMPTY: BookmarkInput = { title: '', url: '', category: 'Development', notes: '', favorite: false }
const EXAMPLES: BookmarkInput[] = [
  { title: 'React — The library for web and native user interfaces', url: 'https://react.dev', category: 'Development', notes: 'Reference guides and hands-on tutorials for building components.', favorite: true },
  { title: 'Spring Boot — Build production-ready applications', url: 'https://spring.io/projects/spring-boot', category: 'Development', notes: 'My go-to Java backend framework and documentation.', favorite: false },
  { title: 'MDN Web Docs — Resources for developers', url: 'https://developer.mozilla.org', category: 'Learning', notes: 'JavaScript, CSS and modern web platform reference.', favorite: true },
  { title: 'Figma — Design and collaborate', url: 'https://www.figma.com', category: 'Design', notes: 'Plan page layouts, wireframes and interactions.', favorite: false },
  { title: 'Docker Docs — Get started with containers', url: 'https://docs.docker.com', category: 'Tools', notes: 'Container fundamentals, images and Compose.', favorite: false },
  { title: 'TypeScript — JavaScript with syntax for types', url: 'https://www.typescriptlang.org', category: 'Development', notes: 'Explore the handbook and practical typing patterns.', favorite: false },
]
const themes = ['violet', 'peach', 'sky', 'mint', 'ink', 'gold', 'lilac', 'coral'] as const

async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  let response: Response
  try {
    response = await fetch(`/api${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options.headers },
    })
  } catch {
    throw new Error('Cannot connect to the LinkVault server. Check that the backend is running.')
  }
  if (!response.ok) {
    const data = await response.json().catch(() => null) as { error?: string } | null
    throw new Error(data?.error || `Request failed (${response.status})`)
  }
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

function domainOf(url: string) {
  try { return new URL(url).hostname.replace(/^www\./, '') }
  catch { return url }
}
function initialsOf(domain: string) { return domain.split('.')[0]?.slice(0, 2).toUpperCase() || 'LV' }
function dateLabel(date: string) {
  return new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}
function hashOf(str: string) { return Array.from(str).reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7) }

function Modal({ initial, onClose, onSave, busy }: {
  initial: Bookmark | null
  onClose: () => void
  onSave: (input: BookmarkInput) => Promise<void>
  busy: boolean
}) {
  const [form, setForm] = useState<BookmarkInput>(initial ? {
    title: initial.title, url: initial.url, category: initial.category,
    notes: initial.notes, favorite: initial.favorite
  } : EMPTY)
  const [error, setError] = useState('')
  const change = (field: keyof BookmarkInput, value: string | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }))
    setError('')
  }
  useEffect(() => {
    function escape(e: KeyboardEvent) { if (e.key === 'Escape' && !busy) onClose() }
    window.addEventListener('keydown', escape)
    return () => window.removeEventListener('keydown', escape)
  }, [onClose, busy])

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!form.title.trim()) return setError('Please give this bookmark a title.')
    try {
      const url = new URL(form.url.trim())
      if (!['https:', 'http:'].includes(url.protocol) || !url.hostname) throw Error()
    } catch { return setError('Enter a valid link starting with https:// or http://.') }
    if (!form.category.trim()) return setError('Choose a category.')
    try { await onSave({ ...form, title: form.title.trim(), url: form.url.trim(), notes: form.notes.trim() }) }
    catch (err) { setError(err instanceof Error ? err.message : 'Unable to save bookmark.') }
  }
  return (
    <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget && !busy) onClose() }}>
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-heading">
        <div className="modal-heading"><div><span className="eyebrow">YOUR LIBRARY</span><h2 id="modal-heading">{initial ? 'Edit bookmark' : 'Save a new bookmark'}</h2><p>Keep your favorite corners of the internet organized.</p></div><button className="icon-button" aria-label="Close" onClick={onClose} disabled={busy}><X size={20} /></button></div>
        <form onSubmit={submit}>
          <label>Title <span className="required">*</span><input autoFocus maxLength={160} value={form.title} onChange={e => change('title', e.target.value)} placeholder="e.g. React documentation" /></label>
          <label>Website URL <span className="required">*</span><input type="url" maxLength={2048} value={form.url} onChange={e => change('url', e.target.value)} placeholder="https://example.com" /></label>
          <label>Category <span className="required">*</span><select value={form.category} onChange={e => change('category', e.target.value)}>{[...new Set([...CATEGORIES, form.category])].map(cat => <option key={cat} value={cat}>{cat}</option>)}</select></label>
          <label>Notes <span className="optional">Optional</span><textarea maxLength={2000} rows={3} value={form.notes} onChange={e => change('notes', e.target.value)} placeholder="What makes this link worth saving?" /></label>
          <label className="favorite-checkbox"><input type="checkbox" checked={form.favorite} onChange={e => change('favorite', e.target.checked)} /><Star size={18} /> Add to favorites</label>
          {error && <div className="form-error" role="alert">{error}</div>}
          <div className="modal-actions"><button type="button" className="button secondary" onClick={onClose} disabled={busy}>Cancel</button><button type="submit" className="button primary" disabled={busy}>{busy ? <LoaderCircle className="spin" size={16} /> : <Check size={17} />}{initial ? 'Save changes' : 'Save bookmark'}</button></div>
        </form>
      </section>
    </div>
  )
}

function Card({ item, mode, onEdit, onDelete, onFavorite, busy }: {
  item: Bookmark
  mode: 'grid' | 'list'
  onEdit: (item: Bookmark) => void
  onDelete: (item: Bookmark) => void
  onFavorite: (item: Bookmark) => void
  busy: boolean
}) {
  const domain = domainOf(item.url)
  const theme = themes[hashOf(domain) % themes.length]
  return (
    <article className={`bookmark-card ${mode === 'list' ? 'list-card' : ''}`}>
      <div className={`card-art theme-${theme}`}>
        <div className="art-orb art-orb-one" /><div className="art-orb art-orb-two" />
        <div className="art-content"><div className="site-mark">{initialsOf(domain)}</div><span className="art-domain">{domain}</span><strong>{item.title.length > 48 ? `${item.title.slice(0, 48)}…` : item.title}</strong></div>
        <span className="art-pill"><Globe size={11} /> Website</span>
      </div>
      <div className="card-content">
        <div className="card-upper"><span className="site-url">{domain}</span><button className={`star-button ${item.favorite ? 'is-starred' : ''}`} title={item.favorite ? 'Remove favorite' : 'Add favorite'} aria-label={item.favorite ? 'Remove favorite' : 'Add favorite'} disabled={busy} onClick={() => onFavorite(item)}><Star size={17} fill={item.favorite ? 'currentColor' : 'none'} /></button></div>
        <h3><a href={item.url} target="_blank" rel="noopener noreferrer" title={`Open ${item.title}`}>{item.title}<ArrowUpRight size={14}/></a></h3>
        <p className="card-notes">{item.notes || 'A useful link saved to your library.'}</p>
        <div className="card-bottom"><span className="category-label"><Tag size={13} />{item.category}</span><span className="card-date">{dateLabel(item.createdAt)}</span></div>
        <div className="card-actions"><a href={item.url} target="_blank" rel="noopener noreferrer" className="mini-action" title="Open website"><ExternalLink size={15} /> Visit</a><div className="card-action-right"><button className="mini-icon" title="Edit bookmark" aria-label={`Edit ${item.title}`} disabled={busy} onClick={() => onEdit(item)}><Pencil size={16}/></button><button className="mini-icon danger" title="Delete bookmark" aria-label={`Delete ${item.title}`} disabled={busy} onClick={() => onDelete(item)}><Trash2 size={16}/></button></div></div>
      </div>
    </article>
  )
}

export default function App() {
  const [items, setItems] = useState<Bookmark[]>([])
  const [loading, setLoading] = useState(true)
  const [apiError, setApiError] = useState('')
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [category, setCategory] = useState('All')
  const [sort, setSort] = useState<'newest' | 'az'>('newest')
  const [mode, setMode] = useState<'grid' | 'list'>('grid')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Bookmark | null>(null)
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const searchInput = useRef<HTMLInputElement>(null)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        searchInput.current?.focus()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const refresh = useCallback(async () => {
    try { setItems(await api<Bookmark[]>('/bookmarks')); setApiError('') }
    catch (e) { setApiError(e instanceof Error ? e.message : 'Unable to fetch bookmarks.') }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { void refresh() }, [refresh])
  useEffect(() => {
    if (!toast) return
    const t = window.setTimeout(() => setToast(''), 3200)
    return () => window.clearTimeout(t)
  }, [toast])

  const categories = useMemo(() => [...new Set([...CATEGORIES, ...items.map(item => item.category)])], [items])
  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase()
    return items.filter(item => {
      if (filter === 'favorites' && !item.favorite) return false
      if (category !== 'All' && item.category !== category) return false
      return !search || [item.title, item.url, item.category, item.notes].some(s => s.toLowerCase().includes(search))
    }).sort((a, b) => sort === 'az' ? a.title.localeCompare(b.title) : Date.parse(b.createdAt) - Date.parse(a.createdAt))
      .slice(0, filter === 'recent' ? 12 : undefined)
  }, [items, query, filter, category, sort])
  const favorites = items.filter(item => item.favorite).length

  function showAll(next: Filter) { setFilter(next); setCategory('All'); setSidebarOpen(false) }
  function showCategory(cat: string) { setFilter('all'); setCategory(cat); setSidebarOpen(false) }
  function openNew() { setEditing(null); setModalOpen(true) }
  function openEdit(item: Bookmark) { setEditing(item); setModalOpen(true) }

  async function saveBookmark(data: BookmarkInput) {
    setBusy(true)
    try {
      await api(`/bookmarks${editing ? '/' + editing.id : ''}`, { method: editing ? 'PUT' : 'POST', body: JSON.stringify(data) })
      await refresh()
      setModalOpen(false)
      setEditing(null)
      setToast(editing ? 'Bookmark updated' : 'Bookmark saved to your library')
    } finally { setBusy(false) }
  }
  async function deleteBookmark(item: Bookmark) {
    if (!window.confirm(`Delete “${item.title}”? This cannot be undone.`)) return
    setBusy(true)
    try {
      await api(`/bookmarks/${item.id}`, { method: 'DELETE' })
      await refresh()
      setToast('Bookmark deleted')
    } catch (e) { setApiError(e instanceof Error ? e.message : 'Unable to delete bookmark.') }
    finally { setBusy(false) }
  }
  async function toggleFavorite(item: Bookmark) {
    setBusy(true)
    try {
      const payload: BookmarkInput = { title: item.title, url: item.url, category: item.category, notes: item.notes, favorite: !item.favorite }
      await api(`/bookmarks/${item.id}`, { method: 'PUT', body: JSON.stringify(payload) })
      await refresh()
    } catch (e) { setApiError(e instanceof Error ? e.message : 'Unable to update favorite.') }
    finally { setBusy(false) }
  }
  async function loadExamples() {
    setBusy(true)
    try {
      for (const item of EXAMPLES) { await api('/bookmarks', { method: 'POST', body: JSON.stringify(item) }) }
      await refresh()
      setToast('Six example links added!')
    } catch (e) { setApiError(e instanceof Error ? e.message : 'Unable to load examples.'); await refresh() }
    finally { setBusy(false) }
  }

  return (
    <div className="app-shell">
      {sidebarOpen && <button className="mobile-overlay" aria-label="Close navigation" onClick={() => setSidebarOpen(false)} />}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header"><button className="brand" onClick={() => showAll('all')} aria-label="LinkVault home"><span className="brand-icon"><BookmarkIcon fill="white" size={18}/></span><span>linkvault<span className="brand-dot">.</span></span></button><button className="sidebar-collapse icon-button" onClick={() => setSidebarOpen(false)} aria-label="Close menu"><X size={19}/></button></div>
        <p className="nav-label">WORKSPACE</p>
        <nav className="side-nav" aria-label="Main navigation">
          <button className={`nav-item ${filter === 'all' && category === 'All' ? 'active' : ''}`} onClick={() => showAll('all')}><LayoutGrid size={18}/><span>All bookmarks</span><span className="nav-count">{items.length}</span></button>
          <button className={`nav-item ${filter === 'favorites' ? 'active' : ''}`} onClick={() => showAll('favorites')}><Star size={18}/><span>Favorites</span><span className="nav-count">{favorites}</span></button>
          <button className={`nav-item ${filter === 'recent' ? 'active' : ''}`} onClick={() => showAll('recent')}><Clock3 size={18}/><span>Recently added</span></button>
        </nav>
        <div className="section-title"><p className="nav-label">COLLECTIONS</p><span>{categories.length}</span></div>
        <nav className="side-nav collections" aria-label="Categories">
          {categories.map((cat, i) => <button key={cat} className={`nav-item ${category === cat && filter === 'all' ? 'active' : ''}`} onClick={() => showCategory(cat)}><Folder size={17} fill={['#818cf8','#f4ab78','#59bcb6','#f1c34d','#da8ad5'][i % 5]} stroke={['#818cf8','#f4ab78','#59bcb6','#f1c34d','#da8ad5'][i % 5]}/><span>{cat}</span><span className="nav-count">{items.filter(item => item.category === cat).length}</span></button>)}
        </nav>
        <div className="sidebar-bottom"><div className="sidebar-tip"><Sparkles size={18}/><strong>A space for everything.</strong><span>Save links today, find inspiration tomorrow.</span><button onClick={openNew}>Add your first link <ArrowUpRight size={14}/></button></div><div className="profile"><span className="avatar">LV</span><span><strong>My workspace</strong><small>Personal library</small></span><MoreHorizontal size={20}/></div></div>
      </aside>

      <div className="main-area">
        <header className="topbar"><button className="mobile-menu icon-button" aria-label="Open menu" onClick={() => setSidebarOpen(true)}><Menu size={22}/></button><div className="search-bar"><Search size={18}/><input ref={searchInput} value={query} onChange={e => setQuery(e.target.value)} placeholder="Search your bookmarks..." aria-label="Search bookmarks" />{query && <button onClick={() => setQuery('')} aria-label="Clear search"><X size={15}/></button>}<kbd>⌘ K</kbd></div><div className="top-actions"><span className="top-status"><span className="online-dot"/> Your library</span><button className="button primary top-add" onClick={openNew}><Plus size={17}/> Add bookmark</button></div></header>
        <main className="content">
          <div className="intro"><div><div className="breadcrumb"><BookmarkIcon size={14}/> PERSONAL LIBRARY <span>/</span> {filter === 'favorites' ? 'Favorites' : filter === 'recent' ? 'Recently added' : category !== 'All' ? category : 'All bookmarks'}</div><h1>{filter === 'favorites' ? 'Your favorites' : filter === 'recent' ? 'Recently added' : category !== 'All' ? category : 'Your bookmark library'}<span className="heading-spark"> ✳</span></h1><p>All your best finds, beautifully kept in one place.</p></div><div className="intro-stat"><span><BookOpen size={19}/></span><strong>{items.length}</strong><small>Saved resources</small></div></div>

          <div className="filter-row"><div className="filter-chips"><button className={`chip ${category === 'All' ? 'selected' : ''}`} onClick={() => setCategory('All')}>All links <span>{items.length}</span></button>{categories.map(cat => <button key={cat} className={`chip ${category === cat ? 'selected' : ''}`} onClick={() => setCategory(cat)}>{cat}</button>)}</div></div>
          <div className="toolbar"><div className="result-heading"><h2>{filter === 'favorites' ? 'Starred bookmarks' : filter === 'recent' ? 'Latest saves' : category === 'All' ? 'All bookmarks' : `${category} bookmarks`}</h2><span>{filtered.length} {filtered.length === 1 ? 'link' : 'links'}</span></div><div className="view-controls"><button className="sort-button" onClick={() => setSort(sort === 'newest' ? 'az' : 'newest')} title="Change sort order"><ArrowDownAZ size={17}/>{sort === 'newest' ? 'Newest first' : 'A to Z'}</button><span className="toolbar-divider"/><button className={`view-button ${mode === 'grid' ? 'selected' : ''}`} aria-label="Grid view" title="Grid view" onClick={() => setMode('grid')}><Grid2X2 size={18}/></button><button className={`view-button ${mode === 'list' ? 'selected' : ''}`} aria-label="List view" title="List view" onClick={() => setMode('list')}><List size={19}/></button></div></div>
          {apiError && <div className="alert" role="alert"><span>{apiError}</span><button onClick={() => { setLoading(true); void refresh() }}>Retry</button></div>}
          {loading ? <div className="loading"><LoaderCircle className="spin" size={27}/> Loading your bookmarks...</div> : filtered.length ? <div className={`cards ${mode === 'list' ? 'cards-list' : ''}`}>{filtered.map(item => <Card key={item.id} item={item} mode={mode} onEdit={openEdit} onDelete={item => { void deleteBookmark(item) }} onFavorite={item => { void toggleFavorite(item) }} busy={busy}/>)}</div> : <div className="empty-state"><div className="empty-illustration"><FolderHeart size={37}/></div><h3>{items.length === 0 ? 'A fresh start for your best links' : 'No bookmarks found'}</h3><p>{items.length === 0 ? 'Start building a library of websites, docs, and articles you love — or explore with some sample links.' : 'Try another search, collection, or category to find what you need.'}</p><div className="empty-actions"><button className="button primary" onClick={openNew}><Plus size={16}/> Add a bookmark</button>{items.length === 0 ? <button className="button secondary" disabled={busy || !!apiError} onClick={() => { void loadExamples() }}>{busy ? 'Adding...' : 'Load sample links'}</button> : <button className="button secondary" onClick={() => { setQuery(''); showAll('all') }}>Clear filters</button>}</div></div>}
          <footer className="footer"><span><Link2 size={15}/> LinkVault · Organize what inspires you</span><span>Made to keep the good stuff close <span aria-hidden="true">✦</span></span></footer>
        </main>
      </div>
      {modalOpen && <Modal key={editing?.id ?? 'new'} initial={editing} onClose={() => setModalOpen(false)} onSave={saveBookmark} busy={busy} />}
      {toast && <div className="toast" role="status"><CheckCircle2 size={18}/>{toast}</div>}
    </div>
  )
}
