import { useSearchParams } from 'react-router-dom'
import HeroPane from '../components/HeroPane'
import TheoryPane from '../components/TheoryPane'
import KnowledgePane from '../components/KnowledgePane'
import { Loading, ErrorState } from '../components/StateViews'
import { useHome, usePosts } from '../hooks/posts'
import './HomePage.css'

export default function HomePage() {
  const [params] = useSearchParams()
  const category = params.get('category') || undefined

  const { data: home, loading, error } = useHome()

  const excludeSlugs = [home?.featured?.slug, home?.theory?.slug].filter(Boolean)
  const filter = category ? { category, exclude: excludeSlugs, limit: 6 } : null
  const { data: filtered } = usePosts(home && category ? filter : null)

  if (loading) return <Loading />
  if (error) return <ErrorState message="Could not load the feed." />

  const feed = category ? filtered ?? [] : home.recent

  return (
    <main className="editorial-grid home-grid">
      <HeroPane post={home.featured} />
      <div className="right-column">
        <TheoryPane post={home.theory} />
        <KnowledgePane posts={feed} />
      </div>
    </main>
  )
}
