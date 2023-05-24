import { EntityAccount } from '@ixo/impactxclient-sdk/types/codegen/ixo/entity/v1beta1/entity'
import {
  IidMetadata,
  LinkedEntity,
  LinkedResource,
  Service,
} from '@ixo/impactxclient-sdk/types/codegen/ixo/iid/v1beta1/types'
import { TEntityModel } from 'api/blocksync/types/entities'
import {
  updateEntityAction,
  updateEntityAdministratorAction,
  updateEntityCreatorAction,
  updateEntityPageAction,
  updateEntityProfileAction,
  updateEntityTagsAction,
} from 'redux/currentEntity/currentEntity.actions'
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
} from 'redux/currentEntity/currentEntity.selectors'
import { useAppDispatch, useAppSelector } from 'redux/hooks'
import { BlockSyncService } from 'services/blocksync'
import { NodeType } from 'types/entities'
import {
  TEntityAdministratorModel,
  TEntityCreatorModel,
  TEntityDDOTagModel,
  TEntityPageSectionModel,
  TEntityProfileModel,
} from 'types/protocol'
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
  updateEntity: (data: TEntityModel) => void
  updateEntityProfile: (profile: TEntityProfileModel) => void
  updateEntityCreator: (creator: TEntityCreatorModel) => void
  updateEntityAdministrator: (administrator: TEntityAdministratorModel) => void
  updateEntityPage: (page: TEntityPageSectionModel[]) => void
  updateEntityTags: (tags: TEntityDDOTagModel[]) => void
  getEntityByDid: (did: string) => Promise<boolean>
} {
  const dispatch = useAppDispatch()
  const { clearDaoGroup } = useCurrentDao()
  const entitites: { [id: string]: TEntityModel } = useAppSelector((state) => state.entities.entities2)
  const id: string = useAppSelector(selectEntityId)!
  const entityType: string = useAppSelector(selectEntityType)!
  const linkedResource: LinkedResource[] = useAppSelector(selectEntityLinkedResource)!
  const linkedEntity: LinkedEntity[] = useAppSelector(selectEntityLinkedEntity)!
  const profile: TEntityProfileModel = useAppSelector(selectEntityProfile)!
  const creator: TEntityCreatorModel = useAppSelector(selectEntityCreator)!
  const administrator: TEntityAdministratorModel = useAppSelector(selectEntityAdministrator)!
  const page: TEntityPageSectionModel[] = useAppSelector(selectEntityPage)!
  const tags: TEntityDDOTagModel[] = useAppSelector(selectEntityTags)!
  const metadata: IidMetadata | undefined = useAppSelector(selectEntityMetadata)
  const accounts: EntityAccount[] = useAppSelector(selectEntityAccounts)

  const updateEntity = (data: TEntityModel) => {
    if (id !== data.id) {
      clearDaoGroup()
    }
    dispatch(updateEntityAction(data))
  }

  const updateEntityProfile = (profile: TEntityProfileModel) => {
    dispatch(updateEntityProfileAction(profile))
  }
  const updateEntityCreator = (creator: TEntityCreatorModel) => {
    dispatch(updateEntityCreatorAction(creator))
  }
  const updateEntityAdministrator = (administrator: TEntityAdministratorModel) => {
    dispatch(updateEntityAdministratorAction(administrator))
  }
  const updateEntityPage = (page: TEntityPageSectionModel[]) => {
    dispatch(updateEntityPageAction(page))
  }
  const updateEntityTags = (tags: TEntityDDOTagModel[]) => {
    dispatch(updateEntityTagsAction(tags))
  }

  const getEntityByDid = async (did: string): Promise<boolean> => {
    /**
     * find entity in entities state and avoid refetch from api
     */
    if (entitites && entitites[did]) {
      updateEntity(entitites[did])
      return true
    }
    return await bsService.entity.getEntityById(did).then((entity: any) => {
      const { service, settings, linkedResource } = entity
      linkedResource.concat(Object.values(settings)).forEach((item: LinkedResource) => {
        let url = ''
        const [identifier, key] = item.serviceEndpoint.split(':')
        const usedService: Service | undefined = service.find((item: any) => item.id === `{id}#${identifier}`)

        if (usedService && usedService.type.toLowerCase() === NodeType.Ipfs.toLowerCase()) {
          url = `https://${key}.ipfs.w3s.link`
        } else if (usedService && usedService.type.toLowerCase() === NodeType.CellNode.toLowerCase()) {
          url = `${usedService.serviceEndpoint}${key}`
        }

        if (item.proof && url) {
          switch (item.id) {
            case '{id}#profile': {
              fetch(url)
                .then((response) => response.json())
                .then((response) => {
                  const context = response['@context']
                  let image: string = response.image
                  let logo: string = response.logo

                  if (!image.startsWith('http')) {
                    const [identifier] = image.split(':')
                    let endpoint = ''
                    context.forEach((item: any) => {
                      if (typeof item === 'object' && identifier in item) {
                        endpoint = item[identifier]
                      }
                    })
                    image = image.replace(identifier + ':', endpoint)
                  }
                  if (!logo.startsWith('http')) {
                    const [identifier] = logo.split(':')
                    let endpoint = ''
                    context.forEach((item: any) => {
                      if (typeof item === 'object' && identifier in item) {
                        endpoint = item[identifier]
                      }
                    })
                    logo = logo.replace(identifier + ':', endpoint)
                  }
                  return { ...response, image, logo }
                })
                .then((profile) => {
                  updateEntityProfile(profile)
                })
                .catch(() => undefined)
              break
            }
            case '{id}#creator': {
              fetch(url)
                .then((response) => response.json())
                .then((response) => response.credentialSubject)
                .then((creator) => {
                  updateEntityCreator(creator)
                })
                .catch(() => undefined)
              break
            }
            case '{id}#administrator': {
              fetch(url)
                .then((response) => response.json())
                .then((response) => response.credentialSubject)
                .then((administrator) => {
                  updateEntityAdministrator(administrator)
                })
                .catch(() => undefined)
              break
            }
            case '{id}#page': {
              fetch(url)
                .then((response) => response.json())
                .then((response) => response.page)
                .then((page) => {
                  updateEntityPage(page)
                })
                .catch(() => undefined)
              break
            }
            case '{id}#tags': {
              fetch(url)
                .then((response) => response.json())
                .then((response) => response.entityTags)
                .then((tags) => {
                  updateEntityTags(tags)
                })
                .catch(() => undefined)
              break
            }
            default:
              break
          }
        }
      })

      updateEntity(entity)
      return true
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
    getEntityByDid,
    updateEntity,
    updateEntityProfile,
    updateEntityCreator,
    updateEntityAdministrator,
    updateEntityPage,
    updateEntityTags,
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
  const { linkedEntity } = useCurrentEntity()
  const bondDid = ''
  const linkedProposal = linkedEntity.find(({ type }) => type === 'deed')

  return { bondDid, linkedProposal }
}

export function useCurrentEntityAdminAccount(): string {
  const { accounts } = useCurrentEntity()
  return accounts.find((account) => account.name === 'admin')?.address || ''
}
