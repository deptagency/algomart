import Loading from '../loading/loading'

export interface LoadingStageProps {
  message: string
}

export default function LoadingStage(props: LoadingStageProps) {
  return (
    <div>
      <Loading loadingText={props.message} />
    </div>
  )
}
