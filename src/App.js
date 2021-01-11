import React, { Component } from "react";
import { Switch, Route, Link, BrowserRouter as Router } from "react-router-dom";

import AddProduct from './components/AddProduct';
import Cart from './components/Cart';
import Login from './components/Login';
import ProductList from './components/ProductList';
import axios from 'axios';
import jwt_decode from 'jwt-decode';
import { Auth } from 'aws-amplify';
import Context from "./Context";
import SignUp from "./components/SignUp";

export default class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      user: null,
      cart: {},
      products: []
    };
    this.routerRef = React.createRef();
  }

  async componentDidMount() {
    let user = localStorage.getItem("user");
    let cart = localStorage.getItem("cart");

    const products = await axios.get('https://nyn35r0xb0.execute-api.us-west-2.amazonaws.com/prod/products?TableName=Products');
    user = user ? JSON.parse(user) : null;
    cart = cart? JSON.parse(cart) : {};
    this.setState({ user,  products: products.data.Items, cart });
  };

  signUp = async (email, password) => {
    const res = await Auth.signUp({
      username: email,
      password: password,
      attributes: {
        email: email          
    }
    })  
    .catch((error) => {
      console.log('error signing up:', error);
    })

    if(res.username !== '') {
      const user = {
        email: res.username,
        //token: res.signInUserSession.accessToken.jwtToken,
        accessLevel: email === 'admin@example.com' ? 0 : 1
      }
      this.setState({ user });
      localStorage.setItem("user", JSON.stringify(user));
      return true;
    }else {
      return false;
    }
  };

  login = async (email, password) => {
    const res = await Auth.signIn(email, password)
    .catch((error) => {
      return { status: 401, message: 'Unauthorized' }
    })
  
    if(res.username !== '') {
      const user = {
        email: res.username,
        token: res.signInUserSession.idToken.jwtToken,
        accessLevel: email === 'admin@example.com' ? 0 : 1
      }
      this.setState({ user });
      localStorage.setItem("user", JSON.stringify(user));
      return true;
    } else {
      return false;
    }
  };

  logout = e => {
    Auth.signOut();
    e.preventDefault();
    this.setState({ user: null });
    localStorage.removeItem("user");
  };

  addProduct = (product, callback) => {
    let products = this.state.products.slice();
    products.push(product);
    this.setState({ products }, () => callback && callback());
  };

  addToCart = cartItem => {
    let cart = this.state.cart;
    if (cart[cartItem.id]) {
      cart[cartItem.id].amount += cartItem.amount;
    } else {
      cart[cartItem.id] = cartItem;
    }
    if (cart[cartItem.id].amount > cart[cartItem.id].product.stock) {
      cart[cartItem.id].amount = cart[cartItem.id].product.stock;
    }
    localStorage.setItem("cart", JSON.stringify(cart));
    this.setState({ cart });
  };

  removeFromCart = cartItemId => {
    let cart = this.state.cart;
    delete cart[cartItemId];
    localStorage.setItem("cart", JSON.stringify(cart));
    this.setState({ cart });
  };
  
  clearCart = () => {
    let cart = {};
    localStorage.removeItem("cart");
    this.setState({ cart });
  };

  checkout = () => {
    if (!this.state.user) {
      this.routerRef.current.history.push("/login");
      return;
    }
  
    const cart = this.state.cart;
    const user = JSON.parse(localStorage.getItem("user"));
    const table = "Products";
    const products = this.state.products.map(p => {
      if (cart[p.name]) {
        p.stock = p.stock - cart[p.name].amount;
        axios.put(
          `https://nyn35r0xb0.execute-api.us-west-2.amazonaws.com/prod/products/${p.ProductId}`,
          { table,...p },
          { headers: {
            "Authorization" : user.token
          }}
        )
      }
      return p;
    });
  
    this.setState({ products });
    this.clearCart();
  };

  render(){
    return (
      <Context.Provider 
        value = {{
          ...this.state,
          removeFromCart: this.removeFromCart,
          addToCart: this.addToCart,
          login: this.login,
          signUp: this.signUp,
          addProduct: this.addProduct,
          clearCart: this.clearCart,
          checkout: this.checkout
        }}
      >
        <Router ref={this.routerRef}>
        <div className="App">
          <nav
            className="navbar container"
            role="navigation"
            aria-label="main navigation"
          >
            <div className="navbar-brand">
              <b className="navbar-item is-size-4 ">
                <Link to="/">
                  Magic Knitt
                </Link>
              </b>
              <label
                role="button"
                class="navbar-burger burger"
                aria-label="menu"
                aria-expanded="false"
                data-target="navbarBasicExample"
                onClick={e => {
                  e.preventDefault();
                  this.setState({ showMenu: !this.state.showMenu });
                }}
              >
                <span aria-hidden="true"></span>
                <span aria-hidden="true"></span>
                <span aria-hidden="true"></span>
              </label>
            </div>
              <div className={`navbar-menu ${
                  this.state.showMenu ? "is-active" : ""
                }`}>
                <Link to="/products" className="navbar-item">
                  Products
                </Link>
                {this.state.user && this.state.user.accessLevel < 1 && (
                  <Link to="/add-product" className="navbar-item">
                    Add Product
                  </Link>
                )}
                <Link to="/cart" className="navbar-item">
                  Cart
                  <span
                    className="tag is-primary"
                    style={{ marginLeft: "5px" }}
                  >
                    { Object.keys(this.state.cart).length }
                  </span>
                </Link>
                {!this.state.user ? (
                  <Link to="/login" className="navbar-item">
                    Login
                  </Link>
                ) : (
                  <Link to="/" onClick={this.logout} className="navbar-item">
                    Logout
                  </Link>
                )}
                {!this.state.user && (
                  <Link to="/signUp" className="navbar-item">
                    SignUp
                  </Link>
                )}
              </div>
            </nav>
            <Switch>
              <Route exact path="/" component={ProductList} />
              <Route exact path="/login" component={Login} />
              <Route exact path="/signUp" component={SignUp} />
              <Route exact path="/cart" component={Cart} />
              <Route exact path="/add-product" component={AddProduct} />
              <Route exact path="/products" component={ProductList} />
            </Switch>
          </div>
        </Router>
      </Context.Provider>
    );
  }
}
