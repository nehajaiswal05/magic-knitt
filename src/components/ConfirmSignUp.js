import React, { Component } from "react";
import { Redirect } from "react-router-dom";
import withContext from "../withContext";

class ConfirmSignUp extends Component {
  constructor(props) {
    super(props);
    const user = JSON.parse(localStorage.getItem("user"));
    this.state = {
      username: user.email,
      confirmationCode: ""
    };
  }

  handleChange = e => this.setState({ [e.target.name]: e.target.value, error: "" });

  confirmSignUp = (e) => {
    e.preventDefault();
    const { username, confirmationCode } = this.state;
    if (!confirmationCode) {
      return this.setState({ error: "Please enter the confirmation code sent to your email address!" });
    }
    this.props.context.confirmSignUp(this.state.username, this.state.confirmationCode)
      .then((confirmUser) => {
        if (!confirmUser) {
          this.setState({ error: "Error while confirming new user registration" });
        }
      })
  };

  render() {
    return !this.props.context.user ? (
      <>
        <div className="hero is-primary ">
          <div className="hero-body container">
            <h4 className="title">Please check your email for the confirmation code sent to you</h4>
          </div>
        </div>
        <br />
        <br />
        <form onSubmit={this.confirmSignUp}>
          <div className="columns is-mobile is-centered">
            <div className="column is-one-third">
              <div className="field">
                <label className="label">Confirmation Code</label>
                <input
                  className="input"
                  type="confirmationCode"
                  name="confirmationCode"
                  onChange={this.handleChange}
                />
              </div>
              {this.state.error && (
                <div className="has-text-danger">{this.state.error}</div>
              )}
              <div className="field is-clearfix">
                <button
                  className="button is-primary is-outlined is-pulled-right"
                >
                  Verify
                </button>
              </div>
            </div>
          </div>
        </form>
      </>
    ) : (
      <Redirect to="/products" />
    );
  }
}

export default withContext(ConfirmSignUp);
