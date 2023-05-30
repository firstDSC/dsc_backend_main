// const swaggerAutogen = require("swagger-autogen")();
import swaggerAutogen from "swagger-autogen";

const doc = {
  info: {
    title: "DSC APIs",
    description: "분산 시스템 및 컴퓨팅 API",
  },
  host: "localhost:5000",
  schemes: ["http"],
};

const outputFile = "./swagger-output.json";
const endpointsFiles = [
  "../stocks/stockController.js",
  "../user/userController.js",
];

/* NOTE: if you use the express Router, you must pass in the 
   'endpointsFiles' only the root file where the route starts,
   such as index.js, app.js, routes.js, ... */

swaggerAutogen(outputFile, endpointsFiles, doc);
