export enum MemberType {
  service = 'service',
  file = 'file',
  folder = 'folder'
}

export interface ServiceMember {
  name: string
  type: MemberType.service
  code: string
}

export interface FileMember {
  name: string
  type: MemberType.file
  code: string
}

export interface FolderMember {
  name: string
  type: MemberType.folder
  members: (FolderMember | ServiceMember | FileMember)[]
}
export interface FileTree {
  members: (FolderMember | ServiceMember | FileMember)[]
}

export const isFileTree = (arg: any): arg is FileTree =>
  arg &&
  arg.members &&
  Array.isArray(arg.members) &&
  arg.members.filter(
    (member: ServiceMember | FileMember | FolderMember) =>
      !isServiceMember(member, '-') &&
      !isFileMember(member, '-') &&
      !isFolderMember(member, '-')
  ).length === 0

const isServiceMember = (arg: any, pre: string): arg is ServiceMember =>
  arg &&
  typeof arg.name === 'string' &&
  arg.type === MemberType.service &&
  typeof arg.code === 'string'

const isFileMember = (arg: any, pre: string): arg is ServiceMember =>
  arg &&
  typeof arg.name === 'string' &&
  arg.type === MemberType.file &&
  typeof arg.code === 'string'

const isFolderMember = (arg: any, pre: string): arg is FolderMember =>
  arg &&
  typeof arg.name === 'string' &&
  arg.type === MemberType.folder &&
  arg.members &&
  Array.isArray(arg.members) &&
  arg.members.filter(
    (member: FolderMember | ServiceMember) =>
      !isServiceMember(member, pre + '-') &&
      !isFileMember(member, pre + '-') &&
      !isFolderMember(member, pre + '-')
  ).length === 0
