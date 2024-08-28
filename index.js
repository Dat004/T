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

  const handleGetPosition = async (query) => {
    const { x, y } = await page.evaluate((selector) => {
      const elm = document.querySelector(selector).getBoundingClientRect();
      return {
        x: elm.left + 10,
        y: elm.top + 10,
      };
    }, query);

    return {
      x,
      y,
    };
  };

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
      console.log(username);
      await delay(500);
      const positionFieldUsername = await handleGetPosition("#email");
      await page.mouse.move(positionFieldUsername.x, positionFieldUsername.y);
      await page.focus("#email");
      await username.type(accounts.username, { delay: 201 });

      await delay(300);

      const positionFieldPassword = await handleGetPosition("#pass");
      await page.mouse.move(positionFieldPassword.x, positionFieldPassword.y);
      await page.focus("#pass");
      await password.type(accounts.password, { delay: 301 });

      await delay(1000);
      const positionBtnLogin = await handleGetPosition('button[name="login"]');
      await page.mouse.move(positionBtnLogin.x, positionBtnLogin.y);
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
    const positionTryWays = await handleGetPosition(
      "div[data-visualcompletion='ignore'][role='none']"
    );
    await page.mouse.move(positionTryWays.x, positionTryWays.y);
    await tryWays.click();

    await delay(2000);
    const codeEnter = await page.waitForSelector(
      "input[aria-checked='false'][name='unused']"
    );

    if (codeEnter) {
      await delay(300);
      await page.focus("#email");
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
      const positionFieldTwoFactorCode = await handleGetPosition(
        "#approvals_code"
      );
      await page.mouse.move(
        positionFieldTwoFactorCode.x,
        positionFieldTwoFactorCode.y
      );
      await page.focus("#approvals_code");
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
        const positionBtnContinue = await handleGetPosition(
          "button[id='checkpointSubmitButton'][name='submit[Continue]']"
        );
        await page.mouse.move(positionBtnContinue.x, positionBtnContinue.y);
        await delay(700);
        await Promise.all([page.waitForNavigation(), btnContinue.click()]);
      } else if (btnIsMe) {
        const positionBtnIsMe = await handleGetPosition(
          "button[id='checkpointSubmitButton'][name='submit[This was me]']"
        );
        await page.mouse.move(positionBtnIsMe.x, positionBtnIsMe.y);
        await delay(700);
        await Promise.all([page.waitForNavigation(), btnIsMe.click()]);
      } else if (btnSkip) {
        const positionBtnSkip = await handleGetPosition(
          "button[id='checkpointSecondaryButton'][name='submit[Skip]']"
        );
        await page.mouse.move(positionBtnSkip.x, positionBtnSkip.y);
        await delay(700);
        await Promise.all([page.waitForNavigation(), btnSkip.click()]);
      } else {
        break;
      }
    }
  }

  await delay(2000);
  await page.goto("https://www.facebook.com/ads/manager/accounts/?act=");

  await page.evaluate(() => {
    window.scrollBy({
      top: "350px",
      left: 0,
      behavior: "smooth",
    }); // Cuộn xuống 500px
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

  for (let i = 0; i < validityId.length; i++) {
    await delay(10000);
    await page.goto(
      `https://business.facebook.com/billing_hub/payment_settings/?asset_id=${validityId[i]}`
    );

    const menu = await page
      .waitForSelector("div[aria-haspopup='menu'][role='button']", {
        timeout: 1500,
        visible: true,
      })
      .catch(() => null);

    if (menu) {
      const moreBtn = await page.evaluateHandle(() => {
        const elm = document.evaluate(
          "/html/body/div[1]/div[1]/div/span/div[1]/div[2]/div/div/div/div/div/div/div[2]/span/div/div/div[1]/div/div/div/div/div/div[3]/div[1]/div[5]/div/div[1]/div/div/div[2]/div/span",
          document,
          null,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null
        ).singleNodeValue;

        return elm;
      });

      if (moreBtn) {
        await delay(1000);
        await moreBtn.click();
        await delay(1000);
      }

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
            const positionBtnSave = await handleGetPosition(
              "div[aria-label='Lưu'][role='button']"
            );
            await page.mouse.move(positionBtnSave.x, positionBtnSave.y);
            await delay(1000);
            await btnSave.click();
            await delay(1000);
          } else if (btnClose) {
            const positionBtnClose = await handleGetPosition(
              "div[aria-label='Đóng'][role='button']"
            );
            await page.mouse.move(positionBtnClose.x, positionBtnClose.y);
            await delay(1000);
            await btnClose.click();
            await delay(1000);
          } else {
            break;
          }
        }
      }

      continue;
    }

    await delay(1500);
    const addPay = await page.waitForSelector(
      "::-p-xpath(/html/body/div[1]/div[1]/div/span/div[1]/div[2]/div/div/div/div/div/div/div[2]/span/div/div/div[1]/div/div/div/div/div/div[3]/div[1]/div[3]/div/div[1]/div/div/div[2]/div/div)",
      { visible: true }
    );

    if (addPay) {
      await delay(300); // Đợi một chút trước khi click
      await addPay.click();
      console.log(1);
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
        const positionBtnContinue = await handleGetPosition(
          "div[aria-label='Tiếp'][role='button']"
        );
        await page.mouse.move(positionBtnContinue.x, positionBtnContinue.y);
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
      const positionFieldNameCard = await handleGetPosition(
        "input[name='firstName']"
      );
      await page.mouse.move(positionFieldNameCard.x, positionFieldNameCard.y);
      await page.focus("input[name='firstName']");
      await delay(500);
      await nameCard.type(objs.nameCard, { delay: 101 });
    }
    if (numberCard) {
      const positionFieldNumberCard = await handleGetPosition(
        "input[name='cardNumber']"
      );
      await page.mouse.move(
        positionFieldNumberCard.x,
        positionFieldNumberCard.y
      );
      await page.focus("input[name='cardNumber']");
      await delay(500);
      await numberCard.type(objs.numberCard, { delay: 301 });
    }
    if (dateCard) {
      const positionFieldDateCard = await handleGetPosition(
        "input[name='expiration']"
      );
      await page.mouse.move(positionFieldDateCard.x, positionFieldDateCard.y);
      await page.focus("input[name='expiration']");
      await delay(500);
      await dateCard.type(objs.dateCard, { delay: 101 });
    }
    if (codeCard) {
      const positionFieldCodeCard = await handleGetPosition(
        "input[name='securityCode']"
      );
      await page.mouse.move(positionFieldCodeCard.x, positionFieldCodeCard.y);
      await page.focus("input[name='securityCode']");
      await delay(500);
      await codeCard.type(objs.codeCard, { delay: 201 });
    }

    if (btnSave) {
      const positionBtnSave = await handleGetPosition("div[aria-label='Lưu']");
      await page.mouse.move(positionBtnSave.x, positionBtnSave.y);
      await delay(1000);
      await btnSave.click();
    }

    await delay(20000);

    while (true) {
      console.log(4);
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
          const positionFieldNameCard = await handleGetPosition(
            "input[name='firstName']"
          );
          await page.mouse.move(
            positionFieldNameCard.x,
            positionFieldNameCard.y
          );
          await page.focus("input[name='firstName']");
          await delay(500);
          await nameCard.type(objs.nameCard, { delay: 101 });
        }
        if (numberCard) {
          const positionFieldNumberCard = await handleGetPosition(
            "input[name='cardNumber']"
          );
          await page.mouse.move(
            positionFieldNumberCard.x,
            positionFieldNumberCard.y
          );
          await page.focus("input[name='cardNumber']");
          await delay(500);
          await numberCard.type(objs.numberCard, { delay: 301 });
        }
        if (dateCard) {
          const positionFieldDateCard = await handleGetPosition(
            "input[name='expiration']"
          );
          await page.mouse.move(
            positionFieldDateCard.x,
            positionFieldDateCard.y
          );
          await page.focus("input[name='expiration']");
          await delay(500);
          await dateCard.type(objs.dateCard, { delay: 101 });
        }
        if (codeCard) {
          const positionFieldCodeCard = await handleGetPosition(
            "input[name='securityCode']"
          );
          await page.mouse.move(
            positionFieldCodeCard.x,
            positionFieldCodeCard.y
          );
          await page.focus("input[name='securityCode']");
          await delay(500);
          await codeCard.type(objs.codeCard, { delay: 201 });
        }

        if (btnSave) {
          const positionBtnSave = await handleGetPosition(
            "div[aria-label='Lưu']"
          );
          await page.mouse.move(positionBtnSave.x, positionBtnSave.y);
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

        await delay(1000);
        break;
      }
    }

    await delay(900);
    // const xpath = "";

    const moreBtn = await page.evaluateHandle(() => {
      const elm = document.evaluate(
        "/html/body/div[1]/div[1]/div/span/div[1]/div[2]/div/div/div/div/div/div/div[2]/span/div/div/div[1]/div/div/div/div/div/div[3]/div[1]/div[5]/div/div[1]/div/div/div[2]/div/span",
        document,
        null,
        XPathResult.FIRST_ORDERED_NODE_TYPE,
        null
      ).singleNodeValue;

      return elm;
    });

    if (moreBtn) {
      await delay(1000);
      await moreBtn.click();
      await delay(1000);
    }

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
          const positionBtnSave = await handleGetPosition(
            "div[aria-label='Lưu'][role='button']"
          );
          await page.mouse.move(positionBtnSave.x, positionBtnSave.y);
          await delay(1000);
          await btnSave.click();
          await delay(1000);
        } else if (btnClose) {
          const positionBtnClose = await handleGetPosition(
            "div[aria-label='Đóng'][role='button']"
          );
          await page.mouse.move(positionBtnClose.x, positionBtnClose.y);
          await delay(1000);
          await btnClose.click();
          await delay(1000);
        } else {
          break;
        }
      }
    }

    await delay(7000);
  }

  await delay(1000); // Chờ thêm để đảm bảo quá trình đăng nhập hoàn tất
  await browser.close();
})();
