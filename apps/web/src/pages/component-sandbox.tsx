/* eslint-disable @typescript-eslint/no-empty-function */
import { CheckIcon, UserCircleIcon, XIcon } from '@heroicons/react/outline'
import clsx from 'clsx'
import Head from 'next/head'
import { useState } from 'react'

import css from './component-sandbox.module.css'

import AlgoAddress from '@/components/algo-address'
import Avatar from '@/components/avatar/avatar'
import Button from '@/components/button'
import Checkbox from '@/components/checkbox/checkbox'
import CurrencyInput from '@/components/currency-input/currency-input'
import FilterableSelect from '@/components/filterable-select'
import FormField from '@/components/form-field'
import { H1, H2, H3, H4 } from '@/components/heading'
import Input from '@/components/input'
import InputField from '@/components/input-field'
import LinkButton from '@/components/link-button'
import Loading from '@/components/loading/loading'
import Panel from '@/components/panel'
import Pill from '@/components/pill'
import RadioGroup from '@/components/radio-group'
import RadioGroupField from '@/components/radio-group-field'
import Select from '@/components/select'
import SelectField from '@/components/select-field'
import Table from '@/components/table'
import Toggle from '@/components/toggle/toggle'
import Tooltip from '@/components/tooltip'
import Video from '@/components/video'
import VideoTile from '@/components/video-tile'
import { useAuth } from '@/contexts/auth-context'
import DefaultLayout from '@/layouts/default-layout'

const ColorSwatch = ({ classes }) => {
  return (
    <div className={clsx(css.colorSwatch, classes)}>
      {classes.split(' ').map((k) => (
        <span key={k}>{k}</span>
      ))}
    </div>
  )
}

export default function Sandbox() {
  const auth = useAuth()
  const [textValue, setTextValue] = useState('Ted Lasso')
  const [usd, setUsd] = useState('100')
  const [currencyValue, setCurrencyValue] = useState(1500)
  const [videoFile, setVideoFile] = useState(null)
  const textError = textValue.trim().length === 0 ? 'You must enter a name' : ''

  const options = [
    { label: 'Ted Lasso', value: 'Ted Lasso' },
    { label: 'Rebecca Welton', value: 'Rebecca Welton' },
    { label: 'Roy Kent', value: 'Roy Kent' },
    { label: 'Keeley Jones', value: 'Keeley Jones' },
    { label: 'Jamie Tartt', value: 'Jamie Tartt' },
  ]
  const [selected, setSelected] = useState(options[0].value)
  const selectedError =
    selected === 'Jamie Tartt' ? 'Jamie Tartt doo-doo doo-doo-doo-doo' : ''

  const [checkValue, setCheckValue] = useState(true)

  const VideoFileInput = () => (
    <input
      type="file"
      accept="video/*"
      onChange={(event_) => {
        const URL = window.URL || webkitURL
        const fileUrl = URL.createObjectURL(event_.target.files[0])
        setVideoFile(fileUrl)
      }}
    />
  )

  return (
    <DefaultLayout fullBleed>
      <Head>
        <meta key="robots" name="robots" content="noindex,follow" />
        <meta key="googlebot" name="googlebot" content="noindex,follow" />
      </Head>
      <div className={css.sandbox}>
        <Panel title="Typography">
          <H1>Heading 1</H1>
          <H2>Heading 2</H2>
          <H3>Heading 3</H3>
          <H4>Heading 4</H4>
          <br />
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
            tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam,
            quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo
            consequat.Duis aute irure dolor in reprehenderit in voluptate velit esse cillum
            dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident,
            sunt in culpa qui officia deserunt mollit anim id est laborum.
          </p>
          <br />
          <code>
            150 Credits (only €140): Numbers code and more
          </code>
          <br />
          <small>Teeny tiny text.</small>
        </Panel>

        <Panel title="Colors">
          <H3 my={4}>Base palette (WIP)</H3>
          <div className="flex">
            <ColorSwatch classes="bg-midnight" />
            <ColorSwatch classes="bg-blue-200" />
            <ColorSwatch classes="bg-blue-300" />
            <ColorSwatch classes="bg-blue-500" />
          </div>

          <H3 my={4}>Text</H3>
          <ColorSwatch classes="text-base-textPrimary" />
          <ColorSwatch classes="text-base-textSecondary" />
          <ColorSwatch classes="text-base-textTertiary" />
          <ColorSwatch classes="text-action-primary" />
          <ColorSwatch classes="text-action-accent" />
          <ColorSwatch classes="text-action-link" />
          <ColorSwatch classes="text-action-linkHover" />
          <ColorSwatch classes="text-base-error" />
          <ColorSwatch classes="text-base-price" />

          <H3 my={4}>Background</H3>
          <ColorSwatch classes="bg-action-primary" />
          <ColorSwatch classes="bg-action-secondary" />
          <ColorSwatch classes="bg-action-accent" />
          <ColorSwatch classes="bg-action-disabled text-action-disabledContrastText" />
          <ColorSwatch classes="bg-base-bg" />
          <ColorSwatch classes="bg-base-bgCard" />
          <ColorSwatch classes="bg-base-error" />
          <ColorSwatch classes="bg-base-price" />
        </Panel>

        <Panel title="AlgoAddress">
          <AlgoAddress address="QNW3J4VZNIVXK3SCBZ6IXMT2NDSYMYWNPZQDJQGE33A6DPTETBNRS3YA2U" />
        </Panel>

        <Panel title="Avatar">
          <Avatar username={auth.user?.username} />
          <Avatar username={auth.user?.username} imageOnly />
          <Avatar username={auth.user?.username} textOnly />
          <Avatar username="xxxxxx" />
          <Avatar
            username={auth.user?.username}
            suffix="suffix"
            prefix="prefix"
          />
          <Avatar username={auth.user?.username} size={80} imageOnly />
        </Panel>

        <Panel title="Loading">
          <div className="flex">
            <Loading />
            <Loading bold />
            <Loading loadingText="custom text" />
            <Loading loadingText="" />
          </div>
        </Panel>

        <Panel title="Buttons">
          <H4 mb={2} mt={4}>
            Default <code>(size=&quot;small&quot;)</code>
          </H4>
          <div className="flex flex-wrap gap-4">
            <Button>Primary</Button>
            <Button variant="secondary">secondary</Button>
            <Button variant="outline">outline</Button>
            <Button variant="ghost">ghost</Button>
            <Button variant="accent">accent</Button>
            <Button variant="link">link</Button>
          </div>

          <H4 mb={2} mt={4}>
            Disabled
          </H4>
          <div className="flex flex-wrap gap-4">
            <Button disabled>Primary</Button>
            <Button disabled variant="secondary">secondary</Button>
            <Button disabled variant="outline">outline</Button>
            <Button disabled variant="ghost">ghost</Button>
            <Button disabled variant="accent">accent</Button>
            <Button disabled variant="link">link</Button>
          </div>

          <H4 mb={2} mt={4}>
            Busy
          </H4>
          <div className="flex flex-wrap gap-4">
            <Button busy>Primary</Button>
            <Button busy variant="secondary">secondary</Button>
            <Button busy variant="outline">outline</Button>
            <Button busy variant="ghost">ghost</Button>
            <Button busy variant="accent">accent</Button>
            <Button busy variant="link">link</Button>
          </div>

          <br />
          <H3 mb={2} mt={4}>Large</H3>

          <div className="flex flex-wrap gap-4">
            <Button size="large">Primary</Button>
            <Button size="large" variant="secondary">secondary</Button>
            <Button size="large" variant="outline">outline</Button>
            <Button size="large" variant="ghost">ghost</Button>
            <Button size="large" variant="accent">accent</Button>
            <Button size="large" variant="link">link</Button>
          </div>

          <H4 mb={2} mt={4}>Disabled</H4>
          <div className="flex flex-wrap gap-4">
            <Button size="large" disabled>Primary</Button>
            <Button size="large" disabled variant="secondary">secondary</Button>
            <Button size="large" disabled variant="outline">outline</Button>
            <Button size="large" disabled variant="ghost">ghost</Button>
            <Button size="large" disabled variant="accent">accent</Button>
            <Button size="large" disabled variant="link">link</Button>
          </div>

          <H4 mb={2} mt={4}>Busy</H4>
          <div className="flex flex-wrap gap-4">
            <Button size="large" busy>Primary</Button>
            <Button size="large" busy variant="secondary">secondary</Button>
            <Button size="large" busy variant="outline">outline</Button>
            <Button size="large" busy variant="ghost">ghost</Button>
            <Button size="large" busy variant="accent">accent</Button>
            <Button size="large" busy variant="link">link</Button>
          </div>

          <br />
          <H3 mb={2} mt={4}>FullWidth</H3>
          <div className="flex flex-wrap gap-4">
            <div className="flex flex-col flex-grow gap-4">
              <Button fullWidth>Primary</Button>
              <Button fullWidth variant="secondary">secondary</Button>
              <Button fullWidth variant="outline">outline</Button>
              <Button fullWidth variant="ghost">ghost</Button>
              <Button fullWidth variant="accent">accent</Button>
              <Button fullWidth variant="link">link</Button>
            </div>

            <div className="flex flex-col flex-grow gap-4">
              <Button fullWidth size="large">Primary</Button>
              <Button fullWidth size="large" variant="secondary">secondary</Button>
              <Button fullWidth size="large" variant="outline">outline</Button>
              <Button fullWidth size="large" variant="ghost">ghost</Button>
              <Button fullWidth size="large" variant="accent">accent</Button>
              <Button fullWidth size="large" variant="link">link</Button>
            </div>
          </div>
        </Panel>

        {/**
         * Redundant, but helpful when editing global button styles to ensure they carry through to the <LinkButton/>
         */}
        <Panel title="Link Buttons" openByDefault={false}>
          <H4 mb={2} mt={4}>
            Default <code>(size=&quot;small&quot;)</code>
          </H4>
          <div className="flex flex-wrap gap-4">
            <LinkButton href="/">Primary</LinkButton>
            <LinkButton href="/" variant="secondary">secondary</LinkButton>
            <LinkButton href="/" variant="outline">tertiary</LinkButton>
            <LinkButton href="/" variant="ghost">ghost</LinkButton>
            <LinkButton href="/" variant="accent">accent</LinkButton>
            <LinkButton href="/" variant="link">link</LinkButton>
          </div>

          <H4 mb={2} mt={4}>Disabled</H4>
          <div className="flex flex-wrap gap-4">
            <LinkButton href="/" disabled>Primary</LinkButton>
            <LinkButton href="/" disabled variant="secondary">secondary</LinkButton>
            <LinkButton href="/" disabled variant="outline">outline</LinkButton>
            <LinkButton href="/" disabled variant="ghost">ghost</LinkButton>
            <LinkButton href="/" disabled variant="accent">accent</LinkButton>
            <LinkButton href="/" disabled variant="link">link</LinkButton>
          </div>

          <br />
          <H3 mb={2} mt={4}>Large</H3>
          <div className="flex flex-wrap gap-4">
            <LinkButton href="/" size="large">Primary</LinkButton>
            <LinkButton href="/" size="large" variant="secondary">secondary</LinkButton>
            <LinkButton href="/" size="large" variant="outline">outline</LinkButton>
            <LinkButton href="/" size="large" variant="ghost">ghost</LinkButton>
            <LinkButton href="/" size="large" variant="accent">accent</LinkButton>
            <LinkButton href="/" size="large" variant="link">link</LinkButton>
          </div>

          <H4 mb={2} mt={4}>Disabled</H4>
          <div className="flex flex-wrap gap-4">
            <LinkButton href="/" size="large" disabled>Primary</LinkButton>
            <LinkButton href="/" size="large" disabled variant="secondary">secondary</LinkButton>
            <LinkButton href="/" size="large" disabled variant="outline">outline</LinkButton>
            <LinkButton href="/" size="large" disabled variant="ghost">ghost</LinkButton>
            <LinkButton href="/" size="large" disabled variant="accent">accent</LinkButton>
            <LinkButton href="/" size="large" disabled variant="link">link</LinkButton>
          </div>

          <br />
          <H3 mb={2} mt={4}>FullWidth</H3>
          <div className="flex flex-wrap gap-4">
            <div className="flex flex-col flex-grow gap-4">
              <LinkButton href="/" fullWidth>Primary</LinkButton>
              <LinkButton href="/" fullWidth variant="secondary">secondary</LinkButton>
              <LinkButton href="/" fullWidth variant="outline">outline</LinkButton>
              <LinkButton href="/" fullWidth variant="ghost">ghost</LinkButton>
              <LinkButton href="/" fullWidth variant="accent">accent</LinkButton>
              <LinkButton href="/" fullWidth variant="link">link</LinkButton>
            </div>

            <div className="flex flex-col flex-grow gap-4">
              <LinkButton href="/" fullWidth size="large">Primary</LinkButton>
              <LinkButton href="/" fullWidth size="large" variant="secondary">secondary</LinkButton>
              <LinkButton href="/" fullWidth size="large" variant="outline">outline</LinkButton>
              <LinkButton href="/" fullWidth size="large" variant="ghost">ghost</LinkButton>
              <LinkButton href="/" fullWidth size="large" variant="accent">accent</LinkButton>
              <LinkButton href="/" fullWidth size="large" variant="link">link</LinkButton>
            </div>
          </div>
        </Panel>

        <Panel title="Pills">
          <H3 mb={2} mt={4}>Default size</H3>
          <div className="flex gap-2">
            <Pill>Gold</Pill>
            <Pill>Silver</Pill>
            <Pill onRemove={() => {}}>Bronze</Pill>
          </div>

          <H4 mb={2} mt={4}>
            size=&quot;sm&quot;
          </H4>
          <div className="flex gap-2">
            <Pill small>Gold</Pill>
            <Pill small>Silver</Pill>
            <Pill small onRemove={() => {}}>Bronze</Pill>
          </div>

          <H3 mb={2} mt={4}>Color</H3>
          <div className="flex gap-2">
            <Pill color="#e100c1">#e100c1</Pill>
            <Pill color="hotpink">hotpink</Pill>
            <Pill color="rebeccapurple">rebeccapurple</Pill>
          </div>
        </Panel>

        <Panel title="InputField">
          <div className="flex gap-4">
            <div className="basis-1/2">
              <H3 mb={4}>Default</H3>
              <InputField
                label="Name"
                helpText="This is help text"
                startAdornment={<UserCircleIcon className="h-6" />}
                endAdornment={
                  textError ? (
                    <XIcon className="h-6 text-base-error" />
                  ) : (
                    <CheckIcon className="h-6 text-green" />
                  )
                }
                value={textValue}
                onChange={setTextValue}
                error={textError}
              />
              <InputField
                label="Name"
                helpText="This is help text"
                value={usd}
                onChange={setUsd}
                startAdornment="USDC"
                endAdornment={'£' + (Number(usd) * 0.83).toFixed(2)}
              />
              <InputField
                disabled
                label="Disabled"
                helpText="This is help text"
                value={textValue}
              />
              <InputField
                readOnly
                label="Read-only"
                helpText="This is help text"
                value={textValue}
              />
              <H4 my={6}>Compact</H4>
              <InputField
                density='compact'
                label="Name"
                helpText="This is help text"
                startAdornment={<UserCircleIcon className="h-6" />}
                endAdornment={
                  textError ? (
                    <XIcon className="h-6 text-base-error" />
                  ) : (
                    <CheckIcon className="h-6 text-green" />
                  )
                }
                value={textValue}
                onChange={setTextValue}
                error={textError}
              />
              <InputField
                label="Name"
                helpText="This is help text"
                density="compact"
                value={usd}
                onChange={setUsd}
                startAdornment="USDC"
                endAdornment={'£' + (Number(usd) * 0.83).toFixed(2)}
              />
              <InputField
                density='compact'
                disabled
                label="Disabled"
                helpText="This is help text"
                value={textValue}
              />
              <InputField
                density='compact'
                readOnly
                label="Read-only"
                helpText="This is help text"
                value={textValue}
              />
            </div>
            <div className="basis-1/2">
              <H3 mb={4}>Light variant</H3>
              <InputField
                variant='light'
                label="Name"
                helpText="This is help text"
                startAdornment={<UserCircleIcon className="h-6" />}
                endAdornment={
                  textError ? (
                    <XIcon className="h-6 text-base-error" />
                  ) : (
                    <CheckIcon className="h-6 text-green" />
                  )
                }
                value={textValue}
                onChange={setTextValue}
                error={textError}
              />
              <InputField
                variant='light'
                label="Name"
                helpText="This is help text"
                value={usd}
                onChange={setUsd}
                startAdornment="USDC"
                endAdornment={'£' + (Number(usd) * 0.83).toFixed(2)}
              />
              <InputField
                variant='light'
                disabled
                label="Disabled"
                helpText="This is help text"
                value={textValue}
              />
              <InputField
                variant='light'
                readOnly
                label="Read-only"
                helpText="This is help text"
                value={textValue}
              />
              <H4 my={6}>Compact</H4>
              <InputField
                variant='light'
                density='compact'
                label="Name"
                helpText="This is help text"
                startAdornment={<UserCircleIcon className="h-6" />}
                endAdornment={
                  textError ? (
                    <XIcon className="h-6 text-base-error" />
                  ) : (
                    <CheckIcon className="h-6 text-green" />
                  )
                }
                value={textValue}
                onChange={setTextValue}
                error={textError}
              />
              <InputField
                variant='light'
                density='compact'
                label="Name"
                helpText="This is help text"
                value={usd}
                onChange={setUsd}
                startAdornment="USDC"
                endAdornment={'£' + (Number(usd) * 0.83).toFixed(2)}
              />
              <InputField
                variant='light'
                density='compact'
                disabled
                label="Disabled"
                helpText="This is help text"
                value={textValue}
              />
              <InputField
                variant='light'
                density='compact'
                readOnly
                label="Read-only"
                helpText="This is help text"
                value={textValue}
              />
            </div>
          </div>
        </Panel>

        <Panel title="Input">
          <div className="flex gap-4">
            <div className="flex-1">
              <H3 mb={4}>Default</H3>
              <Input
                value={textValue}
                onChange={setTextValue}
                hasError={!!textError}
                placeholder="placeholder text"
              />
              <Input
                value={usd}
                onChange={setUsd}
                startAdornment="USDC"
                endAdornment={'£' + (Number(usd) * 0.83).toFixed(2)}
              />
              <Input
                disabled
                value="tedlasso"
                startAdornment="@"
                endAdornment="disabled"
              />
              <Input
                readOnly
                value="tedlasso"
                startAdornment="@"
                endAdornment="readonly"
              />
              <H4 my={6}>Compact</H4>
              <Input
                density="compact"
                value={textValue}
                onChange={setTextValue}
                hasError={!!textError}
                placeholder="placeholder text"
              />
              <Input
                density="compact"
                value={usd}
                onChange={setUsd}
                startAdornment="USDC"
                endAdornment={'£' + (Number(usd) * 0.83).toFixed(2)}
              />
              <Input
                density="compact"
                disabled
                value="tedlasso"
                startAdornment="@"
                endAdornment="disabled"
              />
              <Input
                density="compact"
                readOnly
                value="tedlasso"
                startAdornment="@"
                endAdornment="readonly"
              />
            </div>
            <div className="flex flex-col gap-1 basis-1/2">
              <H3 mb={4}>Light</H3>
              <Input
                variant='light'
                value={textValue}
                onChange={setTextValue}
                hasError={!!textError}
                placeholder="placeholder text"
              />
              <Input
                variant='light'
                value={usd}
                onChange={setUsd}
                startAdornment="USDC"
                endAdornment={'£' + (Number(usd) * 0.83).toFixed(2)}
              />
              <Input
                variant='light'
                disabled
                value="tedlasso"
                startAdornment="@"
                endAdornment="disabled"
              />
              <Input
                variant='light'
                readOnly
                value="tedlasso"
                startAdornment="@"
                endAdornment="readonly"
              />
              <H4 my={6}>Compact</H4>
              <Input
                variant='light'
                density="compact"
                value={textValue}
                onChange={setTextValue}
                hasError={!!textError}
                placeholder="placeholder text"
              />
              <Input
                variant='light'
                density="compact"
                value={usd}
                onChange={setUsd}
                startAdornment="USDC"
                endAdornment={'£' + (Number(usd) * 0.83).toFixed(2)}
              />
              <Input
                variant='light'
                density="compact"
                disabled
                value="tedlasso"
                startAdornment="@"
                endAdornment="disabled"
              />
              <Input
                variant='light'
                density="compact"
                readOnly
                value="tedlasso"
                startAdornment="@"
                endAdornment="readonly"
              />
            </div>
          </div>
        </Panel>

        <Panel title="FormField">
          <FormField label="label" helpText="help text">
            <div className="h-10 bg-action-disabled" />
          </FormField>
          <FormField label="label" error="error">
            <div className="h-10 bg-action-disabled" />
          </FormField>
          <H3 mb={2}>Compact</H3>
          <FormField density="compact" label="label" helpText="help text">
            <div className="h-10 bg-action-disabled" />
          </FormField>
          <FormField density="compact" label="label" error="error">
            <div className="h-10 bg-action-disabled" />
          </FormField>
        </Panel>

        <Panel title="CurrencyInput">
          <div className="flex gap-4">
            <div className="flex-1">
              <H3 mb={4}>Default</H3>
              <CurrencyInput
                label="Name"
                helpText="This is help text"
                value={currencyValue}
                onChange={setCurrencyValue}
                error={textError}
              />
              <CurrencyInput
                disabled
                label="Disabled"
                helpText="This is help text"
                value={currencyValue}
              />
              <CurrencyInput
                readOnly
                label="Read-only"
                helpText="This is help text"
                value={currencyValue}
              />
              <H4 my={4}>Compact</H4>
              <CurrencyInput
                density='compact'
                label="Name"
                helpText="This is help text"
                value={currencyValue}
                onChange={setCurrencyValue}
                error={textError}
              />
              <CurrencyInput
                density='compact'
                disabled
                label="Disabled"
                helpText="This is help text"
                value={currencyValue}
              />
              <CurrencyInput
                density='compact'
                readOnly
                label="Read-only"
                helpText="This is help text"
                value={currencyValue}
              />
            </div>
            <div className="flex-1">
              <H3 mb={4}>Light</H3>
              <CurrencyInput
                variant="light"
                label="Name"
                helpText="This is help text"
                value={currencyValue}
                onChange={setCurrencyValue}
                error={textError}
              />
              <CurrencyInput
                variant="light"
                disabled
                label="Disabled"
                helpText="This is help text"
                value={currencyValue}
              />
              <CurrencyInput
                variant="light"
                readOnly
                label="Read-only"
                helpText="This is help text"
                value={currencyValue}
              />
              <H4 my={4}>Compact</H4>
              <CurrencyInput
                density='compact'
                variant="light"
                label="Name"
                helpText="This is help text"
                value={currencyValue}
                onChange={setCurrencyValue}
                error={textError}
              />
              <CurrencyInput
                density='compact'
                variant="light"
                disabled
                label="Disabled"
                helpText="This is help text"
                value={currencyValue}
              />
              <CurrencyInput
                density='compact'
                variant="light"
                readOnly
                label="Read-only"
                helpText="This is help text"
                value={currencyValue}
              />
            </div>
          </div>
        </Panel>

        <Panel title="Select">
          <div className="flex flex-wrap gap-4">
            <div className="flex flex-col flex-1 gap-1">
              <H3 mb={6}>Outline (default)</H3>
              <Select
                value={selected}
                options={options}
                onChange={setSelected}
              />
              <Select disabled value={selected} options={options} />
              <H4 my={6}>Compact</H4>
              <Select
                density="compact"
                value={selected}
                options={options}
                onChange={setSelected}
              />
              <Select
                disabled
                density="compact"
                value={selected}
                options={options}
                onChange={setSelected}
              />
            </div>
            <div className="flex flex-col flex-1 gap-1">
              <H3 mb={6}>Solid</H3>
              <Select
                value={selected}
                options={options}
                onChange={setSelected}
                variant="solid"
              />
              <Select
                disabled
                value={selected}
                options={options}
                variant="solid"
              />
              <H4 my={6}>Compact</H4>
              <Select
                density="compact"
                value={selected}
                options={options}
                onChange={setSelected}
                variant="solid"
              />
              <Select
                disabled
                density="compact"
                value={selected}
                options={options}
                onChange={setSelected}
                variant="solid"
              />
            </div>
            <div className="flex flex-col flex-1 gap-1">
              <H3 mb={6}>Light</H3>
              <Select
                value={selected}
                options={options}
                onChange={setSelected}
                variant="light"
              />
              <Select
                disabled
                value={selected}
                options={options}
                variant="light"
              />
              <H4 my={6}>Compact</H4>
              <Select
                density="compact"
                value={selected}
                options={options}
                onChange={setSelected}
                variant="light"
              />
              <Select
                disabled
                density="compact"
                value={selected}
                options={options}
                onChange={setSelected}
                variant="light"
              />
            </div>
          </div>
        </Panel>

        <Panel title="SelectField">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1">
              <H3 mb={6}>Outline (default)</H3>
              <SelectField
                label="Name"
                helpText="This is help text"
                value={selected}
                options={options}
                onChange={setSelected}
                error={selectedError}
              />
              <SelectField
                disabled
                label="Disabled"
                value={selected}
                options={options}
              />
              <H4 my={6}>Compact</H4>
              <SelectField
                density='compact'
                label="Name"
                helpText="This is help text"
                value={selected}
                options={options}
                onChange={setSelected}
                error={selectedError}
              />
              <SelectField
                density='compact'
                disabled
                label="Disabled"
                value={selected}
                options={options}
              />
            </div>
            <div className="flex-1">
              <H3 mb={6}>Solid</H3>
              <SelectField
                label="Name"
                helpText="This is help text"
                value={selected}
                options={options}
                onChange={setSelected}
                error={selectedError}
                variant="solid"
              />
              <SelectField
                disabled
                label="Disabled"
                value={selected}
                options={options}
                variant="solid"
              />
              <H4 my={6}>Compact</H4>
              <SelectField
                density='compact'
                label="Name"
                helpText="This is help text"
                value={selected}
                options={options}
                onChange={setSelected}
                error={selectedError}
                variant="solid"
              />
              <SelectField
                density='compact'
                disabled
                label="Disabled"
                value={selected}
                options={options}
                variant="solid"
              />
            </div>
            <div className="flex-1">
              <H3 mb={6}>Light</H3>
              <SelectField
                label="Name"
                helpText="This is help text"
                value={selected}
                options={options}
                onChange={setSelected}
                error={selectedError}
                variant="light"
              />
              <SelectField
                disabled
                label="Disabled"
                value={selected}
                options={options}
                variant="light"
              />
              <H4 my={6}>Compact</H4>
              <SelectField
                density='compact'
                label="Name"
                helpText="This is help text"
                value={selected}
                options={options}
                onChange={setSelected}
                error={selectedError}
                variant="light"
              />
              <SelectField
                density='compact'
                disabled
                label="Disabled"
                value={selected}
                options={options}
                variant="light"
              />
            </div>
          </div>
        </Panel>

        <Panel title="FilterableSelect">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1">
              <H3 mb={6}>Outline (default)</H3>
              <FilterableSelect
                label="Name"
                helpText="This is help text"
                value={selected}
                options={options}
                onChange={setSelected}
                error={selectedError}
              />
              <FilterableSelect
                disabled
                label="Disabled"
                value={selected}
                options={options}
              />
              <H4 my={6}>Compact</H4>
              <FilterableSelect
                density="compact"
                label="Name (compact)"
                helpText="This is help text"
                value={selected}
                options={options}
                onChange={setSelected}
                error={selectedError}
              />
              <FilterableSelect
                disabled
                density="compact"
                label="Name (compact)"
                helpText="This is help text"
                value={selected}
                options={options}
                onChange={setSelected}
              />
            </div>
            <div className="flex-1">
              <H3 mb={6}>Solid</H3>
              <FilterableSelect
                label="Name"
                helpText="This is help text"
                value={selected}
                options={options}
                onChange={setSelected}
                error={selectedError}
                variant="solid"
              />
              <FilterableSelect
                disabled
                label="Disabled"
                value={selected}
                options={options}
                variant="solid"
              />
              <H4 my={6}>Compact</H4>
              <FilterableSelect
                density="compact"
                label="Name (compact)"
                helpText="This is help text"
                value={selected}
                options={options}
                onChange={setSelected}
                error={selectedError}
                variant="solid"
              />
              <FilterableSelect
                disabled
                density="compact"
                label="Name (compact)"
                helpText="This is help text"
                value={selected}
                options={options}
                variant="solid"
              />
            </div>
            <div className="flex-1">
              <H3 mb={6}>Light</H3>
              <FilterableSelect
                label="Name"
                helpText="This is help text"
                value={selected}
                options={options}
                onChange={setSelected}
                error={selectedError}
                variant="light"
              />
              <FilterableSelect
                disabled
                label="Disabled"
                value={selected}
                options={options}
                variant="light"
              />
              <H4 my={6}>Compact</H4>
              <FilterableSelect
                density="compact"
                label="Name (compact)"
                helpText="This is help text"
                value={selected}
                options={options}
                onChange={setSelected}
                error={selectedError}
                variant="light"
              />
              <FilterableSelect
                disabled
                density="compact"
                label="Name (compact)"
                helpText="This is help text"
                value={selected}
                options={options}
                variant="light"
              />
            </div>
          </div>
        </Panel>

        <Panel title="RadioGroup">
          <RadioGroup
            name="name1"
            value={selected}
            options={options}
            onChange={setSelected}
          />
          <br />
          <RadioGroup
            inline
            name="name2"
            value={selected}
            options={options}
            onChange={setSelected}
          />
          <br />
          <RadioGroup
            disabled
            name="name3"
            value={selected}
            options={options}
          />
        </Panel>

        <Panel title="RadioGroupField">
          <RadioGroupField
            label="Name"
            name="name4"
            helpText="This is help text"
            value={selected}
            options={options}
            onChange={setSelected}
            error={selectedError}
          />
          <RadioGroupField
            inline
            label="Name"
            name="name5"
            helpText="This is help text"
            value={selected}
            options={options}
            onChange={setSelected}
            error={selectedError}
          />
          <RadioGroupField
            disabled
            name="name6"
            label="Disabled"
            helpText="This is help text"
            value={selected}
            options={options}
            error={selectedError}
          />
        </Panel>

        <Panel title="Toggle">
          <Toggle
            label="I'm interested in the premier league only"
            checked={!checkValue}
            onChange={(checked) => setCheckValue(!checked)}
          />
          <br />
          <Toggle
            label="I'm interested in the championship league only"
            checked={checkValue}
            onChange={setCheckValue}
            error="Example error"
          />
          <br />
          <Toggle
            label="I'm interested in snacks"
            checked={checkValue}
            onChange={setCheckValue}
            helpText="This text is somehow helping"
          />
          <br />
          <Toggle
            disabled
            label="Disabled"
            checked={checkValue}
            onChange={setCheckValue}
          />
        </Panel>

        <Panel title="Checkbox">
          <Checkbox
            label="I'm interested in the premier league only"
            checked={checkValue}
            onChange={(event) => setCheckValue(event.target.checked)}
          />
          <br />
          <Checkbox
            disabled
            label="Disabled"
            checked={checkValue}
            onChange={(event) => setCheckValue(event.target.checked)}
          />
        </Panel>

        <Panel title="Table" fullWidth hScrollContent>
          <Table<IActivityItem>
            noOuterBorder
            columns={TABLE_COLUMNS}
            data={TABLE_DATA}
          />
        </Panel>

        <Table<IActivityItem> columns={TABLE_COLUMNS} data={TABLE_DATA} />

        <Panel title="Tooltip">
          <H3 mb={4}>
            Info icon tip <Tooltip content="Tooltip" />
          </H3>
          <Tooltip
            content={
              <p>
                Here is a longer tip with <strong>HTML</strong> that will wrap
                to multiple lines.
              </p>
            }
          >
            <Button>Hover for tip</Button>
          </Tooltip>

          <H3 mt={6}>Position</H3>
          <div className="p-10 text-center">
            <Tooltip content="tooltip" position="left">
              <Pill>left</Pill>
            </Tooltip>
            <Tooltip content="tooltip">
              <Pill>top (DEFAULT)</Pill>
            </Tooltip>
            <Tooltip content="tooltip" position="bottom">
              <Pill>Bottom</Pill>
            </Tooltip>
            <Tooltip content="tooltip" position="right">
              <Pill>Right</Pill>
            </Tooltip>
          </div>
        </Panel>

        <Panel title="VideoTile">
          {videoFile ? <VideoTile src={videoFile} /> : <VideoFileInput />}
        </Panel>

        <Panel title="Video">
          {videoFile ? (
            <Video src={videoFile} controls autoPlay muted />
          ) : (
            <VideoFileInput />
          )}
        </Panel>
      </div>
    </DefaultLayout>
  )
}

interface IActivityItem {
  id: string
  type: 'mint' | 'list' | 'purchase' | 'transfer'
  date: string
  username?: string
  address?: string
  price?: number
}

const TABLE_DATA: IActivityItem[] = [
  { id: '1', type: 'transfer', date: '2020-04-04', address: 'O2YYG...R4EVU' },
  {
    id: '2',
    type: 'purchase',
    date: '2020-03-03',
    username: 'afaceinacloud',
    price: 50_000,
  },
  { id: '3', type: 'list', date: '2020-02-02' },
  { id: '4', type: 'mint', date: '2020-01-01' },
]

const TABLE_COLUMNS = [
  { name: 'Event', key: 'type' },
  { name: 'Price', key: 'price' },
  { name: 'Address', key: 'address' },
  { name: 'User', key: 'username' },
  { name: 'Date', key: 'date' },
]
