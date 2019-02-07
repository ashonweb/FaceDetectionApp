import React, { Component } from "react";
import {withRouter} from 'react-router-dom';
import { Redirect } from 'react-router-dom';
// import { detectFace } from 'Faceapi.js';
 import Faceapi from './Faceapi';
//  import spinner from './logo.svg';
import Modal from 'react-awesome-modal';
 import Spinner from './Spinner';
 import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
 import { library } from '@fortawesome/fontawesome-svg-core';
 import { faGlasses, faSpinner } from '@fortawesome/free-solid-svg-icons'
 import { faFemale,faMale,faTransgender,faGlobe,faLaugh,faHeartbeat,faUpload, } from '@fortawesome/free-solid-svg-icons'





 
 import {
  Row,  
  Col,  
} from 'react-bootstrap';




 class Facedetect extends Component {
constructor(props){
  super(props);
  this.state =  {
    imageuploaded : '',
    imageurl:'',
    loading:false,
    visible:false,
    
  }


}


handleImageUrl = (e) =>{
  this.setState({
    imgurl: e.target.value,      
  })
}

handleImageUrlUpload = () => {
  this.setState({
    imageuploaded: this.state.imgurl,
  })
  this.detectFace(this.state.imgurl)
}




  logout = (event) =>{
    event.preventDefault();
    this.props.history.push('/');

  }
  closeModal() {
    this.setState({
        visible : false
    });
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
    this.setState({ loading: true },()=>{
    this.postRequest('https://api.kairos.com/detect', {image: image})
      .then(data => data.json()) // Result from the `response.json()` call
      .then((data) => {
        // console.log(data.images[0].faces[0].attributes);
        // console.log(data.Errors[0].Message);
        if(data.Errors) {
          // handle error
          console.log(data.Errors[0].Message);
          // alert("No faces were found");
          this.setState({
            visible:true,
            ErrorMessage : data.Errors[0].Message,
            loading: false,
          })

        } else {
          let race =''
          let races = [
            {name: 'asian', val: data.images[0].faces[0].attributes.asian},
            {name: 'black', val: data.images[0].faces[0].attributes.black},
            {name: 'hispanic', val: data.images[0].faces[0].attributes.hispanic},
            {name: 'white', val: data.images[0].faces[0].attributes.white},
            {name: 'other', val: data.images[0].faces[0].attributes.other},
          ]
          races.sort((a, b) => b.val - a.val);
          race = races[0].name;
          
          this.setState({
            imageOutput: data.images[0].faces[0].attributes,
            age : data.images[0].faces[0].attributes.age,
            gender : data.images[0].faces[0].attributes.gender.type,
            glasses : data.images[0].faces[0].attributes.glasses,
            lips : data.images[0].faces[0].attributes.lips,
            race: race,                   
            loading: false
          })
        }
        console.log(data);            
      })
      .catch(error => console.error(error))
    })
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
    const { imageOutput,age,gender,lips,glasses,race,loading} = this.state;
    const {isLoggedIn} = this.props;
    if (!isLoggedIn) {
      return (
        <Redirect
          to={{
            pathname: "/"            
          }}
        />
      )
    }   
    return (
      <div className="completeFace">
        <Row>
          <Col className="columnfirst" md={6}>
            <div id="Facedetect">
              <div class="imageperson" >
                <img id="output" src={this.state.imageuploaded} alt="" />
                <div>
                  <input type='file' id="imageUpload" multiple=" false " accept="image/*" onChange={this.upload1} />
                </div>
              </div>
              <div className="imageuploaddiv  ">
                {/* <label class="imageUpload" htmlFor="imageUpload" onChange={this.upload1}> <FontAwesomeIcon   icon={faUpload}  /> &nbsp;&nbsp; upload Image</label> */}
                {/* <input
                  className=" imageUpload1"
                  type="text"
                  onChange={this.handleImageUrl}
                  placeholder="Image URL"

                />
                <button
                  className="img-url-submit"
                  onClick={this.handleImageUrlUpload }
                  
                >
                  Go
                </button> */}
                <label class="imageUpload" htmlFor="imageUpload" onChange={this.upload1}> <FontAwesomeIcon icon={faUpload} /> &nbsp;&nbsp; upload Image</label>
                <input type="text" className="img-url-class" onChange={this.handleImageUrl}
                  placeholder="Image URL" />
                <button className="img-url-submit" onClick={this.handleImageUrlUpload}>Go</button>
                {loading ? <Spinner /> : null}
              </div>
            </div>
          </Col>
          <Col className="columnsecond" md={6}>
            <div>
              <div className="attributes1">
                <FontAwesomeIcon icon={faHeartbeat} /> &nbsp;&nbsp;
                Age: {age}
              </div>
            </div>
            <div className="attributes2">
              <FontAwesomeIcon icon={faTransgender} /> &nbsp;&nbsp;

              Gender: {gender}
            </div>
            <div className="attributes3">
              <FontAwesomeIcon icon={faGlobe} /> &nbsp;&nbsp;

              Race: {race}
            </div>
            <div className="attributes4">
              <FontAwesomeIcon icon={faGlasses} /> &nbsp;&nbsp;

              Glasses:{glasses}
            </div>
            <div className="attributes5">
              <FontAwesomeIcon icon={faLaugh} /> &nbsp;&nbsp;

              Lips:{lips}
            </div>
          </Col>
        </Row>
        <Modal visible={this.state.visible} width="400" height="200" margin-top="200" effect="fadeInUp" onClickAway={() => this.closeModal()}>
          <div >
            <p class="errorclass">No Faces were detected</p>
            <div>
              <input class="okbutton  " type="button" value="OK" onClick={() => this.closeModal()} />

            </div>
          </div>
        </Modal>
        <div class="wrap">
          <button class="facebuttonclass" onClick={this.logout} value="Logout" >Logout</button>
        </div>
      </div>
    );
  }
}

export default withRouter(Facedetect);