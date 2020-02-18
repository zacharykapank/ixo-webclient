import React from 'react'
import useForm from 'react-hook-form'
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import { Store } from '../../../../model/store'
import { quoteSell } from '../../../../redux/quote/quote_action_creators'
import { Quote } from '../../../../model/quote'
import { currencyStr, tokenBalance } from '../../../../model/account'

const QuoteSell = (props: any) => {
  const { register, handleSubmit, watch, errors } = useForm()
  // const { state, action } = useStateMachine(wizardUpdateAction);

  // const subscriptions: Subscription = new Subscription();

  // //initial state - react state
  // const [data, setData] = useState({
  //     eduBalance: 0,
  //     firstStepData: {},
  //     secondStepData: {
  //         balance: 0
  //     }
  // });

  // useEffect(() => {
  //     //mount functional component

  //     console.log('~~~~~> ' + JSON.stringify(state));

  //     subscriptions.add(props.buyData.tokenObservable.subscribe({
  //         next: (result: any) => {
  //             setData({ ...data, eduBalance: result ? parseInt(result) : 0 });
  //             // state.data.eduBalance = result ? parseInt(result) : 0;
  //             // console.log( '##### ' + JSON.stringify( state.data ) );
  //         },
  //         complete: () => console.log('done fetching edu token balance')
  //     }));

  //     return () => {
  //         //unmount functional component
  //         subscriptions.unsubscribe();
  //     }
  // }, []);

  const onSubmit = (formData: any) => {
    const quote: Quote = {}
    quote.recieving = { denom: formData.denom }
    quote.sending = { amount: formData.amount, denom: props.activeBond.symbol }
    quote.minPrices = [{ denom: formData.denom, amount: formData.minAmount }]
    props.dispatch(quoteSell(quote))
  }

  if (props.quotePending) {
    return <div>Loading quote...</div>
  } else {
    watch()
    const payDenom = watch('denom') || 'res'
    const payOptions: [string] = props.account.balances.map(
      (balance: { denom: string }) => balance.denom,
    )

    const curBal = currencyStr(tokenBalance(props, props.activeBond.symbol))
    const recBal = currencyStr(tokenBalance(props, payDenom))

    return (
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="label">
          Number of <b>{props.activeBond.symbol}</b> tokens to sell
        </div>
        <input
          name="amount"
          placeholder={
            'Enter the quantity of ' +
            props.activeBond.symbol +
            " tokens you're selling."
          }
          ref={register({ required: true, pattern: /^[0-9]+$/i })}
        />
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
          }}
        >
          <span style={{ marginTop: '-0.5em', padding: '0' }}>
            {errors.amount && (
              <span className="error">This field requires a number value</span>
            )}
          </span>
          <div className="label_subtitle">
            My current balance is{' '}
            <span className="label_subtitle__bold">{curBal}</span>
          </div>
        </div>

        <img
          src={require('../../../../assets/img/arrow-down.png')}
          width={10}
          style={{ display: 'block', margin: '0 auto' }}
        />

        {/* the unit of the price will be the one which is selected in the dropdown - so it will be measured in IXO if IXO is selected
                for example entering number 5 would mean to buy tokenamount of the first input field with 5 IXO per token
                Insufficient balance should show an error - which says balance is to low */}
        <div className="label">
          Minimum price per <b>{props.activeBond.symbol}</b> token
        </div>
        <div className="currencyInput">
          <select name="denom" ref={register({ required: true })}>
            {payOptions.map(option => (
              <option key={option} value={option}>
                {option.toUpperCase()}
              </option>
            ))}
          </select>
          <input
            name="minAmount"
            placeholder="Enter the lowest offer you will accept"
            ref={register({ required: true, pattern: /^[0-9]+$/i })}
          />
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
          }}
        >
          <span style={{ marginTop: '-0.5em', padding: '0' }}>
            {errors.minAmount && (
              <span className="error">This field requires a number value</span>
            )}
          </span>
          <span className="label_subtitle">
            My current balance is{' '}
            <span className="label_subtitle__bold">{recBal}</span>
          </span>

          <span className="label_subtitle">
            I will have an opportunity to confirm this value
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
          }}
        >
          <span style={{ marginTop: '-0.5em', padding: '0' }}></span>
          <input
            type="submit"
            value="get quote"
            className="button button_buy button_buy_quote"
          />
        </div>
      </form>
    )
  }
}

const mapStateToProps = function(state: Store) {
  return state
}

export default connect(mapStateToProps)(withRouter(QuoteSell))
