import React, { useState, useEffect } from 'react'
import * as Modal from 'react-modal'
import { ReactComponent as CloseIcon } from 'assets/images/icon-close.svg'
import { ModalStyles, CloseButton, ModalBody, ModalWrapper, ModalRow, ModalTitle } from 'components/Modals/styles'
import { TEntityServiceModel } from 'types/protocol'
import { Button } from 'pages/CreateEntity/Components'
import { FormData } from 'components/JsonForm/types'
import NodeCard from 'components/Entities/CreateEntity/CreateEntityAdvanced/Components/NodeCard/NodeCard'
import { Typography } from 'components/Typography'

interface Props {
  service: TEntityServiceModel[]
  open: boolean
  onClose: () => void
  onChange?: (services: TEntityServiceModel[]) => void
}

const ServiceSetupModal: React.FC<Props> = ({ service, open, onClose, onChange }): JSX.Element => {
  const [formData, setFormData] = useState<FormData[]>([])

  useEffect(() => {
    setFormData(
      (service ?? []).map((data) => ({
        nodeId: data.id,
        type: data.type,
        serviceEndpoint: data.serviceEndpoint,
      })),
    )
  }, [service])

  const handleAddNode = (): void => onChange && setFormData((pre) => [...pre, {}])
  const handleUpdateNode = (index: number, service: FormData): void =>
    onChange && setFormData((pre) => pre.map((origin, idx) => (index === idx ? service : origin)))
  const handleRemoveNode = (index: number): void =>
    onChange && setFormData((pre) => pre.filter((_, idx) => idx !== index))

  const handleUpdateServices = (): void => {
    onChange &&
      onChange(
        formData.map((data) => ({
          id: data.nodeId,
          type: data.type,
          serviceEndpoint: data.serviceEndpoint,
        })),
      )
    onClose()
  }
  return (
    // @ts-ignore
    <Modal style={ModalStyles} isOpen={open} onRequestClose={onClose} contentLabel='Modal' ariaHideApp={false}>
      <CloseButton onClick={onClose}>
        <CloseIcon />
      </CloseButton>

      <ModalWrapper style={{ width: 600 }}>
        <ModalTitle>Services</ModalTitle>
        <ModalBody>
          {formData.map((service, index) => (
            <ModalRow key={index}>
              <NodeCard
                type={service?.type}
                nodeId={service?.nodeId}
                removable={formData.length > 1}
                serviceEndpoint={service?.serviceEndpoint}
                handleUpdateContent={(formData): void => handleUpdateNode(index, formData)}
                handleRemoveSection={(): void => handleRemoveNode(index)}
                handleSubmitted={(): void => {
                  // this.props.handleValidated(stake.id)
                }}
                handleError={(): void => {
                  // this.props.handleValidationError(stake.id, errors)
                }}
              />
            </ModalRow>
          ))}
          <ModalRow style={{ justifyContent: 'center' }}>
            <Typography className='cursor-pointer' color={'blue'} onClick={handleAddNode}>
              + Add Node
            </Typography>
          </ModalRow>
          <ModalRow style={{ justifyContent: 'flex-end' }}>
            <Button disabled={!formData} onClick={handleUpdateServices}>
              Continue
            </Button>
          </ModalRow>
        </ModalBody>
      </ModalWrapper>
    </Modal>
  )
}

export default ServiceSetupModal
