export const getLanguageFromExtension = (extension: string) => {
  if (extension === 'js') return 'javascript'

  if (extension === 'ts') return 'typescript'

  if (extension === 'md' || extension === 'mdx') return 'markdown'

  return extension
}

export const getSelection = (editor: any) => {
  const selection = editor?.getModel().getValueInRange(editor?.getSelection())
  return selection ?? ''
}
