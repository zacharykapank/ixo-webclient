import { Verification } from '@ixo/impactxclient-sdk/types/codegen/ixo/iid/v1beta1/tx'
import {
  AccordedRight,
  LinkedEntity,
  LinkedResource,
  Service,
} from '@ixo/impactxclient-sdk/types/codegen/ixo/iid/v1beta1/types'
import { FlexBox, SvgBox, theme } from 'components/App/App.styles'
import ClaimTemplateCard from 'components/Modals/ClaimSetupModal/ClaimTemplateCard'
import { Typography } from 'components/Typography'
import { deviceWidth } from 'constants/device'
import { useCreateEntity, useCreateEntityState } from 'hooks/createEntity'
import { useQuery } from 'hooks/window'
import moment from 'moment'
import { Button } from 'pages/CreateEntity/Components'
import React, { useState } from 'react'
import { TClaimMetadataModel } from 'types/protocol'
import { ReactComponent as CheckCircleIcon } from 'assets/images/icon-check-circle.svg'
import { ReactComponent as ExclamationIcon } from 'assets/images/icon-exclamation-circle.svg'
import { useHistory } from 'react-router-dom'

const ReviewClaim: React.FC = (): JSX.Element => {
  const history = useHistory()
  const createEntityState = useCreateEntityState()
  const profile: TClaimMetadataModel = createEntityState.profile as TClaimMetadataModel
  const {
    entityType,
    service: serviceData,
    linkedEntity: linkedEntityData,
    claimQuestions,
    creator,
    clearEntity,
    gotoStep,
  } = createEntityState
  const { UploadLinkedResource, CreateProtocol, CreateEntityBase } = useCreateEntity()
  const [submitting, setSubmitting] = useState(false)
  const { getQuery } = useQuery()
  const success = getQuery('success')

  const handleSignToCreate = async (): Promise<void> => {
    console.log({ claimQuestions })
    setSubmitting(true)

    const accordedRight: AccordedRight[] = []
    const verification: Verification[] = []
    let service: Service[] = []
    let linkedEntity: LinkedEntity[] = []
    let linkedResource: LinkedResource[] = []

    // AccordedRight TODO:

    // Service
    service = serviceData.map((item: Service) => ({ ...item, id: `{id}#${item.id}` }))

    // LinkedEntity
    linkedEntity = Object.values(linkedEntityData)

    // LinkedResource
    linkedResource = linkedResource.concat(await UploadLinkedResource())

    // Create Protocol for dao
    const protocolDid = await CreateProtocol()
    if (!protocolDid) {
      setSubmitting(false)
      history.push({ pathname: history.location.pathname, search: `?success=false` })
      return
    }

    // Create DAO entity
    const entityDid = await CreateEntityBase(entityType, protocolDid, {
      service,
      linkedResource,
      accordedRight,
      linkedEntity,
      verification,
      relayerNode: process.env.REACT_APP_RELAYER_NODE,
    })
    if (!entityDid) {
      setSubmitting(false)
      history.push({ pathname: history.location.pathname, search: `?success=false` })
      return
    }

    setSubmitting(false)
    history.push({ pathname: history.location.pathname, search: `?success=true` })
  }

  return (
    <FlexBox width={`${deviceWidth.tablet}px`} gap={10} alignItems='stretch'>
      {/* <ClaimCard
        type={profile.type}
        title={profile.title}
        description={profile.description || ''}
        numOfQuestions={Object.keys(claimQuestions).length}
      /> */}
      <ClaimTemplateCard
        template={{
          id: '',
          title: profile.title,
          description: profile.description!,
          creator: creator.displayName,
          createdAt: moment(new Date()).format('DD-MMM-YYYY'),
        }}
      />
      <FlexBox direction='column' justifyContent='space-between' width='100%' style={{ flex: 1 }}>
        {!success && (
          <>
            <FlexBox direction='column' width='100%' gap={4}>
              <Typography variant='secondary'>
                This is the last step before creating this Verifiable Claim on the ixo Blockchain.
              </Typography>
              <Typography variant='secondary'>
                <Typography variant='secondary' color='blue'>
                  Review the Verifiable Claim details
                </Typography>{' '}
                you have configured.
              </Typography>
              <Typography variant='secondary'>
                When you are ready to commit, sign with your DID Account keys, or{' '}
                <Typography variant='secondary' color='black'>
                  connect a different account
                </Typography>{' '}
                as the Verifiable Claim Creator.
              </Typography>
            </FlexBox>
            <FlexBox width='100%' gap={4} mt={4}>
              <Button variant='secondary' onClick={(): void => gotoStep(-1)} style={{ width: '100%' }}>
                Back
              </Button>
              <Button variant='primary' onClick={handleSignToCreate} style={{ width: '100%' }} loading={submitting}>
                Sign To Create
              </Button>
            </FlexBox>
          </>
        )}
        {success === 'true' && (
          <>
            <FlexBox direction='column' justifyContent='center' alignItems='center' width='100%' height='100%' gap={4}>
              <SvgBox color={theme.ixoLightGreen} svgWidth={30} svgHeight={30}>
                <CheckCircleIcon />
              </SvgBox>
              <Typography variant='secondary' size='2xl'>
                {profile.title} Successfully created!
              </Typography>
            </FlexBox>
            <FlexBox width='100%' gap={4}>
              <Button
                variant='primary'
                onClick={() => {
                  history.push(`/explore?type=${entityType}`)
                  clearEntity()
                }}
                style={{ width: '100%' }}
              >
                View in the Explorer
              </Button>
            </FlexBox>
          </>
        )}
        {success === 'false' && (
          <>
            <FlexBox direction='column' justifyContent='center' alignItems='center' width='100%' height='100%' gap={4}>
              <SvgBox color={theme.ixoDarkOrange} svgWidth={30} svgHeight={30}>
                <ExclamationIcon />
              </SvgBox>
              <Typography variant='secondary' size='2xl'>
                Something went wrong. Please try again.
              </Typography>
            </FlexBox>
            <FlexBox width='100%' gap={4}>
              <Button variant='secondary' onClick={() => history.goBack()} style={{ width: '100%' }}>
                Back
              </Button>
              <Button variant='primary' onClick={handleSignToCreate} style={{ width: '100%' }} loading={submitting}>
                Sign To Create
              </Button>
            </FlexBox>
          </>
        )}
      </FlexBox>
    </FlexBox>
  )
}

export default ReviewClaim
