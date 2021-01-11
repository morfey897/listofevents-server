const axios = require('axios').default;

const axiosInstance = axios.create({
  baseURL: process.env.SMS_HOST,
  headers: {
    Authorization: `Bearer ${process.env.SMS_AUTH}`
  }
});

async function sendSMS({ from, to, message }) {
  const { data } = await axiosInstance.post(process.env.SMS_METHOD, {
    phone: Array.isArray(to) ? to : [to],
    message: message,
    src_addr: from || process.env.SMS_NAME
  });
  return data.success_request.info;
}

module.exports = {
  sendSMS
}