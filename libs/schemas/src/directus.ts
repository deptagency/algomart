import {
  PackCollectibleDistribution,
  PackCollectibleOrder,
  PackType,
} from './packs'

export interface DirectusHomepageTranslation extends DirectusTranslation {
  featured_packs_subtitle?: string
  featured_packs_title?: string
  featured_nfts_title?: string
  featured_nfts_subtitle?: string
  hero_banner_title?: string
  hero_banner_subtitle?: string
}

export interface DirectusHomepage {
  id: string
  hero_banner: DirectusFile | null
  hero_pack: DirectusPackTemplate | null
  featured_packs: DirectusPackTemplate[] | null
  featured_nfts: DirectusCollectibleTemplate[] | null
  translations: DirectusHomepageTranslation[]
}

export enum DirectusStatus {
  Draft = 'draft',
  Published = 'published',
  Archived = 'archived',
}

export interface DirectusTranslation {
  languages_code: string
}

export interface DirectusPackTemplateTranslation extends DirectusTranslation {
  title: string
  subtitle: string | null
  body: string | null
}

export interface DirectusFile {
  id: string
  filename_disk: string
  storage: string
  title: string
  type: string
  width: number
  height: number
}

export interface DirectusPackFile {
  id: string
  directus_files_id: string
}

export interface DirectusRarityTranslation extends DirectusTranslation {
  name: string
}

export interface DirectusRarity {
  code: string
  color: string
  id: string
  translations: DirectusRarityTranslation[]
}

export interface DirectusSetTranslation extends DirectusTranslation {
  name: string
}

export interface DirectusSet {
  id: string
  status: DirectusStatus
  sort: number
  slug: string
  collection: DirectusCollection
  nft_templates: DirectusCollectibleTemplate[]
  translations: DirectusSetTranslation[]
}

export interface DirectusCollectionTranslation extends DirectusTranslation {
  name: string
  description: string | null
  metadata: Record<string, string | number | boolean> | null
  reward_prompt: string | null
  reward_complete: string | null
}

export interface DirectusPageTranslation extends DirectusTranslation {
  body: string
  title: string
  hero_banner_title?: string
  hero_banner_subtitle?: string
}

export interface DirectusPage {
  id: string
  slug: string
  hero_banner?: DirectusFile
  translations: DirectusPageTranslation[]
}

export interface DirectusCollection {
  id: string
  status: DirectusStatus
  sort: number
  slug: string
  collection_image: DirectusFile
  translations: DirectusCollectionTranslation[]
  sets: DirectusSet[]
  nft_templates: DirectusCollectibleTemplate[]
  reward_image: DirectusFile | null
}

export interface DirectusCollectibleTemplateTranslation
  extends DirectusTranslation {
  title: string
  subtitle: string | null
  body: string | null
}

export interface DirectusCollectibleTemplate {
  id: string
  status: DirectusStatus
  total_editions: number
  preview_image: DirectusFile
  preview_video: DirectusFile | null
  preview_audio: DirectusFile | null
  asset_file: DirectusFile | null
  rarity: DirectusRarity | null
  unique_code: string
  pack_template: DirectusPackTemplate
  translations: DirectusCollectibleTemplateTranslation[]
  collection: DirectusCollection | null
  set: DirectusSet | null
}

export interface DirectusPackTemplate {
  additional_images: DirectusPackFile[]
  allow_bid_expiration: boolean
  auction_until: string | null
  id: string
  one_pack_per_customer: boolean
  nft_distribution: PackCollectibleDistribution
  nft_order: PackCollectibleOrder
  nft_templates: DirectusCollectibleTemplate[]
  nfts_per_pack: number
  pack_image: DirectusFile
  price: number | null
  released_at: string | null
  show_nfts: boolean
  slug: string
  status: DirectusStatus
  translations: DirectusPackTemplateTranslation[]
  type: PackType
}

export interface DirectusLanguageTemplate {
  code: string
  translations: DirectusLanguageTemplateTranslation[]
}

export interface DirectusLanguageTemplateTranslation
  extends DirectusTranslation {
  label: string
}

export interface DirectusFaqTemplateTranslation extends DirectusTranslation {
  question: string | null
  answer: string | null
}

export interface DirectusFaqTemplate {
  id: string
  translations: DirectusFaqTemplateTranslation[]
}

export interface DirectusCountry {
  id: string
  countries_code: {
    code: string
    translations?: DirectusCountryTranslation[]
  }
}

export interface DirectusApplication {
  id: string
  currency?: string | null
  countries?: DirectusCountry[] | null
}

export interface DirectusCountryTranslation extends DirectusTranslation {
  id: number
  countries_code: string
  languages_code: string
  title: string | null
}
