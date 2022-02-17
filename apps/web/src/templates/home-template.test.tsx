import {
  PackCollectibleDistribution,
  PackCollectibleOrder,
  PackStatus,
  PackType,
} from '@algomart/schemas'
import { render, screen } from '@testing-library/react'

import HomeTemplate from './home-template'

import { I18nProvider } from '@/contexts/i18n-context'

describe('HomeTemplate', () => {
  test('should render pack title', async () => {
    render(
      <I18nProvider>
        <HomeTemplate
          onClickFeatured={jest.fn()}
          heroPack={{
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
          }}
          featuredPacks={[]}
          featuredCollectibles={[]}
        />
      </I18nProvider>
    )
    const title = await screen.findByText('My Featured Pack')
    expect(title).toBeInTheDocument()
  })
})
