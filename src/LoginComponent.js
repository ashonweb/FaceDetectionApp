import React,{Component} from 'react';
// import { Jumbotron, Button } from 'react-bootstrap';
// import { Link } from 'react-router';
import { Link } from 'react-router-dom';
import Facedetect from './Facedetect';
import Faceapi from './Faceapi';
import { Route , withRouter} from 'react-router-dom';


class LoginComponent extends Component {
  constructor(props){
    super(props)
    this.state = {
      email:"test@test.com",
      password:"password",
      // email : "",
      // password :"",
      isLoggedIn:false,
      incorrectcreds:false,
    }
  }
  onChange = (event) =>{
    this.setState ({
      email : event.target.value,
    })
  }

  onChangepass = (event) =>{
    this.setState({
      password:event.target.value
    })
  }

  // onSubmit = (event) =>{
   
  //   event.preventDefault();
  //   const { email, password } = this.state;
  //   console.log(this.state.email);
  //   if(email === '' && password === ''){
  //     alert("Please enter valid creds");
  //   }
  //   else  if(email === ''){
  //     alert("Please enter the email");
  //   }
  //   else if(password === ''){
  //     alert("please enter the password")
  //   }

  //   if (email === "test@test.com" && password === "password") {
  //     alert("good creds");
     
     
  //     this.props.history.push('/Facedetect');
      
  //   }
  //     else{
  //       alert("please enter valid creds")
  //     }
  // }
  
  onSubmit = (event) => {
    event.preventDefault();
    const { email, password } = this.state;
    console.log(this.state.email);
    if (email === "test@test.com" && password === "password") {
      this.props.updateIsLoggedIn(true);
      // alert("good creds");
      this.props.history.push('/Facedetect');
      console.log(this.props.isLoggedIn);      
    }
    else if (email === "" && password === ""){
      this.setState({
        incorrectcreds:true,
      })
      alert("please enter valid creds")

    }
    else {
      this.setState({
        incorrectcreds:true,
      })
      alert("please enter valid creds")
    }

    
  }
  







  render(){
    return(
      
      <div className=" login ">
        <div className="logincontent">
          <h1>Welcome</h1>
          <p>Please Login To Continue</p>
          <form onSubmit={this.onSubmit}>
            <div class="form-control">
              <label class="login-form">Enter Your registered Email Address</label>
              <input class="input-form" type="text"  onChange = {this.onChange} placeholder="Email Address"   required />
            </div>
            <div>
            <label class="login-form">Enter Your Password</label>
            <input class="input-form"type="password" onChange ={this.onChangepass} placeholder="Password"  required />
            </div>
             {/* <Link to = "/Facedetect">  */}
            <button class="buttonclass" onClick = {this.onSubmit}value="Login">Login</button> 
            {/* </Link> */}
          </form>
          
        </div>
      </div>
      
    )
  }

}
export default withRouter(LoginComponent);


