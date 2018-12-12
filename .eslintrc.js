module.exports = {
    "env": {
        "es6": true,
        "node": true,
        "mocha": true
    },
    "parserOptions": {
      "ecmaVersion": 2017
    },
    "extends": "eslint:recommended",
    "rules": {
        "indent": [
            "error",
            "tab"
        ],
        "linebreak-style": [
            "error",
            "unix"
        ],
        "quotes": [
            "error",
            "single"
        ],
        "semi": [
            "error",
            "always"
        ],
        "no-console": [
          "error", {
            "allow": [
              "warn",
              "error"
            ]
          }
        ],
        "no-unused-vars": [
          "error", {
            "argsIgnorePattern": "_ignoreUnused$"
          }
        ]
    }
};
