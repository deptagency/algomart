import { DEFAULT_LOCALE } from '@algomart/schemas'
import i18next, { TFunction } from 'i18next'
import Backend from 'i18next-fs-backend'
import path from 'node:path'

export default class I18nAdapter {
  constructor() {
    if (i18next.isInitialized) return
    i18next.use(Backend).init({
      fallbackLng: DEFAULT_LOCALE,
      lng: DEFAULT_LOCALE,
      ns: ['emails'],
      backend: {
        loadPath: path.join(__dirname, 'languages/{{lng}}/{{ns}}.json'),
        addPath: path.join(__dirname, 'languages/{{lng}}/{{ns}}.missing.json'),
      },
    })
  }

  getFixedT(
    lng: string | readonly string[],
    ns?: string | readonly string[],
    keyPrefix?: string
  ): TFunction {
    return i18next.getFixedT(lng, ns, keyPrefix)
  }
}
