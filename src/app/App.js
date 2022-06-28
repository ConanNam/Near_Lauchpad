import React, { useEffect } from 'react';
import { withRouter } from 'react-router-dom';
import { AirdropProvider } from '../context/AirdropContext'
import './App.scss';
import AppRoutes from './AppRoutes';
import Navbar from './shared/Navbar';
import Sidebar from './shared/Sidebar';
import Footer from './shared/Footer';
import { withTranslation } from "react-i18next";
import getConfig from './config'
import "react-datepicker/dist/react-datepicker.css";
import { login, logout } from './utils'
import "react-datepicker/dist/react-datepicker.css";

const { networkId } = getConfig(process.env.NODE_ENV || 'development')

const App = (props) => {
  // use React Hooks to store greeting in component state
  const [greeting, set_greeting] = React.useState()
  const [isFullPageLayout, setIsFullPageLayout] = React.useState()

  // when the user has not yet interacted with the form, disable the button
  const [buttonDisabled, setButtonDisabled] = React.useState(true)

  // after submitting the form, we want to show Notification
  const [showNotification, setShowNotification] = React.useState(false)

  // The useEffect hook can be used to fire side-effects during render
  // Learn more: https://reactjs.org/docs/hooks-intro.html
  console.log('window.walletConnection', window.walletConnection)
  React.useEffect(
    () => {
      // in this case, we only care to query the contract when signed in
      if (window.walletConnection.isSignedIn()) {

        // window.contract is set by initContract in index.js
        window.contract.get_greeting({ account_id: window.accountId })
          .then(greetingFromContract => {
            set_greeting(greetingFromContract)
          })
      }
    },

    // The second argument to useEffect tells React when to re-run the effect
    // Use an empty array to specify "only run on first render"
    // This works because signing into NEAR Wallet reloads the page
    []
  )

  useEffect(() => {
    // onRouteChanged()
  }, [])

  const onRouteChanged = () => {
    console.log("ROUTE CHANGED");
    const { i18n } = props;
    const body = document.querySelector('body');
    if (props.location.pathname === '/layout/RtlLayout') {
      body.classList.add('rtl');
      i18n.changeLanguage('ar');
    }
    else {
      body.classList.remove('rtl')
      i18n.changeLanguage('en');
    }
    window.scrollTo(0, 0);
    const fullPageLayoutRoutes = ['/user-pages/login-1', '/user-pages/login-2', '/user-pages/register-1', '/user-pages/register-2', '/user-pages/lockscreen', '/error-pages/error-404', '/error-pages/error-500', '/general-pages/landing-page'];
    for (let i = 0; i < fullPageLayoutRoutes.length; i++) {
      if (props.location.pathname === fullPageLayoutRoutes[i]) {
        setIsFullPageLayout(true)
        document.querySelector('.page-body-wrapper').classList.add('full-page-wrapper');
        break;
      } else {
        setIsFullPageLayout(false)
        document.querySelector('.page-body-wrapper').classList.remove('full-page-wrapper');
      }
    }
  }

  let navbarComponent = !isFullPageLayout ? <Navbar /> : '';
  let sidebarComponent = !isFullPageLayout ? <Sidebar /> : '';
  let footerComponent = !isFullPageLayout ? <Footer /> : '';

  return (
    <div className="container-scroller">
      {sidebarComponent}
      <div className="container-fluid page-body-wrapper">
        {navbarComponent}
        <div className="main-panel">
          <div className="content-wrapper">
            <AirdropProvider>
              <AppRoutes />
            </AirdropProvider>
          </div>
          {footerComponent}
        </div>
      </div>
    </div>
  )
}

// this component gets rendered by App after the form is submitted
function Notification() {
  const urlPrefix = `https://explorer.${networkId}.near.org/accounts`
  return (
    <aside>
      <a target="_blank" rel="noreferrer" href={`${urlPrefix}/${window.accountId}`}>
        {window.accountId}
      </a>
      {' '/* React trims whitespace around tags; insert literal space character when needed */}
      called method: 'set_greeting' in contract:
      {' '}
      <a target="_blank" rel="noreferrer" href={`${urlPrefix}/${window.contract.contractId}`}>
        {window.contract.contractId}
      </a>
      <footer>
        <div>✔ Succeeded</div>
        <div>Just now</div>
      </footer>
    </aside>
  )
}

export default withTranslation()(withRouter(App));
