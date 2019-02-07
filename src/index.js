import React from 'react';
import ReactDOM from 'react-dom';
import { HashRouter } from 'react-router-dom'
import './index.css';
import App from './App';
import './responsive.css';

import { Route, IndexRoute } from 'react-router';
import Facedetect from './Facedetect';
import * as serviceWorker from './serviceWorker';
import logo from './logo.svg';


// ReactDOM.render(<Router history={browserHistory} routes={routes} />,<App />, document.getElementById('root'));


ReactDOM.render(

<HashRouter>
    <App />
  </HashRouter>
, document.getElementById('root'));



// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.unregister();
