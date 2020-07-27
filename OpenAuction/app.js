// The object 'Contracts' will be injected here, which contains all data for all contracts, keyed on contract name:
// Contracts['SimpleAuction'] = {
//  abi: [],
//  address: "0x..",
//  endpoint: "http://...."
// }

// Creates an instance of the smart contract, passing it as a property,
// which allows web3.js to interact with it.
function SimpleAuction(Contract) {
    this.web3 = null;
    this.instance = null;
    this.Contract = Contract;
}

// Initializes the `SimpleAuction` object and creates an instance of the web3.js library,
SimpleAuction.prototype.init = function() {
    // Creates a new Web3 instance using a provider
    // Learn more: https://web3js.readthedocs.io/en/v1.2.0/web3.html
    this.web3 = new Web3(
        (window.web3 && window.web3.currentProvider) ||
            new Web3.providers.HttpProvider(this.Contract.endpoint)
    );

    // Creates the contract interface using the web3.js contract object
    // Learn more: https://web3js.readthedocs.io/en/v1.2.0/web3-eth-contract.html#new-contract
    var contract_interface = this.web3.eth.contract(this.Contract.abi);
    console.log(contract_interface);
    // Defines the address of the contract instance
    this.instance = this.Contract.address
        ? contract_interface.at(this.Contract.address)
        : { startAuction: () => {} };
};


// Returns the highest bidder (from the contract)
SimpleAuction.prototype.getHighestBidder = function(cb) {
    this.instance.highestBidder(function(error, highestBidder) {
        if (error) {
            console.log(error);
        } else {
            console.log(highestBidder);
            $("#msghbidder").text(highestBidder);
        }
    });
};

// Returns the highest bid (from the contract)
SimpleAuction.prototype.getHighestBid = function(cb) {
    this.instance.highestBid(function(error, highestBid) {
        if (error) {
            console.log(error);
        } else {
            console.log(highestBid);
            $("#msghbid").text(highestBid);
        }
    });
};

// Submit bid details, triggered by the "Bid" button
SimpleAuction.prototype.startAuction = function() {
    console.log("inside startAuction");
    var that = this;
    console.log("inside startAuction");
    // Gets form input values
    var address = $("#enter-address").val();
    var amount = $("#enter-amount").val();
    console.log(amount);
    console.log(address);

    // Validates address using utility function
    if (!isValidAddress(address)) {
        console.log("Invalid address");
        return;
    }
     
    // Validate amount using utility function
    if (!isValidAmount(amount)) {
        console.log("Invalid amount");
        return;
    }
    
    
    // Calls the public `bid` function from the smart contract
    this.instance.bid(
        address,
        amount,
         {  
            from: window.web3.eth.accounts[0],
            gas: 100000,
            gasPrice: 100000,
            gasLimit: 100000
        },
       
        function(error, txHash) {
            if (error) {
                console.log(error);
            }
            // If success, wait for confirmation of transaction,
            // then clear form values
            else {
                that.waitForReceipt(txHash, function(receipt) {
                    if (receipt.status) {
                        $("#enter-address").val("");
                        $("#enter-amount").val("");
                       
                    } else {
                        console.log("error");
                    }
                });
            }
        }
    );
};

// Waits for receipt of transaction
SimpleAuction.prototype.waitForReceipt = function(hash, cb) {
    var that = this;

    // Checks for transaction receipt using web3.js library method
    this.web3.eth.getTransactionReceipt(hash, function(err, receipt) {
        if (err) {
            error(err);
        }
        if (receipt !== null) {
            // Transaction went through
            if (cb) {
                cb(receipt);
            }
        } else {
            // Try again in 2 second
            window.setTimeout(function() {
                that.waitForReceipt(hash, cb);
            }, 2000);
        }
    });
};

// Binds functions to the buttons defined in app.html
SimpleAuction.prototype.bindButtons = function() {
    var that = this;
     console.log("inside bindButtons");
    $(document).on("click", "#button-bid", function() {
        that.startAuction();
    });

    $(document).on("click", "#button-hbidder", function() {
        that.getHighestBidder();
    });

    $(document).on("click", "#button-hbid", function() {
        that.getHighestBid();
    });
};

// Removes the welcome content, and display the main content.
// Called once a contract has been deployed
SimpleAuction.prototype.updateDisplayContent = function() {
    this.hideWelcomeContent();
    this.showMainContent();
};

// Checks if the contract has been deployed.
// A contract will not have its address set until it has been deployed
SimpleAuction.prototype.hasContractDeployed = function() {
    return this.instance && this.instance.address;
};

SimpleAuction.prototype.hideWelcomeContent = function() {
    $("#welcome-container").addClass("hidden");
};

SimpleAuction.prototype.showMainContent = function() {
    $("#main-container").removeClass("hidden");
};

// Creates the instance of the `SimpleAuction` object
SimpleAuction.prototype.onReady = function() {
    this.init();
    if (this.hasContractDeployed()) {
        this.updateDisplayContent();
        this.bindButtons();
    }
};

// Checks if it has the basic requirements of an address
function isValidAddress(address) {
    return /^(0x)?[0-9a-f]{40}$/i.test(address);
}

// Basic validation of amount. Bigger than 0 and typeof number
function isValidAmount(amount) {
    return amount > 0 && typeof Number(amount) == "number";
}

if (typeof Contracts === "undefined") var Contracts = { SimpleAuction: { abi: [] } };
var auction = new SimpleAuction(Contracts["SimpleAuction"]);

$(document).ready(function() {
    auction.onReady();
});
