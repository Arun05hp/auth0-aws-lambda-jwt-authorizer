require('dotenv').config({ silent: true });

const jwt = require("jsonwebtoken");
const jwksClient = require("jwks-rsa");

const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN;
const AUDIENCE = process.env.AUDIENCE;
const ISSUER =`https://${AUTH0_DOMAIN}/`

const client = jwksClient({
  cache: true,
  rateLimit: true,
  jwksRequestsPerMinute: 10,
  jwksUri: `${ISSUER}.well-known/jwks.json`
});

const getKey = (header, callback) => {
  client.getSigningKey(header.kid, (err, key) => {
      if (err) {
          console.error("Error getting signing key:", err);
          return callback(err, null);
      }
      const signingKey = key.publicKey || key.rsaPublicKey;
      callback(null, signingKey);
  });
};

module.exports.handler = async function (event) {
  const token = event.authorizationToken?.replace("Bearer ", "");

  if (!token) {
    return generatePolicy("user", "Deny", event.methodArn);
  }

  try {

    const decoded = await new Promise((resolve, reject) => {
      jwt.verify(token, getKey, {
          algorithms: ["RS256"],
          audience: AUDIENCE,
          issuer:ISSUER,
      }, (err, decoded) => {
          if (err) reject(err);
          else resolve(decoded);
      });
  });

    const userProfile = await fetch(`${ISSUER}userinfo`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }).then((res) => res.json());


    return generatePolicy(decoded.sub, "Allow", event.methodArn, userProfile);
  } catch (error) {

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
