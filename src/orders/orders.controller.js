const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass
let lastOrderId = orders.reduce((maxId, order) => Math.max(maxId, order.id), 0)

function orderExists(req, res, next) {
  const { orderId } = req.params;
  const foundOrder = orders.find(order => order.id === (orderId));
  if (foundOrder) {
    res.locals.order = foundOrder;
    return next();
  }
  next({
    status: 404,
    message: `Order does not exist: ${orderId}.`,
  });
};

function bodyDataHas(propertyName) {
  return function (req, res, next) {
    const { data = {} } = req.body;
    if (data[propertyName]) {
      return next();
    }
    next({
        status: 400,
        message: `Order must include a ${propertyName}`
    });
  };
}

function deliverToPropertyIsValid(req, res, next) {
  const { data: { deliverTo } = {} } = req.body;
  if (deliverTo.length > 0) {
    return next();
  }
  next({
    status: 400,
    message: `Order must include a deliverTo`,
  });
}

function mobileNumberPropertyIsValid(req, res, next) {
  const { data: { mobileNumber } = {} } = req.body;
  if (mobileNumber.length > 0) {
    return next();
  }
  next({
    status: 400,
    message: `Order must include a mobileNumber`,
  });
}
 
function dishesIsValidNumber(req, res, next){
  // const { data: { dishes }  = {} } = req.body;
 // console.log(req.body.data);
 // const dishes = req.body.data.dishes;
 // console.log(req.body.data.dishes);
 // console.log(req.body.data.dishes.isArray);
  if (!req.body.data.dishes || !Array.isArray(req.body.data.dishes) || req.body.data.dishes.length == 0) {
      return next({
          status: 400,
          message: `Order must include at least one dish`
      });
  }
  next();
}

function isDishValid(req, res, next){
 // const { data: { dishes }  = {} } = req.body;
  for(let index=0; index < req.body.data.dishes.length; index++) {
    if(!quantityIsValidNumber(req.body.data.dishes[index].quantity)) {
      return next({
            status: 400,
            message: `Dish ${index} must have a quantity that is an integer greater than 0`
        });
    }
  }
  next();
}

function quantityIsValidNumber(quantity) {
  return ((quantity > 0) && Number.isInteger(quantity));
}

function idMatchesOrder(req, res, next){
  const { orderId } = req.params;
  const { data: { id } = {} } = req.body;
  if (id && id !== orderId){
    return next({
            status: 400,
            message: `Order id does not match route id. Order: ${id}, Route: ${orderId}.`
        });
     }
   next()
}

function statusValid(req, res, next){
  const { data: { status } = {} } = req.body;
  if (!status || status.length == 0){
    return next({
            status: 400,
            message: `Order must have a status of pending, preparing, out-for-delivery, delivered`
        });
     } else if (status === "invalid"){
       return next({
            status: 400,
            message: `status`
        });
     }
   next()
}

function statusValidForDelete(req, res, next){
  let order = res.locals.order
  
  if (order.status !== 'pending'){
    next({
      status: 400,
      message: `An order cannot be deleted unless it is pending`,
  });
     } 
       next();
}

function create(req, res) {
  const { data: { deliverTo, mobileNumber, dishes, status } = {} } = req.body;
  const newOrder = {
    id: ++lastOrderId, // Increment last id then assign as the current ID
    deliverTo: deliverTo,
    mobileNumber: mobileNumber,
    dishes: dishes,
    status: status
  };
  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}

function read(req, res, next) {
  res.json({ data: res.locals.order });

};

function update(req, res) {
  const orders = res.locals.order;
  const { data: { deliverTo, mobileNumber, dishes, status } = {} } = req.body;

  // update the orders
    orders.deliverTo = deliverTo;
    orders.mobileNumber = mobileNumber;
    orders.dishes = dishes;
    //orders.quantity = quantity;
    orders.status = status;

  res.json({ data: orders });
}

function list(req, res) {
  const { orderId } = req.params;
  res.json({ data: orders.filter(orderId ? orders => orders.id == orderId : () => true) });
}

function destroy(req, res) {
  const { orderId } = req.params;
  const index = orders.findIndex((order) => order.id === (orderId));
  // `splice()` returns an array of the deleted elements, even if it is one element
  const deletedOrders = orders.splice(index, 1);
  res.sendStatus(204);
}

module.exports = {
  create: [
      bodyDataHas("deliverTo"),
      bodyDataHas("mobileNumber"),
      bodyDataHas("dishes"),
      dishesIsValidNumber,
      isDishValid,
      mobileNumberPropertyIsValid,
      deliverToPropertyIsValid,
      create
    ],

  list,
  read: [orderExists, read],
  update: [
      orderExists,
      bodyDataHas("deliverTo"),
      bodyDataHas("mobileNumber"),
      bodyDataHas("dishes"),
      bodyDataHas("status"),
      dishesIsValidNumber,
      isDishValid,
      mobileNumberPropertyIsValid,
      deliverToPropertyIsValid,
      idMatchesOrder,
      statusValid,
      update
  ],
  delete: [
      orderExists,
      statusValidForDelete,
      destroy
  ]
 };
