import { FlexBox, SvgBox, theme } from 'components/App/App.styles'
import { Typography } from 'components/Typography'
import { useCurrentEntityProfile } from 'hooks/currentEntity'
import { Button } from 'pages/CreateEntity/Components'
import React, { useMemo, useState } from 'react'
import { NavLink, useHistory, useParams } from 'react-router-dom'
import { ReactComponent as WaitIcon } from 'assets/images/eco/wait.svg'
import { ProgressBar } from 'components/ProgressBar/ProgressBar'
import { useCreateEntity, useCreateEntityState } from 'hooks/createEntity'
import { useCurrentDaoGroup } from 'hooks/currentDao'
import moment from 'moment'
import { durationToSeconds } from 'utils/conversions'
import { ProposalActionConfig, TProposalActionModel, TProposalMetadataModel } from 'types/protocol'
import { useAccount } from 'hooks/account'
import { truncateString } from 'utils/formatters'
import * as Toast from 'utils/toast'
import { contracts } from '@ixo/impactxclient-sdk'
import { CosmosMsgForEmpty } from '@ixo/impactxclient-sdk/types/codegen/DaoProposalSingle.types'
import { useMakeProposalAction } from 'hooks/proposal'
import { decodedMessagesString } from 'utils/messages'
import { fee } from 'lib/protocol'
import {
  AccordedRight,
  LinkedEntity,
  LinkedResource,
  Service,
} from '@ixo/impactxclient-sdk/types/codegen/ixo/iid/v1beta1/types'
import { useQuery } from 'hooks/window'
import { ReactComponent as CheckCircleIcon } from 'assets/images/icon-check-circle.svg'
import { ReactComponent as ExclamationIcon } from 'assets/images/icon-exclamation-circle.svg'
import { getValueFromEvents } from 'utils/objects'

const ReviewProposal: React.FC = () => {
  const history = useHistory()
  const { entityId, coreAddress } = useParams<{ entityId: string; coreAddress: string }>()
  const { address, cosmWasmClient } = useAccount()
  const { name: entityName } = useCurrentEntityProfile()
  const { daoGroup, daoPreProposeSingleClient, depositInfo } = useCurrentDaoGroup(coreAddress)
  const createEntityState = useCreateEntityState()
  const { entityType, proposal, service: serviceData, linkedEntity: linkedEntityData, clearEntity } = createEntityState
  const metadata = createEntityState.metadata as TProposalMetadataModel
  const { UploadLinkedResource, CreateProtocol, CreateEntityBase, AddLinkedEntity } = useCreateEntity()
  const {
    makeAuthzAuthorizationAction,
    makeAuthzExecAction,
    makeBurnNftAction,
    makeCustomAction,
    makeDaoAdminExecAction,
    makeExecuteAction,
    makeGovernanceVoteAction,
    makeInstantiateAction,
    makeManageCw20Action,
    makeManageCw721Action,
    makeManageMembersAction,
    makeManageStorageItemsAction,
    makeManageSubDaosAction,
    makeMigrateAction,
    makeMintAction,
    makePerformTokenSwapAction,
    makeSpendAction,
    makeStakeAction,
    makeTransferNFTAction,
    makeUpdateAdminAction,
    makeUpdateInfoAction,
    makeUpdatePreProposeConfigAction,
    makeUpdateVotingConfigAction,
    makeValidatorActions,
    makeWithdrawTokenSwapAction,
  } = useMakeProposalAction(coreAddress)
  const [submitting, setSubmitting] = useState(false)
  const memberAddresses = useMemo(() => daoGroup?.votingModule.members?.map(({ addr }) => addr), [daoGroup])
  const votingPeriod = useMemo(
    () =>
      daoGroup?.proposalModule?.proposalConfig.max_voting_period
        ? durationToSeconds(100, daoGroup.proposalModule.proposalConfig.max_voting_period)
        : 0,
    [daoGroup],
  )
  const votingModuleAddress = useMemo(() => daoGroup?.votingModule.votingModuleAddress, [daoGroup])
  const validActions = useMemo(() => (proposal?.actions ?? []).filter((item) => item.data), [proposal])
  const { getQuery } = useQuery()
  const success = getQuery('success')

  const validateSubmit = () => {
    if (!address) {
      console.error('validateSubmit', { address })
      return false
    }
    if (!memberAddresses.includes(address)) {
      Toast.errorToast('You must be a member of the group')
      return false
    }
    return true
  }

  const handlePropose = async (
    deedDid: string,
  ): Promise<{ proposalId: number; transactionHash: string } | undefined> => {
    if (!validateSubmit()) {
      return undefined
    }

    const daoVotingCw4Client = await new contracts.DaoVotingCw4.DaoVotingCw4Client(
      cosmWasmClient,
      address,
      votingModuleAddress,
    )
    const cw4GroupAddress = await daoVotingCw4Client.groupContract()
    const wasmMessage: CosmosMsgForEmpty[] = validActions
      .map((validAction: TProposalActionModel) => {
        try {
          const { text, data } = validAction
          switch (text) {
            // Group Category
            case 'AuthZ Exec':
              return makeAuthzExecAction(data)
            case 'AuthZ Grant / Revoke':
              return makeAuthzAuthorizationAction(data)
            case 'Change Group Membership':
              return makeManageMembersAction(data, cw4GroupAddress)
            case 'Manage Subgroups':
              return makeManageSubDaosAction(data)
            case 'Manage Storage Items':
              return makeManageStorageItemsAction(data)
            case 'Update Info':
              return makeUpdateInfoAction(data)
            case 'Update Proposal Submission Config':
              return makeUpdatePreProposeConfigAction(data)
            case 'Update Voting Config':
              return makeUpdateVotingConfigAction(data)
            case 'DAO Admin Execute':
              // TODO: TBD ?
              return makeDaoAdminExecAction(data)
            case 'Vote on a Network Proposal':
              // TODO: TBD
              return makeGovernanceVoteAction('ixo12wgrrvmx5jx2mxhu6dvnfu3greamemnqfvx84a', data)

            // Smart Contracts Category
            case 'Execute Smart Contract':
              return makeExecuteAction(data)
            case 'Initiate Smart Contract':
              return makeInstantiateAction(data)
            case 'Migrate Smart Contract':
              return makeMigrateAction(data)
            case 'Update Contract Admin':
              return makeUpdateAdminAction(data)

            // Staking
            case 'Validator Actions':
              // TODO: validatorAddress ?
              return makeValidatorActions('ixovaloper1xz54y0ktew0dcm00f9vjw0p7x29pa4j5p9rwq6zerkytugzg27qsjdevsm', data)
            case 'Staking Actions':
              return makeStakeAction(data)

            // Custom
            case 'Custom':
              return makeCustomAction(data)

            // Token
            case 'Spend':
              return makeSpendAction(data)
            case 'Burn NFT':
              return makeBurnNftAction(data)
            case 'Mint':
              // TODO:
              return makeMintAction('ixo1g647t78y2ulqlm3lss8rs3d0spzd0teuwhdvnqn92tr79yltk9dq2h24za', data)
            case 'Manage Treasury NFTs':
              return makeManageCw721Action(entityId, data)
            case 'Manage Treasury Tokens':
              return makeManageCw20Action(entityId, data)
            case 'Transfer NFT':
              return makeTransferNFTAction(data)
            case 'Withdraw Token Swap':
              return makeWithdrawTokenSwapAction(data)
            case 'Token Swap':
              return makePerformTokenSwapAction(data)
            default:
              return undefined
          }
        } catch (e) {
          console.error(e)
          return undefined
        }
      })
      .filter(Boolean) as CosmosMsgForEmpty[]

    console.log('wasmMessage', decodedMessagesString(wasmMessage))

    return await daoPreProposeSingleClient
      .propose(
        {
          msg: {
            propose: {
              description: (metadata?.description || '') + `#deed:${deedDid}`,
              msgs: wasmMessage,
              title: metadata?.name || '',
            },
          },
        },
        fee,
        undefined,
        depositInfo ? [depositInfo] : undefined,
      )
      .then((res) => {
        const { logs, transactionHash } = res
        const proposalId = Number(getValueFromEvents(logs, 'wasm', 'proposal_id') || '0')

        Toast.successToast(`Successfully published proposals`)
        return { transactionHash, proposalId }
      })
      .catch((e) => {
        console.error(e)
        Toast.errorToast(e)
        return undefined
      })
  }

  const handleCreateDeed = async (): Promise<string> => {
    const accordedRight: AccordedRight[] = []
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

    // Create Protocol for deed
    const protocolDid = await CreateProtocol()
    if (!protocolDid) {
      return ''
    }

    // Create DAO entity
    const entityDid = await CreateEntityBase(entityType, protocolDid, {
      service,
      linkedResource,
      accordedRight,
      linkedEntity,
    })
    if (!entityDid) {
      return ''
    }

    return entityDid

    // history.push({ pathname: history.location.pathname, search: `?success=true` })
  }

  const handleAddProposalInfoAsLinkedEntity = async (deedDid: string, proposalId: number): Promise<boolean> => {
    const linkedEntity: LinkedEntity = {
      type: 'deed',
      id: `{id}#${coreAddress}#${proposalId}`,
      relationship: 'proposal',
      service: 'ixo',
    }
    return !!(await AddLinkedEntity(deedDid, linkedEntity))
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    const deedDid = await handleCreateDeed()
    if (deedDid) {
      const res = await handlePropose(deedDid)
      if (res) {
        const { proposalId } = res

        if (await handleAddProposalInfoAsLinkedEntity(deedDid, proposalId)) {
          history.push({ pathname: history.location.pathname, search: `?success=true` })
          setSubmitting(false)
          return
        }
      }
    }
    history.push({ pathname: history.location.pathname, search: `?success=false` })
    setSubmitting(false)
  }

  return (
    <FlexBox width='100%' gap={10} alignItems='stretch'>
      {/* Card */}
      <FlexBox
        direction='column'
        width='100%'
        gap={4}
        p={6}
        border={`1px solid ${theme.ixoNewBlue}`}
        borderRadius='8px'
      >
        {/* Header */}
        {daoGroup?.type && (
          <FlexBox border={`1px solid ${theme.ixoDarkBlue}`} borderRadius='100px' p={1.5}>
            <Typography color='blue' size='md' transform='capitalize'>
              {daoGroup.type}
            </Typography>
          </FlexBox>
        )}

        <FlexBox>
          <Typography variant='secondary' size='2xl'>
            {metadata?.name}
          </Typography>
        </FlexBox>

        <FlexBox width='100%' gap={3.5} alignItems='center' mb={4}>
          <SvgBox svgHeight={5} color={theme.ixoDarkestBlue}>
            <WaitIcon />
          </SvgBox>
          <ProgressBar total={0} approved={0} rejected={0} height={20} />
        </FlexBox>

        <FlexBox direction='column' gap={1}>
          <Typography size='sm'>Proposed by</Typography>
          <Typography weight='bold'>{truncateString(address, 20)}</Typography>
        </FlexBox>

        <FlexBox width='100%' gap={4}>
          <FlexBox direction='column' flexBasis='50%' gap={1}>
            <Typography size='sm'>Submission Date</Typography>
            <Typography weight='bold'>{moment.utc(new Date()).format('YYYY-MM-DD [at] HH:mm [UTC]')}</Typography>
          </FlexBox>
          <FlexBox direction='column' flexBasis='50%' gap={1}>
            <Typography size='sm'>Closes</Typography>
            <Typography weight='bold'>
              {moment.utc(new Date().getTime() + votingPeriod * 1000).format('YYYY-MM-DD [at] HH:mm [UTC]')}
            </Typography>
          </FlexBox>
        </FlexBox>

        <FlexBox width='100%' gap={4}>
          <FlexBox direction='column' flexBasis='50%' gap={1}>
            <Typography size='sm'>Linked Resources</Typography>
            <FlexBox gap={3}></FlexBox>
          </FlexBox>
          <FlexBox direction='column' flexBasis='50%' gap={1}>
            <Typography size='sm'>Actions</Typography>
            <FlexBox gap={3}>
              {proposal.actions?.map((action) => {
                const Icon = ProposalActionConfig[action.group].items[action.text]?.icon
                return (
                  <SvgBox
                    key={action.id}
                    width='35px'
                    height='35px'
                    alignItems='center'
                    justifyContent='center'
                    border={`1px solid ${theme.ixoNewBlue}`}
                    borderRadius='4px'
                    svgWidth={5}
                    svgHeight={5}
                    color={theme.ixoNewBlue}
                  >
                    <Icon />
                  </SvgBox>
                )
              })}
            </FlexBox>
          </FlexBox>
        </FlexBox>
      </FlexBox>
      {/* Text */}
      <FlexBox direction='column' height='100%' justifyContent='space-between' gap={4} style={{ flex: '0 0 400px' }}>
        {!success && (
          <>
            <FlexBox direction='column' width='100%' gap={4}>
              <Typography variant='secondary'>
                This is the last step before submitting this governance proposal for {entityName}.
              </Typography>
              <Typography variant='secondary'>
                <NavLink to={`/create/entity/deed/${entityId}/${coreAddress}/action`}>
                  Review the proposal details
                </NavLink>
              </Typography>
              <Typography variant='secondary'>
                When you are ready to commit, sign with your DID Account keys.
              </Typography>
            </FlexBox>
            {/* Actions */}
            <FlexBox width='100%' gap={4}>
              <Button
                variant='secondary'
                onClick={(): void => history.push(`/create/entity/deed/${entityId}/${coreAddress}/action`)}
                style={{ width: '100%' }}
              >
                Back
              </Button>
              <Button variant='primary' onClick={handleSubmit} style={{ width: '100%' }} loading={submitting}>
                Sign To Submit
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
                {metadata?.name} Successfully created!
              </Typography>
            </FlexBox>
            <FlexBox width='100%' gap={4}>
              <Button
                variant='primary'
                onClick={() => {
                  history.push(`/entity/${entityId}/dashboard/governance`)
                  clearEntity()
                }}
                style={{ width: '100%' }}
              >
                View in the Dashboard
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
              <Button variant='primary' onClick={handleSubmit} style={{ width: '100%' }} loading={submitting}>
                Sign To Submit
              </Button>
            </FlexBox>
          </>
        )}
      </FlexBox>
    </FlexBox>
  )
}

export default ReviewProposal
