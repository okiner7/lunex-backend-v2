const userStore = require('./userStore')

const LIKE_BADGES = [
  { threshold: 10, id: 'likes_10', label: '10 лайков', icon: 'Heart', description: 'Добавил 10 треков в любимые' },
  { threshold: 50, id: 'likes_50', label: '50 лайков', icon: 'Heart', description: 'Добавил 50 треков в любимые' },
  { threshold: 100, id: 'likes_100', label: '100 лайков', icon: 'Heart', description: 'Добавил 100 треков в любимые' },
  { threshold: 500, id: 'likes_500', label: '500 лайков', icon: 'Heart', description: 'Добавил 500 треков в любимые' }
]

async function checkAndGrantLikeBadges(providerId, currentCount) {
  for (const badge of LIKE_BADGES) {
    if (currentCount >= badge.threshold) {
      await userStore.addBadge(providerId, {
        id: badge.id,
        label: badge.label,
        icon: badge.icon,
        description: badge.description
      })
    }
  }
}

async function grantDeveloperBadge(providerId) {
  await userStore.addBadge(providerId, {
    id: 'developer',
    label: 'Разработчик',
    icon: 'Code',
    description: 'Участвует в разработке Plume'
  })
}

module.exports = { checkAndGrantLikeBadges, grantDeveloperBadge }
