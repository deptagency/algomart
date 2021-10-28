import { Dialog as HeadlessDialog, Transition } from '@headlessui/react'
import clsx from 'clsx'
import {
  DetailedHTMLProps,
  Fragment,
  HTMLAttributes,
  ReactNode,
  useRef,
} from 'react'

import css from './dialog.module.css'

// Based on https://tailwindui.com/components/application-ui/overlays/modals

export interface DialogProps {
  children?: ReactNode
  open: boolean
  onClose: (open: boolean) => void
  className?: string
  containerClassName?: string
  contentClassName?: string
  overlayClassName?: string
  dialogProps?: DetailedHTMLProps<
    HTMLAttributes<HTMLDivElement>,
    HTMLDivElement
  >
}

export default function Dialog({
  children,
  open,
  onClose,
  className,
  containerClassName,
  contentClassName,
  overlayClassName,
  dialogProps = {},
}: DialogProps) {
  const initialFocusReference = useRef(null)
  return (
    <Transition.Root as={Fragment} show={open}>
      <HeadlessDialog
        {...dialogProps}
        as="div"
        initialFocus={initialFocusReference}
        static
        className={clsx(css.root, className, dialogProps.className)}
        open={open}
        onClose={onClose}
      >
        <div
          className={clsx(css.container, containerClassName)}
          ref={initialFocusReference}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <HeadlessDialog.Overlay
              className={clsx(css.overlay, overlayClassName)}
            />
          </Transition.Child>

          {/* This element is to trick the browser into centering the modal contents. */}
          <span className={css.forceCenter} aria-hidden="true">
            &#8203;
          </span>

          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            enterTo="opacity-100 translate-y-0 sm:scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          >
            <div className={clsx(css.content, contentClassName)}>
              {children}
            </div>
          </Transition.Child>
        </div>
      </HeadlessDialog>
    </Transition.Root>
  )
}
