
const { createBrowserFetcher } = require('puppeteer');

puppeteer = require('puppeteer')



async function retrieveItemInfo(url) {
  var datetime = new Date();
  try{
  let time = `Last Updated: ${datetime.toLocaleDateString()} at ${datetime.toLocaleTimeString()}`;
  const browser = await puppeteer.launch({ args: ['--no-sandbox']});
  const tab = await browser.newPage();
  await tab.goto(url)
  let status = await tab.evaluate(() => {
    return `${document.querySelector('div.product-inventory').textContent.trim()}`;
  });
  let price = await tab.evaluate(() => {
    return `${document.querySelector('div[class="product-pane"] > div[class="product-price"] > ul[class="price"] > li.price-current').textContent}`;
  });
  let image = await tab.evaluate(() => {
    return `${document.querySelector('div[class="swiper-zoom-container"] >img').src}`;
  });

  let productName = await tab.evaluate(() => {
    return `${document.querySelector('h1.product-title').textContent.trim()}`;
  });


  await browser.close();
  return {
    productName: productName,
    status: status,
    price: price,
    imgItemUrl: image,
    time: time,
    url: url
  }


  
  }
  catch(error){
    return {
      status: "Error"
    }
  }

}

function output(data){
  let output = "";
  if ((data.status == "OUT OF STOCK")) {
    console.log(`Status: ${data.status}, Price: ${data.price}, ${data.time}  `);
    output = `Status: ${data.status}, Price: ${data.price}, ${data.time}`;
  }
  else {
    console.log(`Status: AVAILABLE, Price: ${data.price}, ${data.time}`);
    output = `Status: AVAILABLE, Price: ${data.price}, ${data.time}`;
  }
}


module.exports = {
  
  retrieveItemInfo: retrieveItemInfo,
  output:output
 
}



