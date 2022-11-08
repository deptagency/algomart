export function parseHash() {
  if (!window.location.hash) return null

  let parsedHash = {}
  const splitUrl = window.location.hash.replace('#', '').split('&')
  for (const item of splitUrl) {
    parsedHash = Object.assign(
      { [item.split('=')[0]]: decodeURIComponent(item.split('=')[1]) },
      parsedHash
    )
  }

  return parsedHash
}
