import swaggerJsdoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "ReCustom User Metrics API",
      version: "1.0.0",
      description: "A simple User Management API",
    },
    servers: [
      {
        url: "http://localhost:3001",
        description: "Development server",
      },
    ],
  },
  apis: ["./src/index.ts"], // Path to the API docs
};

export const specs = swaggerJsdoc(options);
