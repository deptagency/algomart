import { Transition } from '@headlessui/react'
import { CheckCircleIcon, XIcon } from '@heroicons/react/outline'
import { Fragment } from 'react'

import css from './notification.module.css'

export interface NotificationProps {
  show: boolean
  onClose?: () => void
  // @TODO: add content prop
}

export default function Notification({ show, onClose }: NotificationProps) {
  return (
    <Transition
      as={Fragment}
      show={show}
      enter={css.transitionEnter}
      enterFrom={css.transitionEnterFrom}
      enterTo={css.transitionEnterTo}
      leave={css.transitionLeave}
      leaveFrom={css.transitionLeaveFrom}
      leaveTo={css.transitionLeaveTo}
    >
      <div className={css.root}>
        <div className="p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <CheckCircleIcon
                className="w-6 h-6 text-green-400"
                aria-hidden="true"
              />
            </div>
            <div className="ml-3 w-0 flex-1 pt-0.5">
              <p className="text-sm font-medium text-gray-900">
                Successfully saved!
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Anyone with a link can now view this file.
              </p>
            </div>
            {onClose && (
              <div className="flex flex-shrink-0 ml-4">
                <button
                  className="inline-flex text-gray-400 bg-white rounded-md hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  onClick={onClose}
                >
                  <span className="sr-only">Close</span>
                  <XIcon className="w-5 h-5" aria-hidden="true" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Transition>
  )
}
