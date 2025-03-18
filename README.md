# Auth0 JWT Authorization for AWS API Gateway

This project implements a custom AWS Lambda Authorizer that validates Auth0-issued JWT tokens before granting access to API Gateway resources. The authorizer verifies the token signature using Auth0's JSON Web Key Set (JWKS) and retrieves the user's profile information.

## Prerequisites

Ensure you have the following setup before using this Lambda function:

- An Auth0 tenant
- An API registered in Auth0 with an appropriate audience
- AWS Lambda and API Gateway configured
- Node.js installed locally

## Environment Variables

Create a `.env` file in the root directory and define the following variables:

```
AUTH0_DOMAIN=your-auth0-domain
AUDIENCE=your-auth0-api-audience
```

Example:

```
AUTH0_DOMAIN=your-tenant.auth0.com
AUDIENCE=https://your-api-identifier/
```

## Installation

1. Clone the repository.
2. Install dependencies:
   ```sh
   npm install
   ```

## Function Explanation

- **Fetching JWKS**: The function fetches the JSON Web Key Set (JWKS) from Auth0 to verify the JWT signature.
- **Token Verification**: It validates the JWT using `jsonwebtoken` and checks the `issuer` and `audience`.
- **Fetching User Profile**: The function retrieves the authenticated user's profile from Auth0's `/userinfo` endpoint.
- **Policy Generation**: A policy document is generated to allow or deny API access.

## Deployment

To deploy the Lambda function to AWS, you can use the AWS CLI or AWS SAM.

For AWS CLI:

```sh
zip -r lambda-authorizer.zip .
aws lambda update-function-code --function-name YourLambdaFunctionName --zip-file fileb://lambda-authorizer.zip
```

## Testing the Function

You can test the function locally by simulating an event:

```javascript
const event = {
  authorizationToken: "Bearer your-jwt-token",
  methodArn: "arn:aws:execute-api:region:account-id:api-id/stage/method/resource",
};

const { handler } = require("./index");

handler(event).then(console.log).catch(console.error);
```

## Notes

- Ensure that your API Gateway is configured to use this Lambda function as a custom authorizer.
- Make sure your Auth0 token is valid before testing.
- Check CloudWatch logs for debugging in case of authorization failures.

## License

This project is licensed under the MIT License.
