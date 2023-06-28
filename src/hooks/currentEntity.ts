import { EntityAccount } from '@ixo/impactxclient-sdk/types/codegen/ixo/entity/v1beta1/entity'
import {
  IidMetadata,
  LinkedEntity,
  LinkedResource,
  Service,
} from '@ixo/impactxclient-sdk/types/codegen/ixo/iid/v1beta1/types'
import { TEntityModel } from 'api/blocksync/types/entities'
import { updateEntityAction, updateEntityResourceAction } from 'redux/currentEntity/currentEntity.actions'
import {
  selectEntityLinkedResource,
  selectEntityProfile,
  selectEntityCreator,
  selectEntityType,
  selectEntityAdministrator,
  selectEntityPage,
  selectEntityTags,
  selectEntityLinkedEntity,
  selectEntityMetadata,
  selectEntityId,
  selectEntityAccounts,
  selectEntityOwner,
  selectEntityService,
} from 'redux/currentEntity/currentEntity.selectors'
import { useAppDispatch, useAppSelector } from 'redux/hooks'
import { BlockSyncService } from 'services/blocksync'
import {
  TEntityAdministratorModel,
  TEntityCreatorModel,
  TEntityDDOTagModel,
  TEntityPageSectionModel,
  TEntityProfileModel,
} from 'types/protocol'
import { apiEntityToEntity } from 'utils/entities'
import { useAccount } from './account'
import useCurrentDao from './currentDao'

const bsService = new BlockSyncService()

export default function useCurrentEntity(): {
  entityType: string
  linkedResource: LinkedResource[]
  linkedEntity: LinkedEntity[]
  profile: TEntityProfileModel
  creator: TEntityCreatorModel
  administrator: TEntityAdministratorModel
  page: TEntityPageSectionModel[]
  tags: TEntityDDOTagModel[]
  metadata: IidMetadata | undefined
  accounts: EntityAccount[]
  owner: string
  service: Service[]
  getEntityByDid: (did: string) => Promise<void>
} {
  const dispatch = useAppDispatch()
  const { cwClient } = useAccount()
  const { clearDaoGroup } = useCurrentDao()
  const entitites: { [id: string]: TEntityModel } = useAppSelector((state) => state.entities.entities2)
  const id: string = useAppSelector(selectEntityId)!
  const entityType: string = useAppSelector(selectEntityType)!
  const linkedResource: LinkedResource[] = useAppSelector(selectEntityLinkedResource)
  const linkedEntity: LinkedEntity[] = useAppSelector(selectEntityLinkedEntity)!
  const profile: TEntityProfileModel = useAppSelector(selectEntityProfile)!
  const creator: TEntityCreatorModel = useAppSelector(selectEntityCreator)!
  const administrator: TEntityAdministratorModel = useAppSelector(selectEntityAdministrator)!
  const page: TEntityPageSectionModel[] = useAppSelector(selectEntityPage)!
  const tags: TEntityDDOTagModel[] = useAppSelector(selectEntityTags)!
  const metadata: IidMetadata | undefined = useAppSelector(selectEntityMetadata)
  const accounts: EntityAccount[] = useAppSelector(selectEntityAccounts)
  const owner: string = useAppSelector(selectEntityOwner)
  const service: Service[] = useAppSelector(selectEntityService)

  const updateEntity = (data: TEntityModel) => {
    if (id !== data.id) {
      clearDaoGroup()
    }
    dispatch(updateEntityAction(data))
  }

  const updateEntityResource = ({ key, data, merge }: { key: string; data: any; merge: boolean }) => {
    dispatch(updateEntityResourceAction({ key, data, merge }))
  }

  const getEntityByDid = (did: string): Promise<void> => {
    /**
     * find entity in entities state and avoid refetch from api
     */
    if (entitites && entitites[did]) {
      updateEntity(entitites[did])
    }
    return bsService.entity.getEntityById(did).then((entity: any) => {
      apiEntityToEntity({ entity, cwClient }, (key, data, merge = false) => {
        updateEntityResource({ key, data, merge })
      })

      updateEntity(entity)
    })
  }

  return {
    entityType,
    linkedResource,
    linkedEntity,
    profile,
    creator,
    administrator,
    page,
    tags,
    metadata,
    accounts,
    owner,
    service,
    getEntityByDid,
  }
}

export function useCurrentEntityMetadata(): {
  createdAt: Date | undefined
} {
  const { metadata } = useCurrentEntity()
  const createdAt = metadata?.created && new Date(metadata.created as never as string)

  return { createdAt }
}

export function useCurrentEntityProfile(): Omit<TEntityProfileModel, '@context' | 'id'> {
  const { profile } = useCurrentEntity()
  const name = profile?.name ?? ''
  const image = profile?.image ?? ''
  const logo = profile?.logo ?? ''
  const brand = profile?.brand ?? ''
  const location = profile?.location ?? ''
  const description = profile?.description ?? ''
  const attributes = profile?.attributes ?? []
  const metrics = profile?.metrics ?? []

  return { name, image, logo, brand, location, description, attributes, metrics }
}

export function useCurrentEntityCreator(): Omit<TEntityCreatorModel, '@type'> {
  const { creator } = useCurrentEntity()
  const id = creator?.id ?? ''
  const logo = creator?.logo ?? ''
  const displayName = creator?.displayName ?? ''
  const email = creator?.email ?? ''
  const location = creator?.location ?? ''
  const website = creator?.website ?? ''
  const mission = creator?.mission ?? ''

  return { id, logo, displayName, email, location, website, mission }
}

export function useCurrentEntityTags(): {
  sdgs: string[]
} {
  const { tags } = useCurrentEntity()
  const sdgs = tags?.find(({ category }) => category === 'SDG')?.tags ?? []

  return { sdgs }
}

export function useCurrentEntityLinkedEntity(): {
  bondDid: string
  linkedProposal?: LinkedEntity
} {
  const bondDid = ''

  return { bondDid }
}

export function useCurrentEntityAdminAccount(): string {
  const { accounts } = useCurrentEntity()
  return accounts.find((account) => account.name === 'admin')?.address || ''
}

export function useCurrentEntityLinkedFiles(): LinkedResource[] {
  const { linkedResource } = useCurrentEntity()

  return linkedResource.filter((item: LinkedResource) => item.type === 'document')
}
