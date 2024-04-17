import { LinkedResource } from '@ixo/impactxclient-sdk/types/codegen/ixo/iid/v1beta1/types'
import { EntityLinkedResourceConfig } from 'constants/entity'
import { useParams } from 'react-router-dom'
import { selectEntityById } from 'redux/entitiesExplorer/entitiesExplorer.selectors'
import { useAppSelector } from 'redux/hooks'
import { LinkedFiles } from '../Overview/LinkedFiles'
import { PageContent } from '../Overview/PageContent'
import { InstructionsToExecute } from './InstructionsToExecute'
import { Flex, ScrollArea } from '@mantine/core'
import ControlPanel from 'components/ControlPanel'
import HeaderTabs from 'components/HeaderTabs/HeaderTabs'
import { MatchType } from 'types/models'
import { useMemo } from 'react'

const Overview: React.FC = () => {
  const { entityId = '', deedId = '' } = useParams<{ entityId: string; deedId: string }>()
  const entity = useAppSelector(selectEntityById(deedId))

  const headerTabs = useMemo(
    () => [
      {
        iconClass: `icon-info`,
        path: ``,
        title: 'Deed',
        tooltip: `Deed Overview`,
      },
      {
        iconClass: `icon-dashboard`,
        path: `/entity/${entityId}/dashboard`,
        title: 'DASHBOARD',
        tooltip: `DAO Management`,
      },
    ],
    [entityId],
  )

  return (
    <Flex w='100%' h='100%' bg='#F8F9FD'>
      <ScrollArea w='100%'>
        <Flex w='100%' direction='column' p={80} style={{ flex: 1 }}>
          <HeaderTabs matchType={MatchType.strict} buttons={headerTabs} />
          <PageContent page={entity?.page ?? []} />
          <InstructionsToExecute />
          <LinkedFiles
            linkedFiles={
              entity?.linkedResource.filter((item: LinkedResource) =>
                Object.keys(EntityLinkedResourceConfig).includes(item.type),
              ) ?? []
            }
          />
        </Flex>
      </ScrollArea>
      <Flex h='100%' bg='#F0F3F9'>
        <ControlPanel entityType={entity?.type ?? ''} entityName={entity?.profile?.name ?? ''} />
      </Flex>
    </Flex>
  )
}

export default Overview
