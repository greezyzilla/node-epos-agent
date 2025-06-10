const swaggerJsdoc = require('swagger-jsdoc');

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Barcode Print Agent API',
      version: '1.0.0',
      description: 'API documentation for the Barcode Print Agent application',
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
      contact: {
        name: 'Support',
        url: 'https://github.com/your-username/print-agent',
      },
    },
    servers: [
      {
        url: 'http://localhost:3310',
        description: 'Development server',
      },
    ],
    tags: [
      {
        name: 'Print',
        description: 'Print operations for text and barcodes',
      },
      {
        name: 'Device',
        description: 'Printer device management',
      },
      {
        name: 'Status',
        description: 'Server and printer status information',
      },
    ],
    components: {
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            message: {
              type: 'string',
              example: 'Error message',
            },
            error: {
              type: 'string',
              example: 'Error details',
            },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.js', './src/controllers/*.js'], // Path to the API docs
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

module.exports = swaggerSpec; 