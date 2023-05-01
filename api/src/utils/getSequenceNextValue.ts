import Counter from '../model/Counter'

export const getSequenceNextValue = async (seqName: string) => {
  const seqDoc = await Counter.findOne({ id: seqName })
  if (!seqDoc) {
    await Counter.create({ id: seqName, seq: 1 })
    return 1
  }

  seqDoc.seq += 1

  await seqDoc.save()

  return seqDoc.seq
}
