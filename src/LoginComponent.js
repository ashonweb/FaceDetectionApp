import React,{Component} from 'react';
// import { Jumbotron, Button } from 'react-bootstrap';
// import { Link } from 'react-router';
import { Link } from 'react-router-dom';
import Facedetect from './Facedetect';


class LoginComponent extends Component {
  constructor(props){
    super(props)
    this.creds = {
      email:"test@test.com",
      password:"password",
    }
  }

  

  // onSubmit = (event) =>{
  //   event.preventDefault();

  // const { username, password } = this.state;
  // const { history } = this.props;

  // this.setState({ error: false });

  // if (!(username === 'george' && password === 'foreman')) {
  //   return this.setState({ error: true });
  // }

  // // store.set('loggedIn', true);
  // history.push('/users');

// }



    // const { email, password } = this.state;
    // if (email === "test@test.com" && password === "password") {

    
  
  render(){
    return(
      <div className="login">
        <div className="logincontent">
          <h1>Welcome</h1>
          <p>Please Login To Continue</p>
          <form onSubmit = {this.onSubmit}>
            <div class="form-control">
              <label class="login-form">Enter Your registered Email Address</label>
              <input class="input-form"type="text" placeholder="Email Address" value="" required />
            </div>
            <div>
            <label class="login-form">Enter Your Password</label>
            <input class="input-form"type="password" placeholder="Password" value="" required />
            </div>
            <Link to = "/Facedetect">
            <button class="buttonclass" value="Login">Login</button> 
            </Link>
          </form>
         
        </div>
      </div>
    )
  }

}
export default LoginComponent;


