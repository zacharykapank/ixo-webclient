import Axios from 'axios'
import BigNumber from 'bignumber.js'
import { getBalanceNumber } from 'common/utils/currency.utils'
import { Dispatch } from 'redux'
import {
  ChangeTradeMethodAction,
  EntityExchangeActions,
  GetValidatorsAction,
} from './types'

export const changeTradeMethod = (
  tradeMethod: string,
): ChangeTradeMethodAction => ({
  type: EntityExchangeActions.ChangeTradeMethod,
  payload: {
    tradeMethod,
  },
})

export const getValidators = (accountAddress: string) => (
  dispatch: Dispatch,
): GetValidatorsAction => {
  return dispatch({
    type: EntityExchangeActions.GetValidators,
    payload: Axios.get(
      `${process.env.REACT_APP_GAIA_URL}/rest/staking/validators`,
    )
      .then((response) => response.data)
      .then(({ result }) => {
        return result.map((validator) => {
          const identity = validator.description.identity
          const address = validator.operator_address
          const name = validator.description.moniker
          const website = validator.description.website
          const commission = validator.commission.commission_rates.rate
          const votingPower = validator.tokens
          const mission = validator.description.details ?? ''

          if (identity) {
            Axios.get(
              `https://keybase.io/_/api/1.0/user/lookup.json?key_suffix=${identity}&fields=pictures`,
            )
              .then((response) => response.data)
              .then((response) => response.them[0])
              .then((response) => response.pictures)
              .then((response) => response.primary)
              .then((response) => response.url)
              .then((response) => {
                return dispatch({
                  type: EntityExchangeActions.GetValidatorLogo,
                  payload: {
                    address,
                    logo: response,
                  },
                })
              })
              .catch(() => {
                return dispatch({
                  type: EntityExchangeActions.GetValidatorLogo,
                  payload: {
                    address,
                    logo: require('assets/img/relayer.png'),
                  },
                })
              })
          }

          Axios.get(
            `${process.env.REACT_APP_GAIA_URL}/cosmos/staking/v1beta1/validators/${address}/delegations/${accountAddress}`,
          )
            .then((response) => response.data)
            .then((response) => response.delegation_response)
            .then((response) => response.balance)
            .then(({ amount, denom }) => {
              return dispatch({
                type: EntityExchangeActions.GetValidatorDelegation,
                payload: {
                  address,
                  delegation: {
                    amount:
                      denom !== 'uixo'
                        ? amount
                        : getBalanceNumber(new BigNumber(amount)),
                    denom: denom !== 'uixo' ? denom : 'ixo',
                  },
                },
              })
            })
            .catch((error) => {
              console.log(error)
            })

          Axios.get(
            `${process.env.REACT_APP_GAIA_URL}/cosmos/distribution/v1beta1/delegators/${accountAddress}/rewards/${address}`,
          )
            .then((response) => response.data)
            .then(({ rewards }) => {
              const { amount, denom } = rewards[0]
              return dispatch({
                type: EntityExchangeActions.GetValidatorReward,
                payload: {
                  address,
                  reward: {
                    amount:
                      denom !== 'uixo'
                        ? amount
                        : getBalanceNumber(new BigNumber(amount)),
                    denom: denom !== 'uixo' ? denom : 'ixo',
                  },
                },
              })
            })
            .catch((err) => {
              console.log(err)
            })

          return {
            address,
            name,
            website,
            commission,
            logo: require('assets/img/relayer.png'),
            delegation: null,
            reward: null,
            votingPower,
            mission,
          }
        })
      }),
  })
}
