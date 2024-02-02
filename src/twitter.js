import mongoose from "mongoose";
import fs from "fs";
import { ReadContentTwitterWithGPT4 } from "./controllers/chatGPT";
import { configLog } from "./config/log4js";

let logger = configLog.getLogger();

  

export const scrapeTwitter = async (browser, url) =>
  new Promise(async (resolve, reject) => {
    try {
      const cookiesFilePath = "cookies.json";
      const previousSession = fs.existsSync(cookiesFilePath);
      let data = []; // Mảng lưu thông tin user crawl được
      let page = await browser.newPage();
      logger.info(">>> Mở Tab mới....");
      console.log(">>> Mở Tab mới....");
      await page.goto(url);
      logger.info(">>> Truy cập vào", url);
      console.log(">>> Truy cập vào", url);
      await page.waitForSelector("#react-root");

      // document.body.scrollHeight
      let scrollHeight = 650;
      const scrollStep = 650; // Chiều cao scroll mỗi lần

      const scrollToEnd = async () => {
        await page.evaluate((scrollHeight) => {
          window.scrollTo(0, scrollHeight);
        }, scrollHeight);

        await page.waitForTimeout(2000);

        scrollHeight += scrollStep; // Tăng chiều cao scroll sau mỗi lần
      };

      const SignInButton = await page.waitForSelector("a[data-testid='loginButton']");
      await SignInButton.press("Enter");
      const selectpage = await page.waitForSelector("div[role='group']");
      const email = await page.waitForSelector("input[name='text']");
      await email.type("hinalinks", { delay: 30 });
      await email.press("Enter");
      const password = await page.waitForSelector("input[name='password']");
      await password.type("lienminh_123", { delay: 30 });
      await password.press("Enter");
      logger.info(">>> Đăng nhập thành công vào website...");
      console.log(">>> Đăng nhập thành công vào website...");

      let nameLinkList = [];
      let scroll = true;
      let likesClicked = 1; // Số lượng like đã click
      let maxLikesClick = 100; // Số lượng bài viết cần Like và Comment
      let conditionComment = false
      let conditionLike = false

      do {
        try {
          await page.waitForSelector("section[role='region']");
          await page.waitForSelector("div[data-testid='cellInnerDiv']");
          const elements = await page.$$("div[data-testid='cellInnerDiv']");
          if(elements !== null){
            nameLinkList = await Promise.all(
              elements.map(async (element) => {
                const elementUserName = await element.$("div[data-testid='User-Name']");
                const elementLike = await element.$("div[data-testid='like']");
                const elementComment = await element.$("div[data-testid='reply']");
                const elementText = await element.$("div[data-testid='tweetText']");
                const imageSrc = await element.$("div[data-testid='tweetPhoto'] img");
                let userName = ""
                let buttonLike = ""
                let buttonComment = ""
                let srcImage = ""
                let textContent = ""

                if(elementUserName === null || elementLike === null || elementComment == null || elementComment == null || imageSrc == null || elementText == null){
                  // logger.info("<<<<< Tải trang lại chưa tìm thấy user");
                }else{
                  userName = await element.$eval("div[data-testid='User-Name']",(el) => el.textContent);
                  buttonLike = await element.$("div[data-testid='like']");
                  buttonComment = await element.$("div[data-testid='reply']");
                  srcImage = await element.$eval("div[data-testid='tweetPhoto'] img", n => n.getAttribute("src"))
                  textContent = await element.$eval("div[data-testid='tweetText']",(el) => el.textContent);
                }
                  if(userName === null || buttonLike === null || buttonComment === null || textContent === null){
                    return null
                  }else{
                    return {
                      userName,
                      buttonLike,
                      buttonComment,
                      srcImage,
                      textContent
                    };
                  }
              })
            );
          }

            const randomIndex = Math.floor(Math.random() * nameLinkList.length)
            const randomPost = nameLinkList[randomIndex];

            await page.waitForSelector("div[data-testid='cellInnerDiv']");

            if (randomPost !== null && typeof randomPost.buttonLike.click === 'function' && typeof randomPost.buttonComment.click === 'function') {
              await randomPost.buttonLike.click();
              logger.info(`>>> Like bài thứ ${randomIndex} trong số ${nameLinkList.length} bài`)
              console.log(`>>> Like bài thứ ${randomIndex} trong số ${nameLinkList.length} bài`)
              logger.info("Đã like bài viết của:", randomPost.userName);
              console.log("Đã like bài viết của:", randomPost.userName);

              // Nếu Like đủ 10 bài, sẽ gắn cờ đến bao giờ tìm và comment được bài viết có Image
              if(likesClicked % 10 === 0){
                conditionLike = true
                if(randomPost.srcImage){
                  conditionComment = true
                }
              }else{
                if(conditionLike){
                  if(randomPost.srcImage){
                    conditionComment = true
                  }
                }
              }

              if(conditionComment){
                await randomPost.buttonComment.click();
                await page.waitForSelector("div#layers"); // load lại các thẻ của web
                const inputComment = await page.$("div.public-DraftStyleDefault-block");
              
                console.log(`Link Ảnh Gửi lên API: \x1b[33m${randomPost.srcImage}\x1b[0m `)
                logger.info(`Link Ảnh Gửi lên API: ${randomPost.srcImage}`)

                if(inputComment !== null && typeof inputComment.click === 'function'){
                  await inputComment.click();
                  const closeButton = await page.$("div[data-testid='app-bar-close']");
                  // await page.keyboard.down('Control');
                  // await page.keyboard.press('A');
                  // await page.keyboard.up('Control');
                  // await page.keyboard.press('Backspace');
  
                  const dataGPT = await ReadContentTwitterWithGPT4(randomPost.textContent, randomPost.srcImage)
                  if(dataGPT.error){
                    console.log(dataGPT);
                    logger.error("Lỗi xảy ra:", dataGPT);
                    if(closeButton !== null && typeof closeButton.click === 'function'){
                      await closeButton.click()
                    }
                  }else{
                    if(dataGPT.choices[0].message.content == "I'm sorry, I can't assist with that request." || dataGPT.choices[0].message.content == "I'm sorry, I can't provide assistance with this request."){
                      if(closeButton !== null && typeof closeButton.click === 'function'){
                        await closeButton.click()
                      }
                    }else{
                      // const elementUserNameComment = await randomPost.buttonComment.$("div[data-testid='User-Name']");
                      // console.log("elementUserNameComment", elementUserNameComment)
                      logger.info(`===== Tác giả: ${randomPost.userName}`)
                      logger.info(`==== Tiêu đề: ${randomPost.textContent}`,)
                      logger.info(`=== Link Image: ${randomPost.srcImage}`,)
                      logger.info(`== Nội dung Comment: ${dataGPT.choices[0].message.content}`,)
                      console.log(`===== Tác giả: \x1b[33m${randomPost.userName}\x1b[0m`)
                      console.log(`==== Tiêu đề: \x1b[33m${randomPost.textContent}\x1b[0m`,)
                      console.log(`=== Link Image: \x1b[33m${randomPost.srcImage}\x1b[0m`,)
                      console.log(`== Nội dung Comment: \x1b[33m${dataGPT.choices[0].message.content}\x1b[0m`,)
                      await inputComment.type(dataGPT.choices[0].message.content, { delay: 20 });
                      await page.keyboard.down('Control');
                      await page.keyboard.press('Enter');
                      await page.keyboard.up('Control');

                      // Kiểm tra xem khi đang comment có bị ấn ra ngoài và hộp thoại SAVE POST hiện lên không
                      // Nếu có thì tắt nó đi và không comment nữa 
                      const layers = await page.waitForSelector("div#layers");
                      const savePost = await layers.$("div[data-testid='confirmationSheetDialog']");
                      if(savePost !== null){
                        const savePostCancel = await savePost.$("div[data-testid='confirmationSheetCancel']");
                        if(savePostCancel !== null && typeof savePostCancel.click === 'function'){
                          await savePostCancel.click()
                        }
                      }

                      conditionLike = false
                      conditionComment = false
                    }
                  }
                }
              }
              likesClicked++;
            }

          if (likesClicked >= maxLikesClick) {
            scroll = false; // Dừng scroll khi đã click đủ số lượng bài viết cần
          } else { 
            // const closeButton = await page.$("div[data-testid='app-bar-close']"); 
            // if(closeButton === null && typeof closeButton.click === 'null'){
            //   await scrollToEnd();
            // }else{
            //   setTimeout(async ()=>{
            //     await scrollToEnd();
            //   },5000)
            // }
            await scrollToEnd();
            await page.waitForSelector("section[role='region']");
            await page.waitForSelector("div[data-testid='cellInnerDiv']");
          }
        } catch (error) {
          logger.error("Lỗi xảy ra:", error);
          // console.log("Lỗi xảy ra:", error)
        } 
        logger.info(`>>> Đã Like: ${likesClicked} / ${maxLikesClick} Bài`)
        console.log(`>>> Đã Like: ${likesClicked} / ${maxLikesClick} Bài`)
      } while (scroll);
      logger.info(">>>> Đã thực hiện xong...")
      console.log(">>>> Đã thực hiện xong...")
      resolve();
    } catch (error) {
      logger.error("Lỗi ở scrape", error);
      console.log("Lỗi ở scrape", error)
      reject(error);
    }
  });
