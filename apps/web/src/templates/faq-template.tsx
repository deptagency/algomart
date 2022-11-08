import { Faqs } from '@algomart/schemas'
import useTranslation from 'next-translate/useTranslation'

import css from './faq-template.module.css'

import { H1 } from '@/components/heading'
import Panel from '@/components/panel/index'

const FaqTemplate = ({ faqs }: Faqs) => {
  const { t } = useTranslation()

  return (
    <>
      <H1 className={css.title}>{t('common:pageTitles.FAQS')}</H1>
      <div>
        {faqs.map(({ key, answer, question }) => (
          <div className={css.faqBlock} id={key} key={key}>
            <Panel openByDefault={false} title={question}>
              <div
                className="px-5 py-4 accordion-body"
                dangerouslySetInnerHTML={{ __html: answer }}
              />
            </Panel>
          </div>
        ))}
      </div>
    </>
  )
}

export default FaqTemplate
