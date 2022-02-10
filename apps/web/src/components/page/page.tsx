import DefaultLayout from '@/layouts/default-layout'

export interface PageProps {
  title: string
  body: string
}

export default function Page({ title, body }: PageProps) {
  return (
    <DefaultLayout pageTitle={title}>
      <div className="p-3">
        <div>{title} </div>
        <div dangerouslySetInnerHTML={{ __html: body }} />
      </div>
    </DefaultLayout>
  )
}
