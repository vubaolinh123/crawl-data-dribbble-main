import mongoose from "mongoose";
import { configLog } from "./config/log4js";
import {downloadFileFromUrl, insertManyDataToDB, removeDuplicateArray} from "./controllers/crawlController"


let logger = configLog.getLogger();

  

export const scrapeVecteezy = async (browser, url) =>
  new Promise(async (resolve, reject) => {
    try {
      let maxPageDonwload = 1 // Crawl dữ liệu đến Page 10 của web
      let dataUser = []; // Mảng lưu thông tin user crawl được
      let nameLinkList = []
      let nameLinkListAllPage = []
      let dataSearch = "background"
      let page = await browser.newPage();
      logger.info(">>> Mở Tab mới....");
      console.log(">>> Mở Tab mới....");
      await page.goto(url);
      logger.info(">>> Truy cập vào", url);
      console.log(">>> Truy cập vào", url);
      // const searchInput = await page.waitForSelector('#search')
      // await searchInput.type(dataSearch, {delay: 50}); 
      // await searchInput.press('Enter');
      // logger.info(">>> Đã search xong yêu cầu...") 
      // console.log(">>> Đã search xong yêu cầu...")

      let checkResourceWrapper = null
      let checkResource = null

      for(let i = 1; i <= maxPageDonwload; i++){ // Lấy data các Page dựa theo Page
        await Promise.all([
            page.waitForNavigation(),
            page.goto(`${url}/free-vector/${dataSearch}?page=${i}`),
        ]);

        await page.waitForSelector('div.ez-search-results')
        checkResourceWrapper = await page.$$('div.ez-search-results')
        checkResource = await page.$$('ul.ez-resource-grid > li')

        if(checkResourceWrapper !== null || typeof checkResourceWrapper !== 'undefined' || checkResource !== null || typeof checkResource !== 'undefined'){
          nameLinkList = await Promise.all(
              checkResource.map(async (element) => {
                const linkResource = await element.$("a.ez-resource-thumb__link");
                let resource = ""

                if(typeof linkResource === "null" ){
                  console.log("<<<<< Tải trang lại chưa tìm thấy user");
                }else{
                  resource = await element.$eval("a.ez-resource-thumb__link", n => n.getAttribute("href"));
                }
                  if(resource === null){
                    return null
                  }else{
                    return {
                      resource,
                    };
                  }
              })
          );
          nameLinkListAllPage.push(nameLinkList); // Thêm data của các Page vào 1 mảng lớn
          console.log("Lấy thành công Data Page:", i)
          logger.info("Lấy thành công Data Page:", i)
        }
      }

      let page2 = await browser.newPage()
      console.log(">>> Mở Tab của link Resource...")
      logger.info(">>> Mở Tab của link Resource...")

      for(let index = 0; index < nameLinkListAllPage.length; index++){ // duyệt mảng lớn xem có bao nhiêu Page

        for(const {resource} of nameLinkListAllPage[index]){ // duyệt từng data trong các Page
          try {
              console.log(`Đến Page Resource: ${url}${resource}`)
              logger.info(`Đến Page Resource: ${url}${resource}`)
              await Promise.all([
                  page2.waitForNavigation(),
                  page2.goto(`${url}${resource}`, {timeout: 0}),
              ]);
              const srcImage = await page2.$("img.ez-resource-show__preview__image");
              const linkUser = await page2.$("a.contributor-details__contributor");
      
              if(typeof srcImage !== "null" || typeof srcImage !== "undefined" || typeof linkUser !== "null" || typeof linkUser !== "undefined"){
                 const wrapperImage = await page2.waitForSelector('div.ez-resource-show__preview')
                 const wrapperUser = await page2.waitForSelector('div.contributor-details')
                 let linkSrcImage = await wrapperImage.$eval(".ez-resource-show__preview__image", n => n.getAttribute("src"))
                 const linkUser = await wrapperUser.$eval("a.contributor-details__contributor", n => n.getAttribute("href"))

                 console.log(`Đến Page LinkUser: ${url}${linkUser}`)
                 logger.info(`Đến Page LinkUser: ${url}${linkUser}`)
                 await Promise.all([
                  page2.waitForNavigation(),
                  page2.goto(`${url}${linkUser}`, {timeout: 0}),
                 ]);
      
                 let userName = ""
                 let location = "Không Có"
      
                 const checkUserName = await page2.$("h2.user-profile__username");
                 const checkLocation = await page2.$("div.user-profile__stat--location > span");
      
                 if(checkUserName === null || checkLocation === null){
                  userName = await page2.$eval("h2.user-profile__username",(el) => el.textContent); 
  
                  dataUser.push({
                      name: userName.trim(),
                      location,
                      link: `${url}${linkUser}`
                    })
  
                  console.log(`Người dùng \x1b[33m${userName.trim()}\x1b[0m không đặt Location`)
                  logger.info(`Người dùng ${userName.trim()} không đặt Location`)
  
                 }else{
                  userName = await page2.$eval("h2.user-profile__username",(el) => el.textContent); 
                  location = await page2.$eval("div.user-profile__stat--location > span",(el) => el.textContent);
  
                  await downloadFileFromUrl(linkSrcImage, 'C:\DownloadImageVecteezy')
                  
                  dataUser.push({
                    name: userName.trim(),
                    location: location.trim(),
                    link: `${url}${linkUser}`
                  })
  
                  // console.log("userName", userName.trim()) 
                  // console.log("location", location.trim())
                 }
                 console.log(`Đã lưu và tải \x1b[33m${dataUser.length}\x1b[0m / \x1b[33m${nameLinkListAllPage[index].length}\x1b[0m File của Page \x1b[33m${index+1}\x1b[0m`)
                 logger.info(`Đã lưu và tải ${dataUser.length} / ${nameLinkListAllPage[index].length} File của Page ${index+1} / ${maxPageDonwload}`)
              }else{
                  console.log("Lỗi không tìm thấy user và link ảnh")
                  logger.error(`Lỗi không tìm thấy user và link ảnh`)
              }
          } catch (error) {
              console.log("Error Page", error)
              logger.error("Error Page", error)
          }
        }
      }

      logger.info(">>> Dữ liệu đang chứa trong mảng:",dataUser.length)
      console.log(">>> Dữ liệu đang chứa trong mảng:",dataUser.length)
      logger.info(">>> Bắt đầu lọc tên User giống nhau...")
      console.log(">>> Bắt đầu lọc tên User giống nhau...")
      const dataRemoveDuplicate = await removeDuplicateArray(dataUser)
      // Thêm Dữ Liệu Vào Database
      logger.info(">>> Bắt đầu thêm dữ liệu vào Database...")
      console.log(">>> Bắt đầu thêm dữ liệu vào Database...")
      await insertManyDataToDB(dataRemoveDuplicate, mongoose.connection, "vecteezy")
      .then(() => {
          console.log('Thực hiện thêm dữ liệu thành công!');
          logger.info('Thực hiện thêm dữ liệu thành công!');
        })
        .catch((err) => {
          logger.error('Lỗi khi thêm dữ liệu:', err);
          console.log('Lỗi khi thêm dữ liệu:', err);
        });

      logger.info(">>>> Đã thực hiện xong...")
      console.log(">>>> Đã thực hiện xong...")

      resolve();
    } catch (error) {
      logger.error("Lỗi ở scrape", error);
      console.log("Lỗi ở scrape", error)
      reject(error);
    }
  });
