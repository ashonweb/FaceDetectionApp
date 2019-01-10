import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import LoginComponent from './LoginComponent';

class App extends Component {
  render() {
    return (
      <div className="App">
      <header className="head">
        <h1>Face Detection</h1>
        <h5>Upload an image to detect information about a face.</h5>
      </header>
      <LoginComponent />
        
      </div>
    );
  }
}

export default App;
