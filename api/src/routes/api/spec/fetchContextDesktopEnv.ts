// The app reads MODE during import and during asynchronous initialization.
const previousMode = process.env.MODE
process.env.MODE = 'desktop'

afterAll(() => {
  if (previousMode === undefined) delete process.env.MODE
  else process.env.MODE = previousMode
})

export {}
