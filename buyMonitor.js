'use strict';

const fs = require('fs');

let rawdata = fs.readFileSync('market-price.json');
let flux = JSON.parse(rawdata);

let values = flux.values
let buyArray = [];

let commission = 0; //total des commissions
let lastDayPrice = 0;
let dayCount = 0;
let securityBuy = false;
let	btc = 0;
let nbrAchat = 0;
let nbrSell = 0;
let buyStreaks = 0;

//PARAMS BE CAREFULL
let maxMoney = 10000;
let tradeRatio = 0.001;
let sellingRatio = 1.3; // vente des que position take + X% // si vous augmenter le ratio de vente augmenter le capital supp afin d'avoir plus de position ouverte en meme 
let commissionRatio = 0.01; //estimation des frais de transactions (market + blockchain) TODO connect blockchain live fees
let capLog = true;	//activation de la capitalisation dynamique
let buyStreaksLimit = 10; 
let balance = maxMoney;
let dayMoney = maxMoney * tradeRatio ; // 1% de trade sur le max balance (capital non evolutif)
if(capLog === true){
	dayMoney = balance * tradeRatio ; // 1% de trade sur le current balance (capital evolutif, plus risqué)
}

for(let value of values){

	if(capLog === true){
		dayMoney = balance * tradeRatio; // 1% de trade sur le current balance (capital evolutif, plus risqué)
		if(dayMoney < maxMoney * tradeRatio){
			dayMoney = maxMoney * tradeRatio;
		}
	}
	let date = new Date(value.x * 1000);
	let fDate = date.toLocaleDateString('fr-FR');
	let price = value.y;

	// action de vente
	if(buyArray.length > 0){
		buyArray.forEach(function(historical, index, object){

			//produit en croix avec le prix actuelle 
			
			// historicalVolume = ( 1 * dayMoney) / historicalPrice;
			// dayMoney = (historicalPrice * historicalVolume) / 1;

			let historicalPrice = historical.hPrice;
			let historicalVolume = historical.hVolume;			 
			let sellValue = (price * historicalVolume);
			
			// SellingProcess			
			if((historicalPrice * sellingRatio) < price){
 
				object.splice(index, 1);
				balance = balance + sellValue;
				commission = commission + (sellValue * commissionRatio);
				nbrSell++;
				buyStreaks = 0;
				console.log('sell ' + historicalVolume + " BTC at " + price + " for " + sellValue);
			
			}
		})
	} 
	
	let moneyTemp = balance - dayMoney;  

	//BuyingProcess
	if(moneyTemp > 1){

		let dayVolume = dayMoney/price;
		let storage = {'hVolume': dayVolume, 'hPrice': price, 'hCost': dayMoney }
		buyArray.push(storage);
		balance = balance - dayMoney;
		commission = commission + (dayMoney * commissionRatio);
		nbrAchat++;
		buyStreaks++;
		console.log("buy " + dayVolume + " BTC at " + price + " for " + dayMoney);
	}
	dayCount++;
	lastDayPrice = price;
}

let btcBalance = 0;
let euroBalance = 0;

buyArray.forEach(function(historical, index, object){
	btcBalance = btcBalance + historical.hVolume
});

let price = values[values.length - 1].y;
console.log("nbr d'années " + values.length/365);
console.log("BTC actual : " + price);
console.log("€ balance : " + balance);
console.log("BTC balance : " + btcBalance);
console.log("BTC balance value : " + (btcBalance * price));
console.log("open postion : " + buyArray.length);
console.log("nbr achat : " + nbrAchat);
console.log("nbr vente : " + nbrSell);
console.log("commission : " + commission);
console.log("Total benef : " + (balance - maxMoney - commission));
