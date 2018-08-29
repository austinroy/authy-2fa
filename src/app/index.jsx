import React from 'react';
import {render} from 'react-dom';

import './../scss/main.scss';

import User from './components/User.jsx';
import LogIn from './components/Login.jsx';
import SignUp from './components/SignUp.jsx';
import { 
  BrowserRouter,
  Switch,
  Route, 
  Redirect
} from 'react-router-dom';

class App extends React.Component {
  render () {
    return (
      <div className="home">
        <BrowserRouter>
          <Switch >
            <Route exact path="/" component={User} />
            <Route exact path="/login" component={LogIn} />
            <Route exact path="/signup" component={SignUp} />
          </Switch>      
        </BrowserRouter>
      </div>
    );
  }
}

render(<App />, document.getElementById('app'));