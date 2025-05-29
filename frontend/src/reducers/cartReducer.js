import {
  ADD_TO_CART,
  UPDATE_CART_ITEM,
  REMOVE_FROM_CART,
  FETCH_CART,
  CLEAR_CART,
  // SAVE_DELIVERY_INFO,
} from "../actions/cartActions";

const initialState = {
  cartItems: [],
  restaurant: {},
};

export const cartReducer = (state = initialState, action) => {
  switch (action.type) {
    case ADD_TO_CART:
      return {
        ...state,
        restaurant: action.payload.restaurant,
        cartItems: action.payload.items,
      };
    case UPDATE_CART_ITEM:
      // console.log(action.payload.items);
      return {
        ...state,
        cartItems: action.payload.items,
      };
    case FETCH_CART:
      return {
        ...state,
        restaurant: action.payload.restaurant,
        cartItems: action.payload.items,
      };

    case REMOVE_FROM_CART:
      console.log(action.payload);
      if (action.payload.cart === undefined) {
        return {
          ...state,
          cartItems: [],
        };
      } else {
        return {
          ...state,
          cartItems: action.payload.cart.items,
        };
      }
    case CLEAR_CART:
      return {
        ...state,
        cartItems: [],
      };
    // case SAVE_DELIVERY_INFO:
    //   return {
    //     ...state,
    //     deliveryInfo: action.payload,
    //   };

    default:
      return state;
  }
};
