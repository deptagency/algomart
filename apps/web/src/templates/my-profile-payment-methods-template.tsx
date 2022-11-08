import clsx from 'clsx'
import { useRouter } from 'next/router'
import useTranslation from 'next-translate/useTranslation'
import { useCallback, useState } from 'react'

import css from './my-profile-payment-methods-template.module.css'
import common from '@/components/profile/my-profile-common.module.css'

import Button from '@/components/button'
import CreditCardNetworkLogo from '@/components/credit-card-network-logo/credit-card-network-logo'
import Dialog from '@/components/dialog/dialog'
import { H1 } from '@/components/heading'
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
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [activeCard, setActiveCard] = useState<CardsList | null>(null)

  const handleRemoveCard = useCallback(() => {
    if (activeCard?.id) {
      removeCard(activeCard.id)
    }
    setIsModalOpen(false)
    setActiveCard(null)
  }, [activeCard, removeCard])

  return (
    <>
      <section>
        {cards.length > 0 ? (
          <>
            <ul className={css.listWrapper}>
              {cards.map((card) => {
                const {
                  id,
                  label,
                  default: defaultCard,
                  isExpired,
                  network,
                } = card
                return (
                  <li
                    className={clsx(css.listItem, {
                      [css.isExpired]: isExpired,
                    })}
                    key={id}
                  >
                    <div className={css.itemLabel}>
                      <CreditCardNetworkLogo network={network} />
                      {label}
                    </div>
                    <div className={css.itemActions}>
                      <Toggle
                        checked={defaultCard}
                        disabled={isExpired}
                        id="defaultCard"
                        label={t('forms:fields.defaultCard.label')}
                        name="defaultCard"
                        onChange={() => updateCard(id, !defaultCard)}
                      />
                      <Button
                        className={css.removeButton}
                        onClick={() => {
                          setIsModalOpen(true)
                          setActiveCard(card)
                        }}
                        variant="link"
                      >
                        {t('common:actions.Remove')}
                      </Button>
                    </div>
                  </li>
                )
              })}
            </ul>
            <Button
              onClick={() => router.push(urls.myProfilePaymentMethodsAdd)}
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
              onClick={() => router.push(urls.myProfilePaymentMethodsAdd)}
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
          setActiveCard(null)
        }}
        open={isModalOpen}
      >
        <div className={css.dialogRoot}>
          <header>
            <H1 bold mb={12}>
              {t('common:actions.Remove Payment Method?')}
            </H1>
            <Button
              aria-label={t('common:actions.Close')}
              className={css.closeButton}
              onClick={() => {
                setIsModalOpen(!isModalOpen)
                setActiveCard(null)
              }}
              variant="ghost"
            >
              {'\u2717'}
            </Button>
          </header>
          <Button onClick={handleRemoveCard} type="submit">
            {t('common:actions.Remove Method')}
          </Button>
        </div>
      </Dialog>
    </>
  )
}
