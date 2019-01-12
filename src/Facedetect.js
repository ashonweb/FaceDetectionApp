import React, { Component } from "react";
import {withRouter} from 'react-router-dom';
import { fcall } from "q";

 class Facedetect extends Component {
  logout = (event) =>{
    event.preventDefault();
    this.props.history.push('/');

  }

  
upload =(event) =>{
  var image = document.getElementById('output');
  image.src = URL.createObjectURL(event.target.files[0]);
  


}


  render() {
    return (
      <div id="Facedetect">
        <div class="imageperson" >
          <img id="output" />
          <div> 
          <input type='file' id="imageUpload" multiple=" false " accept="image/*" onChange={this.upload} />
        </div>
        </div>
        {/* <label class="imageUpload" htmlFor="output"> upload Image</label> */}
       
        <div class="wrap">
          <button class="facebuttonclass" onClick={this.logout} value="Login">Logout</button>
        </div>

      </div>
    );
  }
}

export default withRouter(Facedetect);