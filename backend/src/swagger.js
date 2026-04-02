import swaggerJsdoc from "swagger-jsdoc";
import path from "path";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Jobs API",
      version: "1.0.0",
    },
  },
  apis: [path.resolve("src/**/*.js")],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;