import React, { Component, Suspense, lazy } from 'react';
import { Switch, Route, Redirect } from 'react-router-dom';

import Spinner from '../app/shared/Spinner';
import CreateAirdrop from './page/CreateAirdrop';
import ListAirdrops from './page/ListAirdrops';
import ViewDetail from './page/ViewDetail';

const Dashboard = lazy(() => import('./dashboard/Dashboard'));
const CreateLaunch = lazy(() => import('./launchpads/CreateLaunch'));
const ListLaunch = lazy(() => import('./launchpads/ListLaunch'));

const Buttons = lazy(() => import('./basic-ui/Buttons'));
const Dropdowns = lazy(() => import('./basic-ui/Dropdowns'));
const Typography = lazy(() => import('./basic-ui/Typography'));

const BasicElements = lazy(() => import('./form-elements/BasicElements'));

const BasicTable = lazy(() => import('./tables/BasicTable'));

const Mdi = lazy(() => import('./icons/Mdi'));

const ChartJs = lazy(() => import('./charts/ChartJs'));

const Error404 = lazy(() => import('./error-pages/Error404'));
const Error500 = lazy(() => import('./error-pages/Error500'));

const Login = lazy(() => import('./user-pages/Login'));
const Register1 = lazy(() => import('./user-pages/Register'));
const CreateLock = lazy(() => import('./form-elements/CreateLock'));
const Token = lazy(() => import('./form-elements/Token'));

class AppRoutes extends Component {
  render() {
    return (
      <Suspense fallback={<Spinner />}>
        <Switch>
          <Route exact path="/dashboard" component={Dashboard} />
          <Route exact path="/launchpads/create-launch" component={CreateLaunch} />
          <Route exact path="/launchpads/list-launch" component={ListLaunch} />

          <Route path="/basic-ui/buttons" component={Buttons} />
          <Route path="/basic-ui/dropdowns" component={Dropdowns} />
          <Route path="/basic-ui/typography" component={Typography} />

          <Route path="/form-Elements/basic-elements" component={BasicElements} />
          <Route path="/form-elements/create-lock" component={ CreateLock } />
          <Route path="/form-elements/token" component={ Token } />

          <Route path="/airdop/create" component={ CreateAirdrop } />
          <Route path="/airdop/list" component={ ListAirdrops } />
          <Route path="/airdop/details/:id" component={ ViewDetail } />
          <Route path="/icons/mdi" component={ Mdi } />

          <Route path="/charts/chart-js" component={ChartJs} />


          <Route path="/user-pages/login-1" component={Login} />
          <Route path="/user-pages/register-1" component={Register1} />

          <Route path="/error-pages/error-404" component={Error404} />
          <Route path="/error-pages/error-500" component={Error500} />


          <Redirect to="/dashboard" />
        </Switch>
      </Suspense>
    );
  }
}

export default AppRoutes;