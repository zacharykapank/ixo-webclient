import { LinkedResource } from '@ixo/impactxclient-sdk/types/codegen/ixo/iid/v1beta1/types'
import { FlexBox } from 'components/App/App.styles'
import { useAccount } from 'hooks/account'
import { useCreateEntity } from 'hooks/createEntity'
import useCurrentEntity, { useCurrentEntityAdminAccount } from 'hooks/currentEntity'
import { MsgExecAgentSubmit } from 'lib/protocol'
import { Button } from 'pages/CreateEntity/Components'
import React, { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { selectEntityById } from 'redux/entitiesExplorer/entitiesExplorer.selectors'
import { useAppSelector } from 'redux/hooks'
import { TEntityClaimModel, TQuestion } from 'types/protocol'
import { serviceEndpointToUrl } from 'utils/entities'
import { errorToast, successToast } from 'utils/toast'
import QuestionCard from './QuestionCard'

const ClaimQuestions: React.FC = () => {
  const { claimId } = useParams<{ claimId: string }>()
  const { signingClient, signer } = useAccount()
  const { claim } = useCurrentEntity()
  const { UploadDataToService } = useCreateEntity()
  const adminAddress = useCurrentEntityAdminAccount()
  const selectedClaim: TEntityClaimModel = claim[claimId]

  const [templateEntityId] = (selectedClaim?.template?.id || '').split('#')
  const templateEntity = useAppSelector(selectEntityById(templateEntityId))

  const [formSchemas, setFormSchemas] = useState<TQuestion[]>([])
  console.log({ formSchemas })

  const [formData, setFormData] = useState<{ [id: string]: any }>({})
  console.log({ formData })

  const disabled = useMemo(() => {
    return formSchemas.length === 0 || formSchemas.length !== Object.values(formData).filter(Boolean).length
  }, [formSchemas, formData])

  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (templateEntity) {
      const claimSchemaLinkedResources: LinkedResource[] = templateEntity.linkedResource.filter(
        (item: LinkedResource) => item.type === 'ClaimSchema',
      )

      ;(async () => {
        const responses = await Promise.all(
          claimSchemaLinkedResources.map((item) => {
            const url = serviceEndpointToUrl(item.serviceEndpoint, templateEntity.service)
            return fetch(url)
              .then((response) => response.json())
              .then((response) => {
                return response
              })
          }),
        )
        setFormSchemas(responses.map((response) => response.question))
      })()
    }
    return () => {
      setFormSchemas([])
    }
  }, [templateEntity])

  const handleChangeForm = (schemId: string) => (values: any) => {
    setFormData((v) => ({ ...v, [schemId]: values }))
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    // TODO: collectionId where to fetch ???
    const collectionId = '1'

    // TODO: upload answers to ipfs and get cid as claimId, the saving payload interface ???
    const res = await UploadDataToService(JSON.stringify(formData))
    const claimId = (res as any).key || (res as any).cid

    console.log('MsgExecAgentSubmit', { claimId, collectionId, adminAddress })

    const response = await MsgExecAgentSubmit(signingClient, signer, {
      claimId,
      collectionId,
      adminAddress,
    }).catch((e: any) => {
      console.error('MsgExecAgentSubmit', e)
      errorToast('Failed', e.message)
      return undefined
    })
    console.log('MsgExecAgentSubmit', response)

    if (response?.code === 0) {
      successToast('Success', 'Submit successfully')
    } else {
      errorToast('Failed', response?.rawLog)
    }
    setSubmitting(false)
  }

  return (
    <FlexBox width='100%'>
      <FlexBox direction='column' width='60%' gap={7}>
        {formSchemas.map((schema, index) => (
          <QuestionCard
            key={index}
            no={index + 1}
            schema={schema}
            formData={formData[schema.id]}
            onChange={handleChangeForm(schema.id)}
          />
        ))}
        {formSchemas.length > 0 && (
          <Button variant='secondary' size={'lg'} onClick={handleSubmit} disabled={disabled} loading={submitting}>
            Sign And Submit
          </Button>
        )}
      </FlexBox>
    </FlexBox>
  )
}

export default ClaimQuestions
