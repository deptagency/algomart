import clsx from 'clsx'
import { useRouter } from 'next/router'
import useTranslation from 'next-translate/useTranslation'
import { useState } from 'react'

import css from './my-profile-payment-methods-template.module.css'
import common from '@/components/profile/my-profile-common.module.css'

import Button from '@/components/button'
import Dialog from '@/components/dialog/dialog'
import Heading from '@/components/heading'
import Toggle from '@/components/toggle/toggle'
import { CardsList } from '@/pages/my/profile/payment-methods'
import { urls } from '@/utils/urls'

export interface MyProfilePaymentMethodsTemplateProps {
  cards: CardsList[]
  removeCard: (cardId: string) => void
  updateCard: (cardId: string, defaultCard: boolean) => void
}

export default function MyProfilePaymentMethodsTemplate({
  cards,
  removeCard,
  updateCard,
}: MyProfilePaymentMethodsTemplateProps) {
  const router = useRouter()
  const { t } = useTranslation()
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
  const [activeMethod, setActiveMethod] = useState<CardsList | null>(null)

  return (
    <>
      <section>
        {cards.length > 0 ? (
          <>
            <ul className={css.listWrapper}>
              {cards.map((card) => {
                const { id, label, default: defaultCard, isExpired } = card
                return (
                  <li
                    className={clsx(css.listItem, {
                      [css.isExpired]: isExpired,
                    })}
                    key={id}
                  >
                    <span className={css.itemLabel}>{label}</span>
                    <div className={css.itemActions}>
                      <Toggle
                        checked={defaultCard}
                        className={css.defaultCard}
                        disabled={isExpired}
                        id="defaultCard"
                        label={t('forms:fields.defaultCard.label')}
                        name="defaultCard"
                        onChange={() => updateCard(id, !defaultCard)}
                        styleMode="dark"
                      />
                      <Button
                        className={css.removeButton}
                        onClick={() => {
                          setIsModalOpen(true)
                          setActiveMethod(card)
                        }}
                        variant="link"
                        size="small"
                      >
                        {t('common:actions.Remove')}
                      </Button>
                    </div>
                  </li>
                )
              })}
            </ul>
            <Button
              aria-label={t('common:actions.Add Card')}
              onClick={() => router.push(urls.myProfilePaymentMethodsAdd)}
              size="small"
              variant="primary"
            >
              {t('common:actions.Add Card')}
            </Button>
          </>
        ) : (
          <div className={common.sectionContent}>
            <p className={common.sectionText}>
              {t('common:statuses.noMethodsAvailable')}
            </p>
            <Button
              aria-label={t('common:actions.Add Card')}
              onClick={() => router.push(urls.myProfilePaymentMethodsAdd)}
              size="small"
              variant="primary"
            >
              {t('common:actions.Add Card')}
            </Button>
          </div>
        )}
      </section>

      {/* Remove card modal */}
      <Dialog
        containerClassName={css.dialogContainer}
        contentClassName={css.dialog}
        onClose={() => {
          setIsModalOpen(!isModalOpen)
          setActiveMethod(null)
        }}
        open={isModalOpen}
      >
        <div className={css.dialogRoot}>
          <header>
            <Heading level={2} className={css.dialogHeader}>
              {t('common:actions.Remove Payment Method?')}
            </Heading>
            <Button
              aria-label={t('common:actions.Close')}
              className={css.closeButton}
              onClick={() => {
                setIsModalOpen(!isModalOpen)
                setActiveMethod(null)
              }}
              variant="tertiary"
            >
              {'\u2717'}
            </Button>
          </header>
          <Button
            onClick={() => {
              if (activeMethod?.id) {
                removeCard(activeMethod.id)
              }
              setIsModalOpen(false)
              setActiveMethod(null)
            }}
            variant="primary"
            size="small"
            type="submit"
          >
            {t('common:actions.Remove Method')}
          </Button>
        </div>
      </Dialog>
    </>
  )
}
