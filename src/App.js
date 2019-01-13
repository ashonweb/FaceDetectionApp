import React, { Component } from 'react';
// import logo from './logo.svg';
import './App.css';
import LoginComponent from './LoginComponent';
import {  Route, Switch } from 'react-router';
import Facedetect from'./Facedetect';


class App extends Component {
  render() {
    return (            
      <div>
        <Switch>
        <Route exact path='/' render={() => (
          <div>
            <div className="App">
              <header className="head">
                <h1>Face Detection</h1>
                <h5>Upload an image to detect information about a face.</h5>
              </header>
            </div>
            <LoginComponent />
          </div>          
        )} />
        <Route path='/Facedetect' component={Facedetect} />              
      </Switch>            
      </div>     
      
      
      
    );
  }
}

export default App;
