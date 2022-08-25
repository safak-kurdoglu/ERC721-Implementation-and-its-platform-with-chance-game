
module.exports = {

  networks: {
    development: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "*" // Match any network id
    },
    develop: {
      port: 8545
    }
  },
  mocha: {
    // timeout: 100000
  },


  compilers: {
    solc: {
      version: "^0.8.0",      // Fetch exact version from solc-bin (default: truffle's version)

    }
  },

  // db: {
  //   enabled: false,
  //   host: "127.0.0.1",
  //   adapter: {
  //     name: "sqlite",
  //     settings: {
  //       directory: ".db"
  //     }
  //   }
  // }
 
};
