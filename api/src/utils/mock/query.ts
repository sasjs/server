import { Request, Response } from 'express'

export const verifyQuery = (req: Request, res: Response, args: string[]) => {
  let isValid = true
  const { query } = req

  args.forEach((arg: string) => {
    if (!Object.keys(query).includes(arg)) {
      res.status(400).json({ message: `${arg} query argument is not present.` })
      isValid = false
    } else if (!query[arg]) {
      res.status(400).json({ message: `${arg} query argument is not valid.` })
      isValid = false
    }
  })

  return isValid
}
