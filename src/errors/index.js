const ERROR_WRONG = {
  errorCode: 101,
  error: "Something went wrong"
};
const ERROR_INCORRECT_CODE = {
  errorCode: 102,
  error: "The auth code is incorrect"
};
const ERROR_USER_EXIST = {
  errorCode: 103,
  error: "User is exist"
};
const ERROR_USER_NOT_EXIST = {
  errorCode: 104,
  error: "User isn't exist"
};
const ERROR_INCORRECT_USERNAME = {
  errorCode: 105,
  error: "The username is incorrect"
};
const ERROR_EXIST_EMAIL = {
  errorCode: 106,
  error: "User is exist with this email",
};
const ERROR_EXIST_PHONE = {
  errorCode: 107,
  error: "User is exist with this phone",
};

const ERROR_ACCESS_DENIED = {
  errorCode: 108,
  error: "Access denied"
};

const ERROR_CATEGORY_NOT_EXIST = {
  errorCode: 109,
  error: "Category isn't exist"
};
const ERROR_CITY_NOT_EXIST = {
  errorCode: 110,
  error: "City isn't exist"
};

const ERROR_EMPTY = {
  errorCode: 901,
  error: "Fields is empty"
};

const ERROR_INCORRECT_PASSWORD = {
  errorCode: 902,
  error: "The password is incorrect"
};
const ERROR_INCORRECT_URL = {
  errorCode: 903,
  error: "The URL is incorrect"
};
const ERROR_INCORRECT_ID = {
  errorCode: 904,
  error: "The ID is incorrect"
};

const ERRORCODES_MAP = {
  ERROR_WRONG,
  ERROR_INCORRECT_CODE,
  ERROR_USER_EXIST,
  ERROR_USER_NOT_EXIST,
  ERROR_EXIST_EMAIL,
  ERROR_EXIST_PHONE,
  ERROR_ACCESS_DENIED,
  ERROR_EMPTY,
  ERROR_INCORRECT_PASSWORD,
  ERROR_INCORRECT_URL,
  ERROR_INCORRECT_ID,
  ERROR_INCORRECT_USERNAME,
  ERROR_CATEGORY_NOT_EXIST,
  ERROR_CITY_NOT_EXIST
};

const ERRORCODES = Object.keys(ERRORCODES_MAP).reduce((prev, cur) => {
  prev[cur] = cur;
  return prev;
}, {});

function getError(message) {
  return ERRORCODES_MAP[message] || ERROR_WRONG;
}

module.exports = {
  getError,
  ERRORCODES
}