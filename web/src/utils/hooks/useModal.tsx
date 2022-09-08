import { useState } from 'react'
import Modal from '../../components/modal'

export const useModal = () => {
  const [openModal, setOpenModal] = useState(false)
  const [modalTitle, setModalTitle] = useState('')
  const [modalPayload, setModalPayload] = useState('')

  const Dialog = () => (
    <Modal
      open={openModal}
      setOpen={setOpenModal}
      title={modalTitle}
      payload={modalPayload}
    />
  )

  return { Dialog, setOpenModal, setModalTitle, setModalPayload }
}
