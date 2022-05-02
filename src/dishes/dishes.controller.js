const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId"); 

// TODO: Implement the /dishes handlers needed to make the tests pass
let lastDishId = dishes.reduce((maxId, dish) => Math.max(maxId, dish.id), 0)

function dishExists(req, res, next) {
  const { dishId } = req.params;
  const foundDish = dishes.find(dish => dish.id == (dishId));
  if (foundDish) {
    res.locals.dish = foundDish;
    return next();
  }
  next({
    status: 404,
    message: `Dish does not exist: ${dishId}.`,
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
        message: `Dish must include a ${propertyName}`
    });
  };
}

function idIsValid(req, res, next) {
  const { dishId } = req.params;
  const { data: { id } = {} } = req.body;
  if (id && id !== dishId) {
      next({
      status: 400,
      message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`,
    });
  }
   return next();
}

function namePropertyIsValid(req, res, next) {
  const { data: { name } = {} } = req.body;
  if (name.length > 0) {
    return next();
  }
  next({
    status: 400,
    message: `Dish must include a name`,
  });
}

function descriptionPropertyIsValid(req, res, next) {
  const { data: { description } = {} } = req.body;
  if (description.length > 0) {
    return next();
  }
  next({
    status: 400,
    message: `Dish must include a description`,
  });
}

function priceIsValidNumber(req, res, next){
  const { data: { price }  = {} } = req.body;
  if (price <= 0 || !Number.isInteger(price)){
      return next({
          status: 400,
          message: 'Dish must have a price that is an integer greater than 0'
      });
  }
  next();
}

function imagePropertyIsValid(req, res, next) {
  const { data: { image_url } = {} } = req.body;
  if (image_url.length > 0) {
    return next();
  }
  next({
    status: 400,
    message: 'Dish must include a image_url',
  });
}

function create(req, res) {
  const { data: { name, description, price, image_url } = {} } = req.body;
  const newDish = {
    id: ++lastDishId, // Increment last id then assign as the current ID
    name: name,
    description: description,
    price: price,
    image_url: image_url
  };
  dishes.push(newDish);
  res.status(201).json({ data: newDish });
}

function read(req, res, next) {
  res.json({ data: res.locals.dish });
};

function update(req, res) {
  const dishes = res.locals.dish;
  const { data: { name, description, price, image_url } = {} } = req.body;

  // update the dishes
  dishes.name = name;
  dishes.description = description;
  dishes.price = price;
  dishes.image_url = image_url;

  res.json({ data: dishes });
}

function list(req, res) {
  const { userId } = req.params;
  res.json({ data: dishes.filter(userId ? dishes => dishes.user_id == userId : () => true) });
}

module.exports = {
  create: [
      bodyDataHas("name"),
      bodyDataHas("description"),
      bodyDataHas("price"),
      bodyDataHas("image_url"),
      namePropertyIsValid,
      descriptionPropertyIsValid,
      priceIsValidNumber,
      imagePropertyIsValid,
      create
    ],

  list,
  read: [dishExists, read],
  update: [
      dishExists,
      bodyDataHas("name"),
      bodyDataHas("description"),
      bodyDataHas("price"),
      bodyDataHas("image_url"),
      namePropertyIsValid,
      descriptionPropertyIsValid,
      priceIsValidNumber,
      imagePropertyIsValid,
      idIsValid,
      update
  ]
 };
