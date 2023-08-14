import 'slick-carousel/slick/slick.css'
import 'slick-carousel/slick/slick-theme.css'
import 'react-dates/lib/css/_datepicker.css'
import 'assets/icons.css'
import 'assets/toasts.scss'

import blocksyncApi from 'api/blocksync/blocksync'
import AssistantContext from 'contexts/assistant'
import { AnyObject } from 'immer/dist/internal'
import { changeEntitiesType, getAllEntities, getEntityConfig } from 'redux/entitiesExplorer/entitiesExplorer.actions'
import { EntityType, EntityConfig } from 'types/entities'
import React from 'react'
import * as ReactGA from 'react-ga'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import Services from 'services'
import { ThemeProvider } from 'styled-components'
import Footer from '../Footer/FooterContainer'
import { HeaderConnected } from '../Header/HeaderContainer'
import ScrollToTop from '../ScrollToTop/ScrollToTop'
import { Spinner } from '../Spinner/Spinner'
import { RootState } from 'redux/store'
import { Routes } from 'routes'
import { toggleAssistant } from 'redux/account/account.actions'
import { UserInfo } from 'redux/account/account.types'
import { Container, ContentWrapper, theme } from './App.styles'
import { WalletManagerProvider, WalletType } from '@gssuper/cosmodal'
import { CosmWasmClient } from '@ixo/impactxclient-sdk/node_modules/@cosmjs/cosmwasm-stargate'
import { getCustomTheme } from 'redux/theme/theme.actions'
// For Sentry performance profiling
// import { withProfiler } from '@sentry/react'

const CHAIN_ID = process.env.REACT_APP_CHAIN_ID!
const LOCAL_STORAGE_KEY = 'ixo-webclient/connectedWalletId'

ReactGA.initialize('UA-106630107-5')
ReactGA.pageview(window.location.pathname + window.location.search)

export interface State {
  loginError: string
  error: any
  errorInfo: any
  customizedTheme: AnyObject
}

export interface Props {
  pingError?: string
  pingResult?: string
  userInfo: UserInfo
  location: any
  history: any
  match: any
  entityTypeMap: EntityConfig
  cwClient: CosmWasmClient
  onIxoInit: () => void
  onKeysafeInit: () => void
  onWeb3Connect: () => void
  loginStatusCheckCompleted: boolean
  assistantToggled: boolean
  toggleAssistant: () => void
  handleGetEntityConfig: () => void
  handleChangeEntitiesType: (type: EntityType) => void
  handleGetAllEntities: () => void
  handleGetCustomTheme: () => void
}

class App extends React.Component<Props, State> {
  state: any = {
    loginError: null,
    isProjectPage: false,
    errorInfo: null,
    error: null,
    customizedTheme: theme,
  }

  private keySafeInterval: any = null

  componentDidMount(): void {
    this.props.handleGetEntityConfig()
    this.props.handleGetCustomTheme()
  }
  UNSAFE_componentWillReceiveProps(props: any): void {
    if (props.entityTypeMap !== this.props.entityTypeMap) {
      let newEntityType = EntityType.Project
      const { UI } = props.entityTypeMap
      if (UI) {
        const { explorer } = UI
        if (explorer) {
          const { defaultView } = explorer
          if (defaultView) {
            newEntityType = defaultView
          }
        }
      }
      this.props.handleChangeEntitiesType(newEntityType)

      // apply custom theme
      const { theme: myTheme } = props.entityTypeMap
      if (myTheme) {
        let customizedTheme = this.state.customizedTheme
        const { fontFamily, primaryColor, highlight } = myTheme
        if (fontFamily) {
          customizedTheme = {
            ...customizedTheme,
            primaryFontFamily: fontFamily,
          }
        }
        if (primaryColor) {
          customizedTheme = {
            ...customizedTheme,
            ixoBlue: primaryColor,
            ixoNewBlue: primaryColor,
          }
        }
        if (highlight) {
          customizedTheme = {
            ...customizedTheme,
            highlight,
            pending: highlight.light,
          }
        }
        customizedTheme = {
          ...customizedTheme,
          ...props.customTheme,
        }
        this.setState({ customizedTheme })
      } else {
        this.setState((prevState) => ({ customizedTheme: { ...prevState.customizedTheme, ...props.customTheme } }))
      }
    }
    if (props.cwClient !== this.props.cwClient && props.cwClient) {
      this.props.handleGetAllEntities()
    }
  }

  componentWillUnmount(): void {
    clearInterval(this.keySafeInterval)
  }

  handlePingExplorer = (): Promise<any> => {
    return new Promise((resolve, reject) => {
      const t0 = performance.now()
      blocksyncApi.network
        .pingIxoExplorer()
        .then((result) => {
          if (result === 'API is running') {
            const t1 = performance.now()
            resolve(Math.trunc(t1 - t0))
          } else {
            reject(0)
          }
        })
        .catch(() => {
          reject(0)
        })
    })
  }

  render(): JSX.Element {
    const { assistantToggled } = this.props
    // let assistantBaseStyles: any = {
    //   background: '#F0F3F9',
    //   zIndex: 8,
    // }

    // if (assistantFixed || isMobile) {
    //   assistantBaseStyles = {
    //     ...assistantBaseStyles,
    //     position: 'fixed',
    //     right: 0,
    //   }
    // }

    return (
      <ThemeProvider theme={this.state.customizedTheme}>
        <WalletManagerProvider
          defaultChainId={CHAIN_ID}
          enabledWalletTypes={[
            WalletType.Keplr,
            // WalletType.WalletConnect
          ]}
          localStorageKey={LOCAL_STORAGE_KEY}
          walletConnectClientMeta={{
            // TODO:
            name: 'CosmodalExampleDAPP',
            description: 'A dapp using the cosmodal library.',
            url: 'https://cosmodal.example.app',
            icons: ['https://cosmodal.example.app/walletconnect.png'],
          }}
          defaultUiConfig={{
            classNames: {
              modalContent: 'cosmodal-content',
              modalOverlay: 'cosmodal-overlay',
              modalHeader: 'cosmodal-header',
              modalSubheader: 'cosmodal-subheader',
              modalCloseButton: 'cosmodal-close-button',
              walletList: 'cosmodal-wallet-list',
              wallet: 'cosmodal-wallet',
              walletImage: 'cosmodal-wallet-image',
              walletInfo: 'cosmodal-wallet-info',
              walletName: 'cosmodal-wallet-name',
              walletDescription: 'cosmodal-wallet-description',
              textContent: 'cosmodal-text-content',
            },
          }}
        >
          <AssistantContext.Provider value={{ active: assistantToggled }}>
            <ToastContainer theme='dark' hideProgressBar={true} position='top-right' />
            <Services />
            {this.props.entityTypeMap && this.props.cwClient && (
              <ScrollToTop>
                <Container>
                  <HeaderConnected />
                  <div className='d-flex' style={{ flex: 1 }}>
                    <ContentWrapper>
                      {this.props.loginStatusCheckCompleted ? <Routes /> : <Spinner info={'Loading ixo.world...'} />}
                    </ContentWrapper>
                  </div>
                  <Footer />
                </Container>
              </ScrollToTop>
            )}
          </AssistantContext.Provider>
        </WalletManagerProvider>
      </ThemeProvider>
    )
  }
}

const mapStateToProps = (state: RootState): Record<string, any> => ({
  userInfo: state.account.userInfo,
  cwClient: state.account.cwClient,
  assistantToggled: state.account.assistantToggled,
  loginStatusCheckCompleted: state.account.loginStatusCheckCompleted,
  entityTypeMap: state.entities.entityConfig,
  customTheme: state.customTheme,
})

const mapDispatchToProps = (dispatch: any): any => ({
  toggleAssistant: (): void => {
    dispatch(toggleAssistant())
  },
  handleGetEntityConfig: (): void => dispatch(getEntityConfig()),
  handleGetCustomTheme: (): void => dispatch(getCustomTheme()),
  handleChangeEntitiesType: (type: EntityType): void => dispatch(changeEntitiesType(type)),
  handleGetAllEntities: (): void => dispatch(getAllEntities()),
})

export const AppConnected = withRouter(connect(mapStateToProps, mapDispatchToProps)(App as any) as any)

// For Sentry performance profiling
// export const AppConnected = withProfiler(withRouter(connect(mapStateToProps, mapDispatchToProps)(App as any) as any))
