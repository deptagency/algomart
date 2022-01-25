import { useRouter } from 'next/router'

export default function CollectiblePage() {
  const router = useRouter()
  console.log(router.query)
  return <div>Collectible Page</div>
}
