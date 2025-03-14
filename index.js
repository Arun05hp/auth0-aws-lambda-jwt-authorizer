require('dotenv').config({ silent: true });

const jwt = require("jsonwebtoken");
const axios = require("axios");

const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN;
const AUDIENCE = process.env.AUDIENCE;

module.exports.handler = async function (event) {
  const token = event.authorizationToken?.replace("Bearer ", "");
  console.log({token});
  if (!token) {
    return generatePolicy("user", "Deny", event.methodArn);
  }

  try {
    // Fetch Auth0 JWKS keys
    const jwks = await axios.get(`https://${AUTH0_DOMAIN}/.well-known/jwks.json`);
    const rsaKey = jwks.data.keys[0];

    // Verify JWT
    const decoded = jwt.verify(token, rsaKey, {
      algorithms: ["RS256"],
      audience: AUDIENCE,
      issuer: `https://${AUTH0_DOMAIN}/`,
    });

    console.log("User Details:", decoded);

    return generatePolicy(decoded.sub, "Allow", event.methodArn, decoded);
  } catch (error) {
    console.error("Auth failed:", error);
    return generatePolicy("user", "Deny", event.methodArn);
  }
};

function generatePolicy(principalId, effect, resource, userDetails = {}) {
  return {
    principalId: principalId,
    policyDocument: {
      Version: "2012-10-17",
      Statement: [{ Action: "execute-api:Invoke", Effect: effect, Resource: resource }],
    },
    context: userDetails,
  };
}
