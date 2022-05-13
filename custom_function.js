const json2csv = require("json2csv").Parser;
const fs = require("fs");
const csv = require('csv-parser');
const execSync = require('child_process').execSync;

function logger(status, message) {
  global.mainwin.webContents.send("logger", { status: status, message: message });
}

async function click_xpath(page, selector, index = 0) {
  const elements = await page.$x(`${selector}`);
  if (elements.length != 0) {
    await elements[index].click();
  }
}

async function click_multiple_same_selector(page, selector) {
  const elements = await page.$$(`${selector}`);
  await myForEach(elements, async (elem, index, arr) => {
    await elem.click();
  }, elements)
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function autoScroll(page) {

  await page.evaluate(async () => {
    await new Promise((resolve, reject) => {
      var totalHeight = 0;
      var distance = 100;
      var timer = setInterval(() => {
        var scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });
  });
}


function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}


async function myForEach(arr, myCallBack, myString) {

  for (let i = 0; i < arr.length; i++) {

    await myCallBack(arr[i], index = i, arr, myString, () => {


    })

  }
}

async function get_data(page, selector, attr = 'innerText') {
  let arr = [];
  while (1) {
    try {
      if (selector.startsWith('//')) {
        await sleep(1000);
        arr = await Promise.all((await page.$x(`${selector}`)).map(async item => await (await item.getProperty(`${attr}`)).jsonValue()));
        // await console.log(arr);
        return arr;

      } else {
        await console.log("Enter a Wrong Xpath Selector");

      }
      break;
    } catch (e) {
      await sleep(1500);
    }
  }
}

async function read_dir(path) {
  let file_name_arr = [];

  await fs.readdir(`${path}`, async (err, files) => {

    await myForEach(files, async (file, index, arr) => {
      let file_path = path + '/' + file;
      await file_name_arr.push(file_path);

    }, files);
  });

  return file_name_arr;
}

async function get_data_iframe(page, selector) {
  const iframeParagraph = await page.evaluate(() => {

    const iframe = document.getElementById("iframeResult");

    // grab iframe's document object
    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;

    const iframeP = iframeDoc.getElementById(selector);

    return iframeP.innerHTML;
  });

  return iframeParagraph;
}

async function check_page_available(page, selector) {

  let check_page_rechaptcha = await Promise.all((await page.$x(`${selector}`)).map(async item => await (await item.getProperty('href')).jsonValue()));
  if (check_page_rechaptcha.length != 0) {
    return true;
  } else {

    return false;
  }

}

async function joinObjects() {
  console.log('rony start')
  var idMap = {};
  await console.log(arguments);
  // Iterate over arguments
  for (var i = 0; i < arguments.length; i++) {
    // Iterate over individual argument arrays (aka json1, json2)
    for (var j = 0; j < arguments[i].length; j++) {
      var currentID = await arguments[i][j]['CityName'];
      if (!idMap[currentID]) {
        idMap[currentID] = {};
      }
      // Iterate over properties of objects in arrays (aka id, name, etc.)
      for (key in arguments[i][j]) {
        idMap[currentID][key] = await arguments[i][j][key];
      }
    }
  }

  await console.log(idMap);
  // push properties of idMap into an array
  var newArray = [];
  for (property in idMap) {
    await newArray.push(idMap[property]);
  }

  return newArray;
}

function pad2(n) {
  return (n < 10 ? '0' : '') + n;
}

async function get_date() {
  var date = new Date();
  var month = pad2(date.getMonth() + 1);//months (0-11)
  var day = pad2(date.getDate());//day (1-31)
  var year = date.getFullYear();

  var formattedDate = day + "-" + month + "-" + year;
  return formattedDate;
}

async function type_with_xpath(page, selctor, text) {
  const example = await page.$x(`${selctor}`);
  await example[0].type(`${text}`);
}

async function save_cookies(page, path) {
  var cookies = await page.cookies();
  fs.writeFile(`${path}`, JSON.stringify(cookies, null, 2), function (err) {
    if (err) throw err;
    console.log('Login Session Updated..!!!');
  });
}

async function read_cookies(path) {
  if (fs.existsSync(path)) {
    const cookiesString = fs.readFileSync(path, 'utf8');
    cookies = JSON.parse(cookiesString);
    return cookies;
  } else {
    console.log("No Cookies Found")
    return null;
  }
}

async function loading(page, selector, n = 20, attr = 'innerText') {
  let i = 0;
  while (i <= n) {
    try {


      logger(1,"Loading...")
      let laoding_status = await get_data(page, `${selector}`, attr);
      if (laoding_status.length != 0) {
        break;
      } else {
        sleep(300);
      }
    } catch {
      logger(1,'Something wrong with loading.....')
      await console.log('Something wrong with loading.....');
    }
    i++;
  }
  await sleep(400);
}

async function read_csv(file_path) {
  let csv_file_contents = [];

  await fs.createReadStream(`${file_path}`)
    .pipe(csv())
    .on('data', (row) => {
      csv_file_contents.push(row);
    })
    .on('end', () => {
      logger(1,'CSV file successfully processed')
      console.log('CSV file successfully processed');
    });
  await sleep(2000);
  return csv_file_contents;
}

async function save_csv(arr_ads, file_name) {

  if (arr_ads.length != 0) {
    let today = await get_date();
    const j2cp = new json2csv();
    const ads_details = j2cp.parse(arr_ads);

    await fs.writeFileSync(`./${file_name}}.csv`, ads_details, "utf-8");
  }
}






module.exports = { save_csv, read_csv, loading, save_cookies, read_cookies, type_with_xpath, get_date, click_xpath, sleep, autoScroll, getRandomInt, myForEach, get_data, click_multiple_same_selector, read_dir, check_page_available, joinObjects };