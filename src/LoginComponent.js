import React,{Component} from 'react';
class LoginComponent extends Component {
  render(){
    return(
      <div className="login">
        <div className="logincontent">
          <h1>Welcome</h1>
          <p>Please Login To Continue</p>
          <form >
            <div class="form-control">
              <label class="login-form">Enter Your registered Email Address</label>
              <input class="input-form"type="text" placeholder="Email Address" value="" required />
            </div>
            <div>
            <label class="login-form">Enter Your Password</label>
            <input class="input-form"type="text" placeholder="Password" value="" required />
            </div>
            <button class="buttonclass" value="Login">Login</button>
          </form>
         
        </div>
      </div>
    )
  }

}
export default LoginComponent;


