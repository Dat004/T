import delay from "delay";
import speakeasy from "speakeasy";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

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
    defaultViewport: null,
  });
  const page = await browser.newPage();
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
      await username.type(accounts.username, { delay: 201 });
      await password.type(accounts.password, { delay: 301 });

      await delay(1000);
      await Promise.all([page.waitForNavigation(), btnLogin.click()]);
      break; // Thoát vòng lặp nếu đăng nhập thành công
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
    await tryWays.click();

    await delay(2000);
    const codeEnter = await page.waitForSelector(
      "input[aria-checked='false'][name='unused']"
    );

    if (codeEnter) {
      await codeEnter.click();

      await delay(1200);
      const btnNext = await page.waitForSelector(
        "::-p-xpath(/html/body/div[1]/div/div[1]/div/div[3]/div/div/div[1]/div/div[2]/div/div/div/div/div/div/div[4]/div[3]/div/div/div/div/div/div/div)"
      );

      if (btnNext) {
        await btnNext.click();

        await delay(500);
        const codeInput = await page.waitForSelector("input[type='text']");
        if (codeInput) {
          console.log(codeInput);

          await codeInput.type(twoFactorCode, { delay: 201 });

          await delay(1000);
          const btnContinue = await page.waitForSelector(
            "::-p-xpath(/html/body/div[1]/div/div[1]/div/div[2]/div/div/div[1]/div[1]/div/div[2]/div[2]/div/div/div/div/div[3]/div/div[1]/div/div)"
          );

          if (btnContinue) {
            await btnContinue.click();

            const btnTrust = await page.waitForSelector(
              "::-p-xpath(/html/body/div[1]/div/div/div[1]/div/div[3]/div/div/div[1]/div[1]/div[2]/div/div/div[3]/div[1]/div/div)"
            );

            if (btnContinue) {
              await delay(2000);
              await btnTrust.click();
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
    if (twoFactorCode) {
      await twoFactorInput.type(twoFactorCode, { delay: 201 });
    }

    while (true) {
      const btnContinue = await page
        .waitForSelector(
          "button[id='checkpointSubmitButton'][name='submit[Continue]']",
          {
            timeout: 1500,
          }
        )
        .catch(() => null);

      const btnIsMe = await page
        .waitForSelector(
          "button[id='checkpointSubmitButton'][name='submit[This was me]']",
          {
            timeout: 1500,
          }
        )
        .catch(() => null);

      const btnSkip = await page
        .waitForSelector(
          "button[id='checkpointSecondaryButton'][name='submit[Skip]']",
          {
            timeout: 1500,
          }
        )
        .catch(() => null);

      if (btnContinue) {
        await delay(700);
        await Promise.all([page.waitForNavigation(), btnContinue.click()]);
      } else if (btnIsMe) {
        await delay(700);
        await Promise.all([page.waitForNavigation(), btnIsMe.click()]);
      } else if (btnSkip) {
        await delay(700);
        await Promise.all([page.waitForNavigation(), btnSkip.click()]);
      } else {
        break;
      }
    }
  }

  await page.goto("https://www.facebook.com/ads/manager/accounts/?act=");

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

  for (let i = 0; i < validityId.length; i++) {
    await delay(10000);
    await page.goto(
      `https://business.facebook.com/billing_hub/payment_settings/?asset_id=${validityId[i]}`
    );

    await delay(900);
    const moreBtn = await page
      .waitForSelector(
        "::-p-xpath(/html/body/div[1]/div[1]/div/span/div[1]/div[2]/div/div/div/div/div/div/div[2]/span/div/div/div[1]/div/div/div/div/div/div[3]/div[1]/div[4]/div/div[1]/div/div/div[2]/div)",
        { visible: true, timeout: 5000 }
      )
      .catch(() => null);

    if (moreBtn) {
      await delay(300);
      await moreBtn.click();

      const setLimit = await page
        .waitForSelector(
          "::-p-xpath(/html/body/div[1]/div[1]/div/span/div[1]/div[2]/div/div/div/div/div/div/div[2]/span/div/div/div[2]/div/div/div[1]/div[1]/div/div/div/div/div)",
          { visible: true, timeout: 3000 }
        )
        .catch(() => null);

      if (setLimit) {
        await delay(1500);
        await setLimit.click();

        const accountSpendLimitInput = await page
          .waitForSelector("input[name='accountSpendLimitInput']", {
            timeout: 3000,
          })
          .catch(() => null);

        if (accountSpendLimitInput) {
          await delay(400);
          for (let i = 0; i <= 3; i++) {
            await accountSpendLimitInput.press("Backspace", { delay: 201 });
          }
          await accountSpendLimitInput.type(limit, {
            delay: 201,
          });
        }
        while (true) {
          const btnSave = await page
            .waitForSelector("div[aria-label='Lưu'][role='button']", {
              timeout: 1500,
              visible: true,
            })
            .catch(() => null);

          const btnClose = await page
            .waitForSelector("div[aria-label='Đóng'][role='button']", {
              timeout: 1500,
              visible: true,
            })
            .catch(() => null);

          if (btnSave) {
            await delay(1000);
            await btnSave.click();
            console.log(btnSave, "btnSave clicked");
            await delay(1000);
          } else if (btnClose) {
            await delay(1000);
            await btnClose.click();
            console.log(btnClose, "btnClose clicked");
            await delay(1000);
          } else {
            break;
          }
        }
      }
    }

    const menu = await page
      .waitForSelector("div[aria-haspopup='menu'][role='button']", {
        timeout: 1500,
        visible: true,
      })
      .catch(() => null);

    if (menu) continue;

    await delay(1500);
    const addPay = await page.waitForSelector(
      "::-p-xpath(/html/body/div[1]/div[1]/div/span/div[1]/div[2]/div/div/div/div/div/div/div[2]/span/div/div/div[1]/div/div/div/div/div/div[3]/div[1]/div[3]/div/div[1]/div/div/div[2]/div/div)",
      { visible: true }
    );

    if (addPay) {
      await delay(300); // Đợi một chút trước khi click
      await addPay.click();
    }

    while (true) {
      await delay(700);
      const btnContinue = await page
        .waitForSelector("div[aria-label='Tiếp'][role='button']", {
          timeout: 3000,
          visible: true,
        })
        .catch(() => null);

      if (btnContinue) {
        await delay(300);
        await btnContinue.click();
        await delay(1000);
      } else {
        break;
      }
    }

    const nameCard = await page.waitForSelector("input[name='firstName']");
    const numberCard = await page.waitForSelector("input[name='cardNumber']");
    const dateCard = await page.waitForSelector("input[name='expiration']");
    const codeCard = await page.waitForSelector("input[name='securityCode']");
    const btnSave = await page.waitForSelector("div[aria-label='Lưu']");

    if (nameCard) {
      await delay(500);
      await nameCard.type(objs.nameCard, { delay: 101 });
    }
    if (numberCard) {
      await delay(500);
      await numberCard.type(objs.numberCard, { delay: 301 });
    }
    if (dateCard) {
      await delay(500);
      await dateCard.type(objs.dateCard, { delay: 101 });
    }
    if (codeCard) {
      await delay(500);
      await codeCard.type(objs.codeCard, { delay: 201 });
    }

    if (btnSave) {
      await delay(1000);
      await btnSave.click();
    }

    await delay(20000);

    while (true) {
      const notSuccess = await page
        .waitForSelector(
          "::-p-xpath(//span[contains(text(), 'Không thể lưu phương thức thanh toán')])",
          {
            visible: true,
            timeout: 3500,
          }
        )
        .catch(() => null);

      if (notSuccess) {
        await delay(400);

        await handleEnterCard();

        const nameCard = await page.waitForSelector("input[name='firstName']");
        const numberCard = await page.waitForSelector(
          "input[name='cardNumber']"
        );
        const dateCard = await page.waitForSelector("input[name='expiration']");
        const codeCard = await page.waitForSelector(
          "input[name='securityCode']"
        );
        const btnSave = await page.waitForSelector("div[aria-label='Lưu']");

        if (nameCard) {
          await delay(500);
          for (let i = 0; i <= objs.nameCard.length; i++) {
            await nameCard.press("Backspace", { delay: 201 });
          }
          await nameCard.type(objs.nameCard, { delay: 101 });
        }
        if (numberCard) {
          await delay(500);
          for (let i = 0; i <= objs.numberCard.length; i++) {
            await numberCard.press("Backspace", { delay: 201 });
          }
          await numberCard.type(objs.numberCard, { delay: 301 });
        }
        if (dateCard) {
          await delay(500);
          for (let i = 0; i <= objs.dateCard.length; i++) {
            await dateCard.press("Backspace", { delay: 201 });
          }
          await dateCard.type(objs.dateCard, { delay: 101 });
        }
        if (codeCard) {
          await delay(500);
          for (let i = 0; i <= objs.codeCard.length; i++) {
            await codeCard.press("Backspace", { delay: 201 });
          }
          await codeCard.type(objs.codeCard, { delay: 201 });
        }

        if (btnSave) {
          await delay(1000);
          await btnSave.click();
        }

        await delay(20000);
      } else {
        const btnClose = await page.waitForSelector(
          "div[aria-label='Đóng'][role='button']",
          {
            visible: true,
          }
        );

        btnClose.click();
        console.log("done");

        await delay(1000);
        break;
      }
    }

    await delay(7000);
  }

  await delay(1000); // Chờ thêm để đảm bảo quá trình đăng nhập hoàn tất
  await browser.close();
})();
