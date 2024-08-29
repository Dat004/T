import delay from "delay";
import speakeasy from "speakeasy";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

import userAgents from "./data/userAgents.js";
import accounts from "./data/accounts.js";

puppeteer.use(StealthPlugin());

const twoFactorCode = speakeasy.totp({
  secret: accounts.secret,
  encoding: "base32", // Đảm bảo encoding đúng
});
const limit = "245000";
let objs = {};

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    // devtools: true,
    defaultViewport: null,
  });
  const page = await browser.newPage();

  await page.setUserAgent(
    userAgents[Math.floor(Math.random() * userAgents.length)]
  );
  await page.setDefaultNavigationTimeout(100000);
  await page.evaluateOnNewDocument(() => {
    // Thay đổi navigator.plugins
    Object.defineProperty(navigator, "plugins", {
      get: () => [
        { name: "Chrome PDF Plugin", filename: "pdf.dll" },
        { name: "Native Client", filename: "nativeclient.dll" },
        { name: "Shockwave Flash", filename: "flash.dll" },
      ],
    });

    // Thay đổi navigator.languages
    Object.defineProperty(navigator, "languages", {
      get: () => ["vi-VN", "vi"], // Thay đổi thành tiếng Việt
    });

    // Ẩn thuộc tính navigator.webdriver
    Object.defineProperty(navigator, "webdriver", {
      get: () => undefined,
    });
  });
  await page.goto("https://facebook.com/");
  await page.setJavaScriptEnabled(true);

  const handleEnterCard = async () => {
    const nameCard = await page.evaluate(() => {
      return prompt("Vui lòng nhập tên thẻ");
    });

    const numberCard = await page.evaluate(() => {
      return prompt("Vui lòng nhập mã số thẻ");
    });

    const dateCard = await page.evaluate(() => {
      return prompt("Vui lòng nhập ngày thẻ");
    });

    const codeCard = await page.evaluate(() => {
      return prompt("Vui lòng nhập mã thẻ");
    });

    objs = {
      nameCard,
      numberCard,
      dateCard,
      codeCard,
    };
  };

  await delay(700);
  while (true) {
    const username = await page
      .waitForSelector("#email", { timeout: 5000 })
      .catch(() => null);
    const password = await page
      .waitForSelector("#pass", { timeout: 5000 })
      .catch(() => null);
    const btnLogin = await page
      .waitForSelector('button[name="login"]', { timeout: 5000 })
      .catch(() => null);

    if (username && password && btnLogin) {
      await delay(500);
      await username.type(accounts.username, { delay: 201 });

      await delay(300);
      await password.type(accounts.password, { delay: 301 });

      await delay(1000);

      // Kiểm tra xem btnLogin có còn trong DOM không trước khi click
      const isDetached = await page.evaluate(
        (el) => document.body.contains(el),
        btnLogin
      );
      if (isDetached) {
        await Promise.all([page.waitForNavigation(), btnLogin.click()]);
        break; // Thoát vòng lặp nếu đăng nhập thành công
      }
    } else {
      await delay(1000); // Chờ một chút trước khi thử lại
    }
  }

  const tryWays = await page
    .waitForSelector("div[data-visualcompletion='ignore'][role='none']", {
      visible: true,
      timeout: 3000,
    })
    .catch(() => null);

  if (tryWays) {
    await delay(1000);

    // Kiểm tra xem tryWays có còn trong DOM không trước khi click
    const isTryWaysDetached = await page.evaluate(
      (el) => document.body.contains(el),
      tryWays
    );
    if (isTryWaysDetached) {
      await tryWays.click();
    }

    await delay(2000);
    const codeEnter = await page
      .waitForSelector(
        "input[aria-checked='false'][name='unused'][type='radio']"
      )
      .catch(() => null);

    if (codeEnter) {
      await delay(300);
      // Kiểm tra xem codeEnter có còn trong DOM không trước khi click
      const isCodeEnterDetached = await page.evaluate(
        (el) => document.body.contains(el),
        codeEnter
      );
      if (isCodeEnterDetached) {
        await codeEnter.click();
      }

      await delay(1200);
      const btnNext = await page
        .waitForSelector(
          "::-p-xpath(/html/body/div[1]/div/div[1]/div/div[3]/div/div/div[1]/div/div[2]/div/div/div/div/div/div/div[4]/div[3]/div/div/div/div/div/div/div)"
        )
        .catch(() => null);

      if (btnNext) {
        const isBtnNextDetached = await page.evaluate(
          (el) => document.body.contains(el),
          btnNext
        );
        if (isBtnNextDetached) {
          await btnNext.click();
        }

        await delay(500);
        const codeInput = await page
          .waitForSelector("input[type='text']")
          .catch(() => null);
        if (codeInput) {
          await codeInput.type(twoFactorCode, { delay: 201 });

          await delay(1000);
          const btnContinue = await page
            .waitForSelector(
              "::-p-xpath(/html/body/div[1]/div/div[1]/div/div[2]/div/div/div[1]/div[1]/div/div[2]/div[2]/div/div/div/div/div[3]/div/div[1]/div/div | /html/body/div[1]/div/div[1]/div/div[2]/div/div/div[1]/div[1]/div/div[2]/div[2]/div/div/div/div/div[3]/div/div[1]/div/div/div/div[2])"
            )
            .catch(() => null);

          if (btnContinue) {
            const isBtnContinueDetached = await page.evaluate(
              (el) => document.body.contains(el),
              btnContinue
            );
            if (isBtnContinueDetached) {
              await btnContinue.click();

              const btnTrust = await page
                .waitForSelector(
                  "::-p-xpath(/html/body/div[1]/div/div/div[1]/div/div[3]/div/div/div[1]/div[1]/div[2]/div/div/div[3]/div[1]/div/div | /html/body/div[1]/div/div[1]/div/div[3]/div/div/div[1]/div[1]/div[2]/div/div/div[3]/div[1]/div/div/div | /html/body/div[1]/div/div[1]/div/div[3]/div/div/div[1]/div[1]/div[2]/div/div/div[3]/div[1]/div/div/div/div[2])"
                )
                .catch(() => null);

              if (btnTrust) {
                const isBtnTrustDetached = await page.evaluate(
                  (el) => document.body.contains(el),
                  btnTrust
                );
                if (isBtnTrustDetached) {
                  await delay(2000);
                  await btnTrust.click();
                }
              }
            }
          }
        }
      }
    } else {
      const twoFactorInput = await page
        .waitForSelector("#approvals_code", {
          visible: true,
          timeout: 3000,
        })
        .catch(() => null);
      if (twoFactorInput) {
        await twoFactorInput.type(twoFactorCode, { delay: 201 });
      }
    }

    while (true) {
      const btnContinue = await page
        .waitForSelector(
          "button[id='checkpointSubmitButton'][name='submit[Continue]']",
          { timeout: 1500 }
        )
        .catch(() => null);

      const btnIsMe = await page
        .waitForSelector(
          "button[id='checkpointSubmitButton'][name='submit[This was me]']",
          { timeout: 1500 }
        )
        .catch(() => null);

      const btnSkip = await page
        .waitForSelector(
          "button[id='checkpointSecondaryButton'][name='submit[Skip]']",
          { timeout: 1500 }
        )
        .catch(() => null);

      if (btnContinue) {
        const isDetached = await page.evaluate(
          (el) => document.body.contains(el),
          btnContinue
        );
        if (isDetached) {
          await delay(700);
          await Promise.all([page.waitForNavigation(), btnContinue.click()]);
        }
      } else if (btnIsMe) {
        const isDetached = await page.evaluate(
          (el) => document.body.contains(el),
          btnIsMe
        );
        if (isDetached) {
          await delay(700);
          await Promise.all([page.waitForNavigation(), btnIsMe.click()]);
        }
      } else if (btnSkip) {
        const isDetached = await page.evaluate(
          (el) => document.body.contains(el),
          btnSkip
        );
        if (isDetached) {
          await delay(700);
          await Promise.all([page.waitForNavigation(), btnSkip.click()]);
        } else {
          break;
        }
      } else {
        break;
      }
    }
  }

  await delay(2000);
  await page.goto("https://www.facebook.com/ads/manager/accounts/?act=");

  await page.evaluate(() => {
    window.scrollBy({
      top: 350,
      left: 0,
      behavior: "smooth",
    }); // Cuộn xuống 350px
  });

  await delay(300);
  const validityStatus = await page.$$eval("._5ynv", (elements) =>
    elements
      .map((elm, index) => ({
        index,
        validity: parseInt(elm.dataset.sort),
      }))
      .filter((elm) => elm.validity === 1)
      .map((elm) => elm.index)
  );

  // Lấy validityId sau khi có validityStatus
  const validityId = await page.$$eval(
    "td[data-testid='all_accounts_table_account_id_cell']",
    (elements, indices) => indices.map((index) => elements[index].textContent),
    validityStatus // Truyền validityStatus vào hàm
  );

  await handleEnterCard();

  for (let i = 10; i < validityId.length; i++) {
    await delay(10000);
    await page.goto(
      `https://business.facebook.com/billing_hub/payment_settings?asset_id=${validityId[i]}&business_id&placement=standalone&global_scope_id=${accounts.username}`
    );

    const menu = await page
      .waitForSelector("div[aria-haspopup='menu'][role='button']", {
        timeout: 5000,
        visible: true,
      })
      .catch(() => null);

    if (menu) {
      await delay(3000);
      console.log("had");

      const moreBtn = await page
        .waitForSelector(
          "::-p-xpath(/html/body/div[1]/div[1]/div/span/div[1]/div[2]/div/div/div/div/div/div/div[2]/span/div/div/div[1]/div/div/div/div/div/div[3]/div[1]/div[5]/div/div[1]/div/div/div[2]/div/span | /html/body/div[1]/div[1]/div/span/div[1]/div[2]/div/div/div/div/div/div/div[2]/span/div/div/div[1]/div/div/div/div/div/div[3]/div[1]/div[4]/div/div[1]/div/div/div[2]/div/span)"
        )
        .catch(() => null);

      if (moreBtn) {
        await delay(1000);
        console.log("moreBtn");
        const isDetached = await page.evaluate(
          (el) => document.body.contains(el),
          moreBtn
        );
        if (isDetached) {
          await moreBtn.click();
        }

        await delay(1000);
        const setLimit = await page
          .waitForSelector(
            "::-p-xpath(/html/body/div[1]/div[1]/div/span/div[1]/div[2]/div/div/div/div/div/div/div[2]/span/div/div/div[2]/div/div/div[1]/div[1]/div/div/div/div | /html/body/div[1]/div[1]/div/span/div[1]/div[2]/div/div/div/div/div/div/div[2]/span/div/div/div[2]/div/div/div[1]/div[1]/div/div/div/div/div/div)",
            { visible: true, timeout: 3000 }
          )
          .catch(() => null);

        if (setLimit) {
          await delay(1500);
          console.log("limit");
          const isDetached = await page.evaluate(
            (el) => document.body.contains(el),
            setLimit
          );
          if (isDetached) {
            await setLimit.click();
          }

          await delay(500);
          const btnSkip = await page
            .waitForSelector("div[role='button'][aria-label='Bỏ qua']", {
              timeout: 3000,
            })
            .catch(() => null);

          if (btnSkip) {
            await delay(500);
            const isDetached = await page.evaluate(
              (el) => document.body.contains(el),
              btnSkip
            );
            if (isDetached) {
              await btnSkip.click();
            }
          }

          const accountSpendLimitInput = await page
            .waitForSelector(
              "label[aria-label='Số tiền (không bao gồm thuế):'] input[type='text']",
              {
                timeout: 3000,
              }
            )
            .catch(() => null);

          if (accountSpendLimitInput) {
            await delay(400);
            for (let i = 0; i <= 12; i++) {
              await accountSpendLimitInput.press("Backspace", { delay: 201 });
            }
            await accountSpendLimitInput.type(limit, {
              delay: 201,
            });

            const btnSave = await page
              .waitForSelector(
                "div[aria-label='Lưu'][role='button'], div[aria-label='Save'][role='button']",
                {
                  timeout: 1500,
                  visible: true,
                }
              )
              .catch(() => null);

            if (btnSave) {
              const isDetached = await page.evaluate(
                (el) => document.body.contains(el),
                btnSave
              );
              if (isDetached) {
                await btnSave.click();
              }
              console.log("save");
              await delay(1000);
            }

            await delay(3000);
            const btnClose = await page
              .waitForSelector(
                "div[aria-label='Đóng'][role='button'], div[aria-label='Close'][role='button']",
                {
                  timeout: 1500,
                  visible: true,
                }
              )
              .catch(() => null);

            if (btnClose) {
              const isDetached = await page.evaluate(
                (el) => document.body.contains(el),
                btnClose
              );
              if (isDetached) {
                await btnClose.click();
              }
              console.log("close");
              await delay(1000);
            }
          }
        }
      }

      continue;
    } else {
      await delay(1500);
      const addPay = await page.waitForSelector(
        "::-p-xpath(/html/body/div[1]/div[1]/div/span/div[1]/div[2]/div/div/div/div/div/div/div[2]/span/div/div/div[1]/div/div/div/div/div/div[3]/div[1]/div[3]/div/div[1]/div/div/div[2]/div/div)",
        { visible: true }
      );

      if (addPay) {
        await delay(1000); // Đợi một chút trước khi click
        console.log("add");
        const isDetached = await page.evaluate(
          (el) => document.body.contains(el),
          addPay
        );
        if (isDetached) {
          await addPay.click();
        }
        console.log(1);
      }

      while (true) {
        await delay(700);
        const btnContinue = await page
          .waitForSelector(
            "div[aria-label='Tiếp'][role='button'], div[aria-label='Next'][role='button']",
            {
              timeout: 5000,
              visible: true,
            }
          )
          .catch(() => null);

        if (btnContinue) {
          await delay(3000);
          console.log("continue");

          // Chờ xác nhận trước khi click
          const isDetached = await page.evaluate(
            (el) => document.body.contains(el),
            btnContinue
          );
          if (isDetached) {
            await btnContinue.click();
          }
        } else {
          break;
        }
      }

      const nameCard = await page
        .waitForSelector("label[aria-label='Tên trên thẻ'] input[type='text']")
        .catch(() => null);
      const numberCard = await page
        .waitForSelector("label[aria-label='Số thẻ'] input[type='text']")
        .catch(() => null);
      const dateCard = await page
        .waitForSelector("label[aria-label='MM/YY'] input[type='text']")
        .catch(() => null);
      const codeCard = await page
        .waitForSelector("label[aria-label='CVV'] input[type='password']")
        .catch(() => null);
      const btnSave = await page
        .waitForSelector(
          "div[aria-label='Lưu'], div[aria-label='Save'], div[aria-label='Save']"
        )
        .catch(() => null);

      if (nameCard) {
        await delay(500);
        await nameCard.type(objs.nameCard, { delay: 101 });
        await delay(1000);
      }
      if (numberCard) {
        await delay(500);
        await numberCard.type(objs.numberCard, { delay: 301 });
        await delay(1000);
      }
      if (dateCard) {
        await delay(500);
        await dateCard.type(objs.dateCard, { delay: 101 });
        await delay(1000);
      }
      if (codeCard) {
        await delay(500);
        await codeCard.type(objs.codeCard, { delay: 201 });
        await delay(1000);
      }

      if (btnSave) {
        const isDetached = await page.evaluate(
          (el) => document.body.contains(el),
          btnSave
        );
        if (isDetached) {
          await btnSave.click();
        }
        console.log("save");
        await delay(1000);
      }

      await delay(30000);

      while (true) {
        const notSuccess = await page
          .waitForSelector(
            '::-p-xpath(//span[contains(text(), "Không thể lưu phương thức thanh toán") or contains(text(), "Đã xảy ra lỗi")])',
            {
              visible: true,
              timeout: 3500,
            }
          )
          .catch(() => null);

        if (notSuccess) {
          await delay(400);
          console.log("notSuccess");
          await handleEnterCard();

          const nameCard = await page
            .waitForSelector(
              "label[aria-label='Tên trên thẻ'] input[type='text']"
            )
            .catch(() => null);
          const numberCard = await page
            .waitForSelector("label[aria-label='Số thẻ'] input[type='text']")
            .catch(() => null);
          const dateCard = await page
            .waitForSelector("label[aria-label='MM/YY'] input[type='text']")
            .catch(() => null);
          const codeCard = await page
            .waitForSelector("label[aria-label='CVV'] input[type='password']")
            .catch(() => null);
          const btnSave = await page
            .waitForSelector("div[aria-label='Lưu'], div[aria-label='Save']")
            .catch(() => null);

          if (nameCard) {
            for (let i = 0; i < objs.nameCard.length; i++) {
              await nameCard.press("Backspace", {
                delay: 301,
              });
            }
            await delay(500);
            await nameCard.type(objs.nameCard, { delay: 101 });
          }
          if (numberCard) {
            for (let i = 0; i < objs.numberCard.length; i++) {
              await numberCard.press("Backspace", {
                delay: 301,
              });
            }
            await delay(500);
            await numberCard.type(objs.numberCard, { delay: 301 });
          }
          if (dateCard) {
            for (let i = 0; i <= objs.dateCard.length; i++) {
              await dateCard.press("Backspace", {
                delay: 301,
              });
            }
            await delay(500);
            await dateCard.type(objs.dateCard, { delay: 101 });
          }
          if (codeCard) {
            for (let i = 0; i < objs.codeCard.length; i++) {
              await codeCard.press("Backspace", {
                delay: 301,
              });
            }
            await delay(500);
            await codeCard.type(objs.codeCard, { delay: 201 });
          }

          if (btnSave) {
            const isDetached = await page.evaluate(
              (el) => document.body.contains(el),
              btnSave
            );
            if (isDetached) {
              await btnSave.click();
            }
            await delay(1000);
          }

          await delay(30000);
        } else {
          await delay(1000);
          break;
        }
      }

      const btnClose = await page
        .waitForSelector(
          "div[aria-label='Đóng'][role='button'], div[aria-label='Close'][role='button']",
          {
            visible: true,
            timeout: 1500,
          }
        )
        .catch(() => null);

      if (btnClose) {
        await delay(3000);
        console.log("close");
        const isDetached = await page.evaluate(
          (el) => document.body.contains(el),
          btnClose
        );
        if (isDetached) {
          await btnClose.click();
        }
      }

      const btnDone = await page
        .waitForSelector(
          "div[aria-label='Xong'][role='button'], div[aria-label='Done'][role='button']",
          {
            visible: true,
            timeout: 1500,
          }
        )
        .catch(() => null);

      if (btnDone) {
        await delay(1000);
        console.log("done");
        const isDetached = await page.evaluate(
          (el) => document.body.contains(el),
          btnDone
        );
        if (isDetached) {
          await btnDone.click();
        }
      }

      await delay(3000);

      const moreBtn = await page
        .waitForSelector(
          "::-p-xpath(/html/body/div[1]/div[1]/div/span/div[1]/div[2]/div/div/div/div/div/div/div[2]/span/div/div/div[1]/div/div/div/div/div/div[3]/div[1]/div[5]/div/div[1]/div/div/div[2]/div/span | /html/body/div[1]/div[1]/div/span/div[1]/div[2]/div/div/div/div/div/div/div[2]/span/div/div/div[1]/div/div/div/div/div/div[3]/div[1]/div[4]/div/div[1]/div/div/div[2]/div/span)"
        )
        .catch(() => null);

      if (moreBtn) {
        await delay(1000);
        console.log("more");
        const isDetached = await page.evaluate(
          (el) => document.body.contains(el),
          moreBtn
        );
        if (isDetached) {
          await moreBtn.click();
        }

        await delay(1000);
        const setLimit = await page
          .waitForSelector(
            "::-p-xpath(/html/body/div[1]/div[1]/div/span/div[1]/div[2]/div/div/div/div/div/div/div[2]/span/div/div/div[2]/div/div/div[1]/div[1]/div/div/div/div | /html/body/div[1]/div[1]/div/span/div[1]/div[2]/div/div/div/div/div/div/div[2]/span/div/div/div[2]/div/div/div[1]/div[1]/div/div/div/div/div/div)",
            { visible: true, timeout: 3000 }
          )
          .catch(() => null);

        if (setLimit) {
          await delay(1500);
          console.log("limit");
          const isDetached = await page.evaluate(
            (el) => document.body.contains(el),
            setLimit
          );
          if (isDetached) {
            await setLimit.click();
          }

          await delay(500);
          const btnSkip = await page
            .waitForSelector("div[role-'button][aria-label='Bỏ qua']", {
              timeout: 3000,
            })
            .catch(() => null);

          if (btnSkip) {
            await delay(500);
            const isDetached = await page.evaluate(
              (el) => document.body.contains(el),
              btnSkip
            );
            if (isDetached) {
              await btnSkip.click();
            }
          }

          const accountSpendLimitInput = await page
            .waitForSelector(
              "label[aria-label='Số tiền (không bao gồm thuế):'] input[type='text']",
              {
                timeout: 3000,
              }
            )
            .catch(() => null);

          if (accountSpendLimitInput) {
            await delay(400);
            for (let i = 0; i <= 12; i++) {
              await accountSpendLimitInput.press("Backspace", { delay: 201 });
            }
            await accountSpendLimitInput.type(limit, {
              delay: 201,
            });
            const btnSave = await page
              .waitForSelector(
                "div[aria-label='Lưu'][role='button'], div[aria-label='Save'][role='button']",
                {
                  timeout: 1500,
                  visible: true,
                }
              )
              .catch(() => null);

            if (btnSave) {
              const isDetached = await page.evaluate(
                (el) => document.body.contains(el),
                btnSave
              );
              if (isDetached) {
                await btnSave.click();
              }
              await delay(1000);
            }

            await delay(3000);
            const btnClose = await page
              .waitForSelector(
                "div[aria-label='Đóng'][role='button'], div[aria-label='Close'][role='button']",
                {
                  timeout: 1500,
                  visible: true,
                }
              )
              .catch(() => null);

            if (btnClose) {
              const isDetached = await page.evaluate(
                (el) => document.body.contains(el),
                btnClose
              );
              if (isDetached) {
                await btnClose.click();
              }
              console.log("close");
              await delay(1000);
            }
          }
        }
      }

      await delay(7000);
    }
  }

  await delay(1000); // Chờ thêm để đảm bảo quá trình đăng nhập hoàn tất
  await browser.close();
})();
