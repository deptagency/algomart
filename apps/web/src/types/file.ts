import { FileWithPath } from 'react-dropzone'

export interface UploadedFileProps {
  checksum?: string
  name: string
  type: string
  url: string
}

export interface FileProps extends FileWithPath {
  checksum?: string
  hash?: string
  buffer?: string
}

export interface FileWithPreview extends FileWithPath {
  preview: string
}

export interface FileUploadProps {
  className: string
  files: File[] | null
  setFiles: (files: File[]) => void
}
