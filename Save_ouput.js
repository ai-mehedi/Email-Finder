const json2csv = require("json2csv").Parser;
const fs = require("fs");

// async function save_csv(arr_ads, file_name) {

//   if (arr_ads.length != 0) {

//     const j2cp = new json2csv();
//     const ads_details = j2cp.parse(arr_ads);

//     await fs.writeFileSync(`./${file_name}.csv`, ads_details, "utf-8");
//   }
// }

// let success = [];
// let invalid_email = [];
// let wrong_password = [];
// let varification = [];

async function saveFile_stream(arr, path) {
  try{
    if (fs.existsSync(path)) {
      fs.appendFileSync(path, arr+'\n', "utf-8");
    } else {
      fs.writeFileSync(path, arr+'\n', "utf-8");

      
    }
  }catch{

  }

}

// async function save_files() {
//   await save_csv(success, "SuccessList");
//   await save_csv(invalid_email, "InvalidEmailList");
//   await save_csv(wrong_password, "WrongPasswordList");
//   await save_csv(varification, "VarificationList");
// }

module.exports = { saveFile_stream };
