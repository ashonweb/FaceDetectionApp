import React ,{Component} from 'react';

import { Route, IndexRoute } from 'react-router';
import App from './App';
// import './resposive.css';

import LoginComponent from './LoginComponent';
import Facedetect from './Facedetect';
import { Switch, Route } from 'react-router-dom'


export default (
  <Switch>
      <Route exact path='/' component={LoginComponent}/>
      <Route path='/Facedetect' component={Facedetect}/>
    </Switch>


  
);