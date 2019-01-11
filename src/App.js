import React, { Component } from 'react';
// import logo from './logo.svg';
import './App.css';
import LoginComponent from './LoginComponent';
import {  Route } from 'react-router';
import Facedetect from'./Facedetect';


class App extends Component {
  render() {
    return (
      <div className="App">
      <header className="head">
        <h1>Face Detection</h1>
        <h5>Upload an image to detect information about a face.</h5>
      </header>
      {/* <Route path="/LoginComponent" component={LoginComponent} /> */}
      <LoginComponent />
      <Route path='/Facedetect' component={Facedetect} />
 
        
      </div>
    );
  }
}

export default App;
