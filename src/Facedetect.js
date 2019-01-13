import React, { Component } from "react";
import {withRouter} from 'react-router-dom';
// import { detectFace } from 'Faceapi.js';
 import Faceapi from './Faceapi';


 class Facedetect extends Component {
constructor(props){
  super(props);
  this.state =  {
    imageuploaded : '',
    
  }


}

componentDidMount (){
  
  var image = 'https://media.kairos.com/liz.jpg';
  postRequest('https://api.kairos.com/detect/'& image)
  .then(data => console.log(data)) // Result from the `response.json()` call
  .catch(error => console.error(error))

function postRequest(url, data) {
  return fetch(url, {
    credentials: 'same-origin', // 'include', default: 'omit'
    method: 'POST', // 'GET', 'PUT', 'DELETE', etc.
    body: JSON.stringify(data), // Coordinate the body type with 'Content-Type'
    headers: new Headers({
      'Content-Type': 'application/json',
      'app_id': 'e7805e07',
         'app_key': 'a7f38177d7e45fe3efe7c12cb322a682',

    }),
  });
  // .then(response => response.json())
}

}




  logout = (event) =>{
    event.preventDefault();
    this.props.history.push('/');

  }
  upload1 = (event) =>{
    var  file = event.target.files[0];
    var reader = new FileReader();
    let self = this;
    reader.onload = (e, ) =>{
      var image = reader.result;
      console.log(image);
      self.setState({
        imageuploaded : image,        
      }, () => {
        self.detectFace(this.state.imageuploaded)
      })
      // this.props.detectFace(reader.result)
    }
    reader.readAsDataURL(file);      
  }

  detectFace = (image) => {
    this.postRequest('https://api.kairos.com/detect', {image: image})
      .then(data => data.json()) // Result from the `response.json()` call
      .then((data) => {
        console.log(data);
        this.setState({
          imageOutput: data
        })
      })
      .catch(error => console.error(error))
  }

  postRequest = (url, data) => {
    return fetch(url, {
      credentials: 'same-origin', // 'include', default: 'omit'
      method: 'POST', // 'GET', 'PUT', 'DELETE', etc.
      body: JSON.stringify(data), // Coordinate the body type with 'Content-Type'
      headers: new Headers({
        'Content-Type': 'image/jpeg',
        'app_id': 'e7805e07',
        'app_key': 'a7f38177d7e45fe3efe7c12cb322a682',
      }),
    })
  }


  render() {
    return (
      <div id="Facedetect">
        <div class="imageperson" >
          <img id="output" src = {this.state.imageuploaded} alt="" />
          <div> 
          <input type='file' id="imageUpload" multiple=" false " accept="image/*" onChange={this.upload1} />
        </div>
        </div>
        <label class="imageUpload" htmlFor="imageUpload" onChange={this.upload1}> upload Image</label>
       
        <div class="wrap">
          <button class="facebuttonclass" onClick={this.logout} value="Login">Logout</button>
        </div>
       
      </div>
    );
  }
}

export default withRouter(Facedetect);