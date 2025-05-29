import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faIndianRupeeSign } from "@fortawesome/free-solid-svg-icons";
import { useDispatch, useSelector } from "react-redux";
import { useAlert } from "react-alert";
import {
  addItemToCart,
  updateCartQuantity,
  removeItemFromCart,
} from "../actions/cartActions";
import { useNavigate } from "react-router-dom";

const Fooditem = ({ fooditem, restaurant }) => {
  const [quantity, setQuantity] = useState(1);
  const [showButtons, setShowButtons] = useState(false);
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  const dispatch = useDispatch();
  const alert = useAlert();

  const cartItems = useSelector((state) => state.cart.cartItems);

  useEffect(() => {
    const cartItem = cartItems.find(
      (item) => item.foodItem._id === fooditem._id
    );

    if (cartItem) {
      setQuantity(cartItem.quantity);
      setShowButtons(true);
    } else {
      setQuantity(1);
      setShowButtons(false);
    }
  }, [cartItems, fooditem]);

  const decreaseQty = () => {
    if (quantity > 1) {
      const newQuantity = quantity - 1;
      setQuantity(newQuantity);
      dispatch(updateCartQuantity(fooditem._id, newQuantity, alert));
    } else {
      setQuantity(0);
      setShowButtons(false);
      dispatch(removeItemFromCart(fooditem._id));
    }
  };

  const increaseQty = () => {
    if (quantity < fooditem.stock) {
      const newQuantity = quantity + 1;
      setQuantity(newQuantity);
      dispatch(updateCartQuantity(fooditem._id, newQuantity, alert));
    } else {
      alert.error("Exceeded stock limit");
    }
  };

  const addToCartHandler = () => {
    if (!isAuthenticated && !user) {
      return navigate("/users/login");
    }
    console.log("Add to Cart Handler Called"); // Debug log
    if (fooditem && fooditem._id) {
      dispatch(addItemToCart(fooditem._id, restaurant, quantity, alert));
      setShowButtons(true); // Update the state to show buttons
      // console.log("Show Buttons:", showButtons); // Debug log
    } else {
      console.error("Food item ID is undefined");
      // Optionally, you can display an error message to the user here
    }
  };

  return (
    <div className="col-sm-12 col-md-6 col-lg-3 my-3">
      <div className="card p-3 rounded">
        <img
          className="card-img-top mx-auto"
          src={fooditem.images[0].url}
          alt={fooditem.name}
        ></img>
        <div className="card-body d-flex flex-column">
          <h5 className="card-title">{fooditem.name}</h5>
          <p className="fooditem_des">{fooditem.description}</p>
          <p className="card-text">
            <FontAwesomeIcon icon={faIndianRupeeSign} size="xs" />
            {fooditem.price}
            <br />
          </p>
          {!showButtons ? (
            <button
              type="button"
              id="cart_btn"
              className="btn btn-primary d-inline ml-4"
              disabled={fooditem.stock === 0}
              onClick={addToCartHandler}
            >
              Add to Cart
            </button>
          ) : (
            <div className="stockCounter d-inline">
              <span className="btn btn-danger minus" onClick={decreaseQty}>
                -
              </span>
              <input
                type="number"
                className="form-control count d-inline"
                value={quantity}
                readOnly
              />
              <span className="btn btn-primary plus" onClick={increaseQty}>
                +
              </span>
            </div>
          )}
          <hr />
          <p>
            Status:
            <span
              id="stock_status"
              className={fooditem.stock > 0 ? "greenColor" : "redColor"}
            >
              {fooditem.stock > 0 ? "In Stock" : "Out of Stock"}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Fooditem;
