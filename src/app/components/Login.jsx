import React from 'react';
import { Button, Form } from 'semantic-ui-react'

class LogIn extends React.Component {
    state = {
        username : '',
        password : '',
    }

    handleChange = input => event => {
        this.setState({ [input] : event.target.value })
    }
    render() {
        return(
            <div>
                  <Form>
                    <h3>Log In</h3>
                    <Form.Field>
                        <label>User Name</label>
                        <input placeholder='User Name' onChange={this.handleChange('username')} />
                    </Form.Field>
                    <Form.Field>
                        <label>Password</label>
                        <input placeholder='Password' type='password' onChange={this.handleChange('username')}/>
                    </Form.Field>
                    <Button type='submit'>Submit</Button>
                    <br/>
                    <br/>
                    <a href="/signup">Sign Up</a>
                </Form>
            </div>
        )
    }
}

export default LogIn;