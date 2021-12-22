import { CollectibleBase, PublishedPack } from '@algomart/schemas'
import clsx from 'clsx'
import Script from 'next/script'
import useTranslation from 'next-translate/useTranslation'

import css from './home-template.module.css'

import AppLink from '@/components/app-link/app-link'
import NotableCollectible from '@/components/collectibles/collectible-notable'
import FeaturedPack from '@/components/featured-pack/featured-pack'
import Grid from '@/components/grid/grid'
import Heading from '@/components/heading'
import ReleaseItem from '@/components/releases/release-item'
import { urls } from '@/utils/urls'

export interface HomeTemplateProps {
  featuredPack: PublishedPack | undefined
  upcomingPacks: PublishedPack[]
  notableCollectibles: CollectibleBase[]
  onClickFeatured: () => void
}

const MarketingCardsSection = () => {
  const StepCard = ({
    icon,
    title,
    content,
    children,
  }: {
    icon: any
    title: any
    content: any
    children: any
  }) => {
    return (
      <div className="rounded-2xl border-2 border-gray-600 space-y-6 flex flex-col justify-between px-8 py-20 items-center hover:border-blue-800">
        <div className="bg-blue-600 rounded-full w-12 h-12 p-2.5 text-center">
          <span className="text-gray-50 text-lg font-bold font-poppins">
            {icon}
          </span>
        </div>

        <span className="text-gray-50 text-lg font-bold font-poppins text-center">
          {title}
        </span>

        <span className="text-gray-50 text-sm font-poppins text-center">
          {content}
        </span>

        {children}
      </div>
    )
  }
  return (
    <div className="w-full mx-auto">
      <div className="relative sm:overflow-hidden">
        <div className="relative px-4 py-12 sm:px-6 sm:py-16 lg:py-20 lg:px-8">
          <Heading level={2} size={1} bold className="text-center text-3xl text-blue-800">
            Original 2 Digital
          </Heading>
          <h1 className="mt-6 text-center text-hero font-bold text-white sm:max-w-3xl mx-auto font-dm-sans">
            <span className="block">
              Take a step beyond the noise. We’re not your typical marketplace
              for every NFT.
            </span>
          </h1>
          <p className="mt-6 max-w-lg mx-auto text-center text-2xl text-blue-400 sm:max-w-3xl font-dm-sans">
            OG2D was created to bring together excited, passionate, and die-hard
            creators and collectors to buy, sell, and trade 100% original,
            authenticated NFT collectibles in a safe and secure way.
          </p>

          <div className="mt-20">
            <div className="mt-12 max-w-6xl mx-auto grid gap-7 lg:grid-cols-3">
              <StepCard
                icon="01"
                title="Create an OG2D Account"
                content="Sign up and join the OG2D Community to start participating in our NFT Marketplace. Once your profile is created you can add your bio, connect your social media and more!"
              >
                {/* Should be a link */}
                <AppLink
                  href="/login"
                  key="/login"
                  className="text-blue-800 text-sm font-poppins"
                >
                  Signup here
                </AppLink>
              </StepCard>

              <StepCard
                icon="02"
                title="Search our Marketplace"
                content="Our marketplace consists of exclusive drops from artists, influencers and collectors from around the world. Unlock secrets, gifts and experiences in every purchase."
              >
                {/* Should be a link */}
                <AppLink
                  href="/releases"
                  className="text-blue-800 text-sm font-poppins"
                  key="/releases"
                >
                  Start searching
                </AppLink>
              </StepCard>

              <StepCard
                icon="03"
                title="Enjoy your NFT"
                content="Congrats! Once you have successfully purchased your NFT it will appear in your email and your user profile to view, share and even send to other OG2D users."
              >
                {/* Should be a link */}
                <AppLink
                  href="/my/collectibles"
                  key="/my/collectibles"
                  className="text-blue-800 text-sm font-poppins"
                >
                  View your NFTs
                </AppLink>
              </StepCard>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const BackgroundGrid = () => (
  <div className='relative h-60 w-full z-10'>
    <div className='absolute bottom-0 h-60 w-full z-10 from-gray-900 via-gray-900 to-transparent bg-gradient-to-br'></div>
    <img
      src="/images/backgrounds/background-grid.svg"
      alt=""
      className="absolute bottom-0 w-full h-full object-center object-cover"
    />
  </div>
)

export default function HomeTemplate({
  featuredPack,
  upcomingPacks,
  notableCollectibles,
  onClickFeatured,
}: HomeTemplateProps) {
  const { t } = useTranslation()

  return (
    <>
      <Script
        src="https://apps.elfsight.com/p/platform.js"
        strategy="lazyOnload"
      />
      {featuredPack ? (
        <FeaturedPack
          featuredPack={featuredPack}
          onClickFeatured={onClickFeatured}
        />
      ) : null}

      {upcomingPacks.length > 0 ? (
        <>
        <div className="bg-gray-900">
          <div className='pt-12 pb-24 mx-auto max-w-screen-2xl px-4'>
            <Heading level={2} size={1} bold className="text-center text-3xl text-blue-800 py-12">
              {t('release:Active & Upcoming Drops')}
            </Heading>

            <div className="grid gap-7 lg:grid-cols-4">
              {' '}
              {upcomingPacks.map((pack) => (
                <AppLink
                  key={pack.templateId}
                  href={urls.release.replace(':packSlug', pack.slug)}
                >
                  <ReleaseItem pack={pack} />
                </AppLink>
              ))}
            </div>
          </div>
        </div>
        <div className='bg-gray-800'>
          <MarketingCardsSection />
        </div>
        </>
      ) : null}

      {notableCollectibles.length > 0 ? (
        <div className='bg-gray-900 relative z-10 pb-12'>
          <Heading level={2} size={1} bold className="text-center text-3xl text-blue-800 py-12">
            {t('release:Notable Collectibles')}
          </Heading>

          <div className={clsx('mx-auto max-w-7xl z-20', css.notableCollectibles)}>
            {/* Steps cards */}
            <Grid columns={4}>
              {notableCollectibles.map((collectible) => (
                <NotableCollectible
                  collectible={collectible}
                  key={collectible.templateId}
                />
              ))}
            </Grid>
          </div>
          <div className={clsx(css.bgGridContainer,'absolute bottom-0 right-0 w-full h-60')}>
                <BackgroundGrid />
          </div>
        </div>
      ) : null}


      <div className={clsx("elfsight-app-0c051f04-30ad-4b6d-bbea-c128a02cf0b0", css.scriptDiv)} />
    </>
  )
}
