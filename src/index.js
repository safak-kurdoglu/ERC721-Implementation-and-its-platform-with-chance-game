const express = require("express");
const app = express();
const rp = require('request-promise');
const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:false}));
var cors = require('cors');
app.use(cors())
var Web3 = require("web3");
var web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:7545"));


var contract;
var NFTsInFight = [];
var OwnersInFight = [];
const NFTFightData = [];
var NFTFightIndex = 0;
var NFTOwners = [];
var NFTsOnSale = [];

var isMinted = [false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false];
var mintedNFTIndex = 0;
var isMintingFinished = false;


app.get("/get-datas", (req, res) => {
    res.send({
        NFTsOnSale: NFTsOnSale,
        isMintingFinished: isMintingFinished
    }); 
    
});

app.post("/update-sale", (req, res) => {
    const index = NFTsOnSale.findIndex(NFT => NFT.NFTId === req.body.NFTId);
    NFTsOnSale.splice(index, 1);
    res.send("It's ok");
});


app.post("/sell-NFT", (req, res) => {
    NFTId = req.body.NFTId;
    price = req.body.price;

    const requestPromise = [ 
        rp({
            //headers : {'Content-Type': 'application/json'},
            uri: 'http://localhost:3000/' + NFTId, 
            method: 'GET',
            json: true
        })
    ];
    Promise.all(requestPromise).then(NFTData => {
        NFTsOnSale.push({NFTId: NFTId,
                            name: NFTData[0].name,
                            power: NFTData[0].power,
                            URI: NFTData[0].image,
                            price : price
        });
        res.send("NFT added to auction successfully!");
    });
    
});


app.post("/create-contract", (req, res) => {
    contract = new web3.eth.Contract(req.body.abi, req.body.contractAddress);
    res.send("contract created successfully");
});


app.post("/send-NFTs-to-winner", (req, res) => {
    if(NFTFightData.length > NFTFightIndex){
        NFTIdF = NFTFightData[NFTFightIndex]["NFTIdF"];
        NFTIdS = NFTFightData[NFTFightIndex]["NFTIdS"];
        toAddress =  NFTFightData[NFTFightIndex]["winner"];
        contract.methods.sendNFTsToWinner(NFTIdF, NFTIdS, toAddress)
        .send({from: req.body.ownerAddress, gas: 3000000});

        NFTFightIndex++;
        const requestPromise = [ 
            rp({
                uri: 'http://localhost:3000/change-NFT-ownership',
                method: 'POST',
                body: {toAddress: toAddress,
                       tokenID: NFTIdF,
                       changeType: "send"},
                json: true
            }),
            rp({
                uri: 'http://localhost:3000/change-NFT-ownership',
                method: 'POST',
                body: {toAddress: toAddress,
                       tokenID: NFTIdS,
                       changeType: "send"},
                json: true
            })

        ];
        Promise.all(requestPromise)
        res.send("Reward are sent successfully.");

    }else
        res.send("There are no rewards waiting.");
});  

app.post("/check-NFT-ownership", (req, res) => {
    ownerData = NFTOwners.find((owner) => owner.ownerAddress === req.body.ownerAddress);  
    if(ownerData){
        ownership = ownerData.NFTs.find((NFTIndex) => NFTIndex === req.body.NFTId)
        if(typeof ownership !== 'undefined')
            res.send(true);
        else
            res.send(false);
    }else
        res.send(false);
});  

app.post("/NFT-fight", (req, res) => {
    NFTId = req.body.NFTId;
    ownerAddress = req.body.ownerAddress;
    NFTsInFight.push(NFTId);
    OwnersInFight.push(ownerAddress);


    if(NFTsInFight.length == 2){
        const requestPromises = [ 
            rp({
                //headers : {'Content-Type': 'application/json'},
                uri: 'http://localhost:3000/' + NFTsInFight[0], 
                method: 'GET',
                json: true
            }),
            rp({
                //headers : {'Content-Type': 'application/json'},
                uri: 'http://localhost:3000/' + NFTsInFight[1], 
                method: 'GET', 
                json: true
            })
        ];
    
        Promise.all(requestPromises).then(NFTData => {
            const powerFirst = NFTData[0].power;
            const powerSecond = NFTData[1].power;
            const randomNumber = Math.random();

            const marginF = Math.log(powerFirst);
            const marginS = Math.log(powerSecond);

            const probabilityF = marginF / (marginF + marginS);
            if(randomNumber < probabilityF){
                NFTFightData.push({ winner : OwnersInFight[0],
                                    NFTIdF : NFTsInFight[0],
                                    NFTIdS : NFTsInFight[1]
                })
                res.send(NFTData[0]);
            } else{
                NFTFightData.push({ winner : OwnersInFight[1],
                                    NFTIdF : NFTsInFight[0],
                                    NFTIdS : NFTsInFight[1]
                })
                res.send(NFTData[1]);
            }
            NFTsInFight = [];
            OwnersInFight = [];
        });


    }else{
        res.send(false);
    }
});

app.post("/is-NFT-minted", (req, res) => {
    NFTId = req.body.NFTId;
    if(isMinted[NFTId]){
        const requestPromise = [ 
            rp({
                //headers : {'Content-Type': 'application/json'},
                uri: 'http://localhost:3000/' + NFTId, 
                method: 'GET',
                json: true
            })
        ];
        Promise.all(requestPromise).then(NFTData => {
            res.send(NFTData[0]);
        });

    }else{
        res.send(false);
    }
});

app.post("/update-mint-status", (req, res) => {
    isMinted[mintedNFTIndex] = true;
    ownerAddress = req.body.ownerAddress;
    const ownerData = NFTOwners.find((owner) => owner.ownerAddress === ownerAddress);  
                     
    if(ownerData){
        ownerData.NFTs.push(mintedNFTIndex);
    }
    else{
        NFTOwners.push({
            ownerAddress : ownerAddress,
            NFTs : [mintedNFTIndex]
        });
    }

    const requestPromise = [ 
        rp({
            //headers : {'Content-Type': 'application/json'},
            uri: 'http://localhost:3000/change-NFT-ownership',
            method: 'POST',
            body: {toAddress: ownerAddress,
                   tokenID: mintedNFTIndex,
                   changeType: "send"},
            json: true
        })
    ];
    Promise.all(requestPromise)

    if(mintedNFTIndex === 49){
        isMintingFinished = true;
    }

    res.send({NFTIndex : mintedNFTIndex});
    mintedNFTIndex++;
    
});  

app.post("/change-NFT-ownership", (req, res) => {

    const changeType = req.body.changeType;

    if(changeType === "send"){
        const toData = NFTOwners.find((owner) => owner.ownerAddress === req.body.toAddress);
        if(toData){
            toData.NFTs.indexOf(req.body.tokenID) === -1 ? toData.NFTs.push(req.body.tokenID) : "";
            
        }
        else{
            NFTOwners.push({
                ownerAddress : req.body.toAddress,
                NFTs : [mintedNFTIndex]
            });
        }
    }
    else if(changeType === "take"){
        const fromData = NFTOwners.find((owner) => owner.ownerAddress === req.body.address);
        const NFTIndex = fromData.NFTs.findIndex((NFTId) => NFTId === req.body.tokenID);
        fromData.NFTs.splice(NFTIndex, 1);
    }
   res.send("ownership updated.")
});  

app.get("/0", (req, res) => {
    res.json({name: "char 1",
              image: "images/0.jpg",
              power: 66});
}); 

app.get("/1", (req, res) => {
    res.json({name: "char 2",
              image: "images/1.jpg",
              power: 73});
}); 

app.get("/2", (req, res) => {
    res.json({name: "char 3",
              image: "images/2.jpg",
              power: 80});
}); 

app.get("/3", (req, res) => {
    res.json({name: "char 4",
              image: "images/3.jpg",
              power: 87});
}); 

app.get("/4", (req, res) => {
    res.json({name: "char 5",
              image: "images/4.jpg",
              power: 94});
}); 

app.get("/5", (req, res) => {
    res.json({name: "char 6",
              image: "images/5.jpg",
              power: 51});
}); 

app.get("/6", (req, res) => {
    res.json({name: "char 7",
              image: "images/6.jpg",
              power: 58});
}); 

app.get("/7", (req, res) => {
    res.json({name: "char 8",
              image: "images/7.jpg",
              power: 65});
}); 

app.get("/8", (req, res) => {
    res.json({name: "char 9",
              image: "images/8.jpg",
              power: 72});
}); 

app.get("/9", (req, res) => {
    res.json({name: "char 10",
              image: "images/9.jpg",
              power: 79});
}); 

app.get("/10", (req, res) => {
    res.json({name: "char 11",
              image: "images/10.jpg",
              power: 86});
}); 

app.get("/11", (req, res) => {
    res.json({name: "char 12",
              image: "images/11.jpg",
              power: 93});
}); 

app.get("/12", (req, res) => {
    res.json({name: "char 13",
              image: "images/12.jpg",
              power: 50});
}); 

app.get("/13", (req, res) => {
    res.json({name: "char 14",
              image: "images/13.jpg",
              power: 57});
}); 

app.get("/14", (req, res) => {
    res.json({name: "char 15",
              image: "images/14.jpg",
              power: 64});
}); 

app.get("/15", (req, res) => {
    res.json({name: "char 16",
              image: "images/15.jpg",
              power: 71});
}); 

app.get("/16", (req, res) => {
    res.json({name: "char 17",
              image: "images/16.jpg",
              power: 78});
}); 

app.get("/17", (req, res) => {
    res.json({name: "char 18",
              image: "images/17.jpg",
              power: 85});
}); 

app.get("/18", (req, res) => {
    res.json({name: "char 19",
              image: "images/18.jpg",
              power: 92});
}); 

app.get("/19", (req, res) => {
    res.json({name: "char 20",
              image: "images/19.jpg",
              power: 99});
}); 

app.get("/20", (req, res) => {
    res.json({name: "char 21",
              image: "images/20.jpg",
              power: 56});
}); 

app.get("/21", (req, res) => {
    res.json({name: "char 22",
              image: "images/21.jpg",
              power: 63});
}); 

app.get("/22", (req, res) => {
    res.json({name: "char 23",
              image: "images/22.jpg",
              power: 70});
}); 

app.get("/23", (req, res) => {
    res.json({name: "char 24",
              image: "images/23.jpg",
              power: 77});
}); 

app.get("/24", (req, res) => {
    res.json({name: "char 25",
              image: "images/24.jpg",
              power: 84});
}); 

app.get("/25", (req, res) => {
    res.json({name: "char 26",
              image: "images/25.jpg",
              power: 91});
}); 

app.get("/26", (req, res) => {
    res.json({name: "char 27",
              image: "images/26.jpg",
              power: 98});
}); 

app.get("/27", (req, res) => {
    res.json({name: "char 28",
              image: "images/27.jpg",
              power: 55});
}); 

app.get("/28", (req, res) => {
    res.json({name: "char 29",
              image: "images/28.jpg",
              power: 62});
}); 

app.get("/29", (req, res) => {
    res.json({name: "char 30",
              image: "images/29.jpg",
              power: 69});
}); 

app.get("/30", (req, res) => {
    res.json({name: "char 31",
              image: "images/30.jpg",
              power: 76});
}); 

app.get("/31", (req, res) => {
    res.json({name: "char 32",
              image: "images/31.jpg",
              power: 83});
}); 

app.get("/32", (req, res) => {
    res.json({name: "char 33",
              image: "images/32.jpg",
              power: 90});
}); 

app.get("/33", (req, res) => {
    res.json({name: "char 34",
              image: "images/33.jpg",
              power: 97});
}); 

app.get("/34", (req, res) => {
    res.json({name: "char 35",
              image: "images/34.jpg",
              power: 54});
}); 

app.get("/35", (req, res) => {
    res.json({name: "char 36",
              image: "images/35.jpg",
              power: 61});
}); 

app.get("/36", (req, res) => {
    res.json({name: "char 37",
              image: "images/36.jpg",
              power: 68});
}); 

app.get("/37", (req, res) => {
    res.json({name: "char 38",
              image: "images/37.jpg",
              power: 75});
}); 

app.get("/38", (req, res) => {
    res.json({name: "char 39",
              image: "images/38.jpg",
              power: 82});
}); 

app.get("/39", (req, res) => {
    res.json({name: "char 40",
              image: "images/39.jpg",
              power: 89});
}); 

app.get("/40", (req, res) => {
    res.json({name: "char 41",
              image: "images/40.jpg",
              power: 96});
}); 

app.get("/41", (req, res) => {
    res.json({name: "char 42",
              image: "images/41.jpg",
              power: 53});
}); 

app.get("/42", (req, res) => {
    res.json({name: "char 43",
              image: "images/42.jpg",
              power: 60});
}); 

app.get("/43", (req, res) => {
    res.json({name: "char 44",
              image: "images/43.jpg",
              power: 67});
}); 

app.get("/44", (req, res) => {
    res.json({name: "char 45",
              image: "images/44.jpg",
              power: 74});
}); 

app.get("/45", (req, res) => {
    res.json({name: "char 46",
              image: "images/45.jpg",
              power: 81});
}); 

app.get("/46", (req, res) => {
    res.json({name: "char 47",
              image: "images/46.jpg",
              power: 88});
}); 

app.get("/47", (req, res) => {
    res.json({name: "char 48",
              image: "images/47.jpg",
              power: 95});
}); 

app.get("/48", (req, res) => {
    res.json({name: "char 49",
              image: "images/48.jpg",
              power: 52});
}); 

app.get("/49", (req, res) => {
    res.json({name: "char 50",
              image: "images/49.jpg",
              power: 59});
}); 


app.listen(3000, () => {
  console.log("Application started and Listening on port 3000");
});

