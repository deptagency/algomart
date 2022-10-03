import { DEFAULT_LANG } from '@algomart/schemas'
import i18next, { TFunction } from 'i18next'
import Backend from 'i18next-fs-backend'
import path from 'node:path'

export class I18nAdapter {
  constructor(private readonly env: string) {
    if (i18next.isInitialized) return
    i18next.use(Backend).init({
      fallbackLng: DEFAULT_LANG,
      lng: DEFAULT_LANG,
      ns: ['emails'],
      supportedLngs: ['en-US', 'en-UK', 'es-ES', 'fr-FR'],
      backend: {
        loadPath: path.join(__dirname, 'languages/{{lng}}/{{ns}}.json'),
        addPath: path.join(__dirname, 'languages/{{lng}}/{{ns}}.missing.json'),
      },
    })
  }

  async getFixedT(
    lng: string,
    ns?: string | readonly string[],
    keyPrefix?: string
  ): Promise<TFunction> {
    // NOTE: To support dev being in 'en-US', manually switch the language code
    if (process.env.NODE_ENV !== 'production' && lng === 'en-UK') {
      lng = 'en-US'
    }

    if (process.env.NODE_ENV === 'production' && lng === 'en-US') {
      lng = 'en-UK'
    }

    await i18next.changeLanguage(lng as string)
    return i18next.getFixedT(lng, ns, keyPrefix)
  }
}
