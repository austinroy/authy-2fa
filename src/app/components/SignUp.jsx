import React from 'react';
import { Button, Checkbox, Form } from 'semantic-ui-react'
import Axios from 'axios';

class LogIn extends React.Component {
    state = {
        username : '',
        email : '',
        countryCode : '',
        phoneNumber : '',
        password : '',
        confirmPassword : ''
    }

    handleChange = input => event => {
        this.setState({ [input] : event.target.value })
    }

    render() {
        return(
            <div>
                  <Form>
                    <h3>Sign Up</h3>
                    <Form.Field>
                        <label>User Name</label>
                        <input placeholder='User Name' onChange={this.handleChange('username')}/>
                    </Form.Field>
                    <Form.Field>
                        <label>Email Address</label>
                        <input placeholder='Email Address' onChange={this.handleChange('email')}/>
                    </Form.Field>
                    <Form.Field>
                        <label>Country Code</label>
                        <input placeholder='Country Code' onChange={this.handleChange('countryCode')}/>
                    </Form.Field>
                    <Form.Field>
                        <label>Phone Number</label>
                        <input placeholder='Phone Number' onChange={this.handleChange('phoneNumber')}/>
                    </Form.Field>
                    <Form.Field>
                        <label>Password</label>
                        <input placeholder='Password' type='password' onChange={this.handleChange('password')}/>
                    </Form.Field>
                    <Form.Field>
                        <label>Confirm Password</label>
                        <input placeholder='ConfirmPassword' type='password' onChange={this.handleChange('confirmPassword')}/>
                    </Form.Field>
                    <Form.Field>
                        <Checkbox label='I agree to the Terms and Conditions' />
                    </Form.Field>
                    <Button type='submit' onClick={this.handleSubmit} >Submit</Button>
                    <br/>
                    <br/>
                    <a href="/login">Login</a>
                </Form>
            </div>
        )
    }
}

export default LogIn;