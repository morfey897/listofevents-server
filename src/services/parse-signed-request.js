const crypto = require('crypto');

function facebookSignedRequest(signed_request, secret) {
  signed_request = signed_request.split('.');
  var encoded_sig = signed_request[0];
  var payload = signed_request[1];

  var data = JSON.parse(Buffer.from(payload, 'base64').toString());

  if (data.algorithm.toUpperCase() !== 'HMAC-SHA256')
    return null;

  var hmac = crypto.createHmac('sha256', secret);
  var encoded_payload = hmac.update(payload).digest('base64')
    .replace(/\//g, '_').replace(/\+/g, '-').replace(/={1,2}$/, '');

  if (encoded_sig !== encoded_payload)
    return null;

  return data;
};

module.exports = {
  facebookSignedRequest
}