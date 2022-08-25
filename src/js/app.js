App = {
  web3Provider: null,
  contracts: {},
  NFTsOnSale : [],
  isMintingFinished : false,

  getData: async function() {
    //load datas.
    await axios.get('http://localhost:3000/get-datas').then(resp => {
      App.NFTsOnSale = resp.data.NFTsOnSale,
      App.isMintingFinished = resp.data.isMintingFinished
    });

    return await App.init();
  },


  init: async function() {

    if(App.isMintingFinished){
      $(".btn-mint-NFT")[0].disabled = true;
    }

    var itemsRow = $('#NFT-row');
    var itemTemplate = $('#NFT-template');

      for (i = 0; i < App.NFTsOnSale.length; i ++) {
        itemTemplate.find('.panel-title').text(App.NFTsOnSale[i].name);
        itemTemplate.find('img').attr('src', App.NFTsOnSale[i].URI);
        itemTemplate.find('.btn-buy-NFT').attr('data-id', i);
        itemTemplate.find('.NFT-price').text(App.NFTsOnSale[i].price);
        itemTemplate.find('.NFT-power').text(App.NFTsOnSale[i].power);
        itemTemplate.find('.on-sale-NFT-id').text(App.NFTsOnSale[i].NFTId);

        itemsRow.append(itemTemplate.html());
      }

    return await App.initWeb3();
  },


  initWeb3: async function() {
    //Modern dApp browsers like firefox, chrome, brave have window.ethereum object for provider.
    if (window.ethereum) {
      App.web3Provider = window.ethereum;
      try {
        await window.ethereum.request({ method: "eth_requestAccounts" });
      } 
      catch (error) {
        console.error("User denied account access");
      }
    }
    // This is for legacy dapp browsers, if modern dapp browser is not being used.
    else if(window.web3) {
      App.web3Provider = window.web3.currentProvider;
    }

    web3 = new Web3(App.web3Provider);

    return App.initContract();
  },


  initContract: async function() {
    $.getJSON('build/contracts/MyToken.json', function(data) {
      // Get the necessary contract artifact file and instantiate it with @truffle/contract
      var MyTokenArtifact = data;
      App.contracts.MyToken = TruffleContract(MyTokenArtifact);
    
      // Set the provider for our contract
      App.contracts.MyToken.setProvider(App.web3Provider);
    
    });
    return App.bindEvents();
  },


  bindEvents: function() {
    $(document).on('click', '.btn-mint-NFT', App.handleMint);
    $(document).on('click', '.btn-show-NFT', App.handleShow);
    $(document).on('click', '.btn-fight-NFT', App.handleFight);
    $(document).on('click', '.btn-sell-NFT', App.handleSell);
    $(document).on('click', '.btn-buy-NFT', App.handleBuy);
    $(document).on('click', '.btn-transfer-NFT', App.handleTransfer);
    $(document).on('click', '.btn-cancel-NFT-sale', App.handleCancelSale);
  },
   
  handleCancelSale : function(event) {
    event.preventDefault();

    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }
      var account = accounts[0]; 

      App.contracts.MyToken.deployed().then(function(instance) {
        MyTokenInstance = instance;

        saleId = parseInt($(event.target).data('id'));
        NFTId = parseInt($(".on-sale-NFT-id")[saleId].innerHTML);

        return MyTokenInstance.cancelSale(NFTId, {from: account});
      }).then(function(){

        alert("You canceled NFT sale successfully!");

        axios.post('http://localhost:3000/update-sale',{
          NFTId: NFTId
        });

        axios.post('http://localhost:3000/change-NFT-ownership',{
          toAddress: account,
          tokenID: NFTId,
          changeType: "send"
        });
        
        return;
        
      }).catch(function(err) {
         alert("It's not yours NFT");
      });
    });
  },

  handleTransfer: function(event) {
    event.preventDefault();

    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }
      var account = accounts[0]; 

      App.contracts.MyToken.deployed().then(function(instance) {
        MyTokenInstance = instance;

        toAddress = $(".address")[0].value;
        NFTId = parseInt($(".NFT-id")[1].value);

        return MyTokenInstance.transfer(toAddress, NFTId, {from: account});
      }).then(function(){

        alert("You transfered NFT successfully!");

        axios.post('http://localhost:3000/change-NFT-ownership',{
          address: account,
          tokenID: NFTId,
          changeType: "take"
        });

        axios.post('http://localhost:3000/change-NFT-ownership',{
          toAddress: toAddress,
          tokenID: NFTId,
          changeType: "send"
        });

        return;
        
      }).catch(function(err) {
         alert("It's not yours NFT or insufficient gas amount");
      });
    });
  },


  handleBuy: function(event) {
    event.preventDefault();
    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }
      var account = accounts[0]; 
   
      App.contracts.MyToken.deployed().then(function(instance) {

        MyTokenInstance = instance;
        saleId = parseInt($(event.target).data('id'));
        price = parseInt($(".NFT-price")[saleId].innerHTML);
        NFTId = parseInt($(".on-sale-NFT-id")[saleId].innerHTML);

        return MyTokenInstance.finishSale(NFTId,{from: account, value: price});
      }).then(function() {

        alert("You bought NFT successfully!");

        axios.post('http://localhost:3000/update-sale',{
          NFTId: NFTId
        });
 
        axios.post('http://localhost:3000/change-NFT-ownership',{
          toAddress: account,
          tokenID: NFTId,
          changeType: "send"
        });

        return;

      }).catch(function(err) {
        alert("Buying is not successfull.");
      });
    });
  },


  handleSell: function(event) {
    event.preventDefault();

    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }

      var account = accounts[0]; 
      const NFTId = parseInt($(".NFT-id")[3].value);
      const price = parseInt($(".price")[0].value);

      App.contracts.MyToken.deployed().then(function(instance) {
        MyTokenInstance = instance;
        
        return MyTokenInstance.startSale(NFTId, price, {from: account})
        .then(function(){

          alert("Your NFT is now on sale.");

          axios.post('http://localhost:3000/change-NFT-ownership',{
            address: account,
            tokenID: NFTId,
            changeType: "take"
          });

          axios.post('http://localhost:3000/sell-NFT',{
            NFTId: NFTId,
            price: price,
            address: account
          });

          return;
          
        }).catch(function(err) {
          alert("It's not yours NFT");
        });
      
      });
    });
  },  


  handleFight: function(event) {
    event.preventDefault();

    const NFTId = parseInt($(".NFT-id")[2].value);
    if(NFTId < 0 || NFTId > 49){
      alert("NFT Ids are between 0 and 49");
      return;

    }else{
      axios.post('http://localhost:3000/is-NFT-minted',{
        NFTId: NFTId
      }).then(function (mintedOrNot) {
        if(!mintedOrNot.data){
          alert("This nft is not minted yet"); 
          return;

        }else{
          web3.eth.getAccounts(function(error, accounts) {
            if (error) {
              console.log(error);
            }
            var account = accounts[0]; 
            App.contracts.MyToken.deployed().then(function(instance) {
              MyTokenInstance = instance;
              
              return MyTokenInstance.takeNFT(NFTId,{from: account, value: 100000000000000000})
              .then(function(){

                axios.post('http://localhost:3000/change-NFT-ownership',{
                  address: account,
                  tokenID: NFTId,
                  changeType: "take"
                });      

                axios.post('http://localhost:3000/NFT-fight',{
                  NFTId: NFTId,
                  ownerAddress: account
                }).then(function(NFTData) {
                  if(!NFTData.data){
                    alert("Your NFT is waiting opponent!");
                    return;

                  }else{
                    $('#winnerH').attr('style', "display:block;");
                    $('#panel-fight-NFT').attr('style', "display:block;");
                    $('#fight-NFT-image').attr("src",NFTData.data.image);
                    console.log(NFTData.data.image);
                    $('.NFT-name')[1].innerHTML = "Name : " + NFTData.data.name;
                    $('.NFT-power')[1].innerHTML = "Power : " + NFTData.data.power;    
                    return;    
                  }
                })
              }).catch(function(err) {
                alert("It's not yours NFT or insufficient gas amount");
                return;
              });
            });
          });
        }
      });
    }
  },  


  handleShow: function(event) {
    event.preventDefault();
    
    NFTId = parseInt($(".NFT-id")[0].value);

    if(NFTId < 0 || NFTId > 49){
      alert("NFT Ids are between 0 and 49");
      $('#panel-show-NFT').attr('style', "display:none;");
      return;

    }else{
      axios.post('http://localhost:3000/is-NFT-minted',{
        NFTId: NFTId
      }).then(function (NFTData) {
        
        if(!NFTData.data){
          alert("This nft is not minted yet"); 
          $('#panel-show-NFT').attr('style', "display:none;");
          return;

        }else{
          $('#panel-show-NFT').attr('style', "display:block;");
          $('#show-NFT-image').attr("src",NFTData.data.image);
          $('.NFT-name')[0].innerHTML = "Name : " + NFTData.data.name;
          $('.NFT-power')[0].innerHTML = "Power : " + NFTData.data.power;
          return;
        }
      });
    }
  },


  handleMint: function(event) {
    event.preventDefault();

    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }
    
      var account = accounts[0]; 
      App.contracts.MyToken.deployed().then(function(instance) {
        
        MyTokenInstance = instance;
        MyTokenInstance.mint({from: account}).then(function(resp) {

          axios.post('http://localhost:3000/update-mint-status',{
            ownerAddress : account
          }).then(function(NFTIndex) {

              alert("NFT with ID: " + NFTIndex.data.NFTIndex + " is minted successfully!");

              axios.post('http://localhost:3000/change-NFT-ownership',{
                toAddress: account,
                tokenID: NFTIndex.data.NFTIndex,
                changeType: "send"
              });

              return;
          })
          
        }).catch(function(err) {
          alert("NFT is not minted.");
          return;
       });
      });
    });
  }
}


$(function() {
  $(window).load(function() {
    App.getData();
  });
});