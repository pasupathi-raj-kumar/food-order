import axios from "axios";

export const ADD_TO_CART = "ADD_TO_CART";
export const UPDATE_CART_ITEM = "UPDATE_CART_ITEM";
export const REMOVE_FROM_CART = "REMOVE_FROM_CART";
// export const SET_RESTAURANT_ID = "SET_RESTAURANT_ID";
export const FETCH_CART = "FETCH_CART";
// export const SAVE_DELIVERY_INFO = "SAVE_DELIVERY_INFO";

export const CLEAR_CART = "CLEAR_CART";

// Fetch cart items
export const fetchCartItems = (alert) => async (dispatch, getState) => {
  try {
    const response = await axios.get("/api/v1/eats/cart/get-cart");
    dispatch({
      type: FETCH_CART,
      payload: response.data.data,
    });
    console.log("response of the data", response);
  } catch (error) {
    console.error("Fetch cart error:", error);
    if (alert) {
      alert.error("Failed to fetch cart items");
    }
  }
};

// Add to cart
export const addItemToCart =
  (foodItemId, restaurant, quantity, alert) => async (dispatch, getState) => {
    try {
      const { user } = getState().auth;
      const response = await axios.post("/api/v1/eats/cart/add-to-cart", {
        userId: user._id,
        foodItemId,
        restaurantId: restaurant,
        quantity,
      });
      alert.success("Item added to cart", response.data.cart);
      dispatch({
        type: ADD_TO_CART,
        payload: response.data.cart,
      });
    } catch (error) {
      console.error("Add to cart error:", error);
      alert.error(error.response ? error.response.data.message : error.message);
    }
  };

// Update cart item quantity
export const updateCartQuantity =
  (foodItemId, quantity, alert) => async (dispatch, getState) => {
    try {
      const { user } = getState().auth;
      console.log(foodItemId, quantity, user._id);

      if (typeof foodItemId === "object") {
        foodItemId = foodItemId._id;
      }

      const response = await axios.post("/api/v1/eats/cart/update-cart-item", {
        userId: user._id,
        foodItemId: foodItemId,
        quantity,
      });

      console.log("Update cart response:", response);

      dispatch({
        type: UPDATE_CART_ITEM,
        payload: response.data.cart,
      });
    } catch (error) {
      console.error("Update cart error:", error);
      alert.error(error.response ? error.response.data.message : error.message);
    }
  };
// Remove from cart
export const removeItemFromCart =
  (foodItemId) => async (dispatch, getState) => {
    // const alert = useAlert(); // Get the alert instance here

    try {
      const { user } = getState().auth;
      if (typeof foodItemId === "object") {
        foodItemId = foodItemId._id;
      }
      console.log("last food item :", foodItemId);

      const response = await axios.delete(
        "/api/v1/eats/cart/delete-cart-item",
        {
          data: { userId: user._id, foodItemId },
        }
      );

      console.log("Remove from cart response:", response);

      dispatch({
        type: REMOVE_FROM_CART,
        payload: response.data,
      });
    } catch (error) {
      console.error("Remove from cart error:", error);
      alert.error(error.response ? error.response.data.message : error.message);
      alert.error(error);
    }
  };

// Action to clear cart
// export const clearCart = () => (dispatch) => {
//   dispatch({ type: CLEAR_CART });
// };

// export const saveDeliveryInfo = (deliveryInfo) => (dispatch) => {
//   dispatch({ type: SAVE_DELIVERY_INFO, payload: deliveryInfo });
// };

// export const setRestaurantId = (id) => {
//   return {
//     type: SET_RESTAURANT_ID,
//     payload: id,
//   };
// };
