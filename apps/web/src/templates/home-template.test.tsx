import {
  PackCollectibleDistribution,
  PackCollectibleOrder,
  PackStatus,
  PackType,
  PublishedPack,
} from '@algomart/schemas'
import { render, screen } from '@testing-library/react'

import HomeTemplate from './home-template'

describe('HomeTemplate', () => {
  test('should render pack title', async () => {
    const featuredPack: PublishedPack = {
      activeBid: undefined,
      allowBidExpiration: false,
      auctionUntil: undefined,
      available: 10,
      body: undefined,
      collectibleTemplateIds: [],
      config: {
        collectibleDistribution: PackCollectibleDistribution.Random,
        collectibleOrder: PackCollectibleOrder.Random,
        collectiblesPerPack: 1,
      },
      image: 'http://localhost/image.png',
      onePackPerCustomer: false,
      price: 0,
      releasedAt: undefined,
      slug: '',
      status: PackStatus.Active,
      subtitle: undefined,
      templateId: '',
      title: 'My Featured Pack',
      total: 100,
      type: PackType.Free,
      additionalImages: [],
    }

    render(
      <HomeTemplate
        onClickFeatured={jest.fn()}
        featuredPack={featuredPack}
        upcomingPacks={[]}
        notableCollectibles={[]}
      />
    )
    const title = await screen.findByText('My Featured Pack')
    expect(title).toBeInTheDocument()
  })
})
