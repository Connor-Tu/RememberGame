// 變數-撲克牌花色網址
const symbols = [
  'https://assets-lighthouse.alphacamp.co/uploads/image/file/17989/__.png', // 黑桃
  'https://assets-lighthouse.alphacamp.co/uploads/image/file/17992/heart.png', // 愛心
  'https://assets-lighthouse.alphacamp.co/uploads/image/file/17991/diamonds.png', // 方塊
  'https://assets-lighthouse.alphacamp.co/uploads/image/file/17988/__.png' // 梅花
]
// 變數-遊戲狀態
const gameState = {
  firstCardAwait: 'firstCardAwait',
  secondCardAwait: 'SecondCardAwait',
  cardMatchFailed: 'cardMatchFailed',
  cardMatchFluky: 'cardMatchFluky',
  gameFinished: 'gameFinished'
}

// ##### Model 資料管理 邏輯層
const model = {
  revealedCard: [],
  score: 0,
  triedTimes: 0,
  // 判斷二張卡片數定是否相同 若相同傳為true 若否傳回false
  revealedCardMatched() {
    return model.revealedCard[0].dataset.index % 13 === model.revealedCard[1].dataset.index % 13
  }
}

// ##### View 畫面管理 表現層
const view = {
  // 負責生成卡片正面花色與數字
  getCardContent(index) {
    const number = this.transformNumber((index % 13) + 1)
    const symbol = symbols[Math.floor(index / 13)]
    return `
        <p>${number}</p>
        <img src=${symbol} alt="">
        <p>${number}</p>`
  },
  // 負責生成卡片背面
  getCardElement(index) {
    return `
      <div class="card back" data-index=${index}>
      </div>`
  },
  // 負責找出#cards容器 並更換內容
  displayCards(indexes) {
    const rootElement = document.querySelector('#cards')
    // from新增一個Array源自那，Array(52)建立52個長度的陣列但未定義數值
    // keys()建立迭代器可在容器遍訪全部物件
    // join會把全部陣列拿出來串成一個字串 後面''將逗號改成空字串
    rootElement.innerHTML = indexes.map(index => this.getCardElement(index)).join('')
  },
  // 負責將數字1.11.12.13轉成A、J、Q、K
  transformNumber(number) {
    switch (number) {
      case 1:
        return 'A'
      case 11:
        return 'J'
      case 12:
        return 'Q'
      case 13:
        return 'K'
      default:
        return number
    }
  },
  // 翻牌函數 ...展開運算符(Spread Operator) 將陣列展開傳入函式
  // ...其餘參數(rest parameters) 當參數不知多少個，將多個參數當作陣列傳入處理
  flipCard(...cards) {
    cards.map(card => {
      // 背面則回傳正面
      if (card.classList.contains('back')) {
        // 回傳正面
        card.classList.remove('back')
        card.innerHTML = view.getCardContent(Number(card.dataset.index))
        return
      }
      // 若正面則回傳背面
      card.classList.add('back')
      card.innerHTML = null
    })
  },
  // 配對成功 顯示變化樣式函數
  pairCard(...cards) {
    cards.map(card => {
      card.classList.add('paired')
    })
  },
  // 更新分數函數
  renderScore(score) {
    document.querySelector('.score').textContent = `Score: ${score}`
  },
  // 更新次數函數
  renderTriedTimes(times) {
    document.querySelector('.tried').textContent = `You've tried: ${times} times`
  },
  // 配對錯誤 動畫播放函數
  appendWrongAnimation(...cards) {
    cards.map(card => {
      card.classList.add('wrong')
      // 事件animationend(動畫結束)觸發一秒後移除wrong 可以再觸發，once:true 只觸發一次
      card.addEventListener('animationend', event => event.target.classList.remove('wrong'), { once: true })
    })
  },
  // 結束遊戲畫面
  showGameFinished() {
    const div = document.createElement('div')
    div.classList.add('completed')
    div.innerHTML = `
      <p>Complete!</p>
      <p>Score: ${model.score}</p>
      <p>You've tried: ${model.triedTimes} times</p>
    `
    const header = document.querySelector('#header')
    header.before(div)
  },
}

// ##### Controller 流程管理 互動層
const controller = {
  // 遊戲初始值變數
  currentState: gameState.firstCardAwait,
  // 產生卡片函數
  generateCards() {
    view.displayCards(utility.getRandomNumber(52))
  },
  // 卡片流程函數 依照不同遊戲狀態做不同行為
  dispatchCardAction(card) {
    // 檢查卡片不是背面就跳離函數
    if (!card.classList.contains('back')) {
      return
    }
    // 判斷卡片狀態做出相應動作
    switch (controller.currentState) {
      case gameState.firstCardAwait:
        view.flipCard(card)
        model.revealedCard.push(card)
        controller.currentState = gameState.secondCardAwait
        // break代表跳出這個迴圈 但會繼續執行下去，return則跳出函數不再執行下去
        break
      case gameState.secondCardAwait:
        // 無論成功與失敗都累加次數
        view.renderTriedTimes(++model.triedTimes)
        view.flipCard(card)
        model.revealedCard.push(card)
        // 判斷是否配對成功
        if (model.revealedCardMatched()) {
          // 配成成功
          controller.currentState = gameState.cardMatchFluky
          view.pairCard(...model.revealedCard)
          model.revealedCard = []
          // 配對成功加10分
          view.renderScore(model.score += 10)
          // 判斷是否滿分260分
          if (model.score === 260) {
            console.log('showGameFinished')
            controller.currentState = gameState.gameFinished
            view.showGameFinished()
            return
          }
          controller.currentState = gameState.firstCardAwait
        } else {
          // 配對失敗
          controller.currentState = gameState.cardMatchFailed
          // 失敗動畫產生 注意需在setTimeout之前，但加在後面也沒異常
          view.appendWrongAnimation(...model.revealedCard)
          // 時間函數 delay 1sec 執行恢復蓋牌 注意呼叫函數()表示回傳 不加()則為回傳內容
          setTimeout(controller.resetCards, 1000)
        }
        break
    }
    console.log('currentState : ', controller.currentState)
    console.log('revealedCards : ', model.revealedCard.map(card => card.dataset.index))
  },
  // 配對失敗 重置時間函數
  resetCards() {
    view.flipCard(...model.revealedCard)
    // !注意下面二段如果放外面，因為時間函數內delay 1sec，會先執行外面造成陣列先清空造成異常
    controller.currentState = gameState.firstCardAwait
    model.revealedCard = []
  }

}

// ##### Utility 工具管理 工具層
const utility = {
  // 洗牌函數 count傳入陣列長度52
  getRandomNumber(count) {
    const number = Array.from(Array(count).keys())
    for (let index = number.length - 1; index > 0; index--) {
      let randomIndex = Math.floor(Math.random() * (index + 1))
        ;[number[index], number[randomIndex]] = [number[randomIndex], number[index]]
    }
    return number
  }
}

controller.generateCards()

// Node List 類陣列(array-list)不能用迭代器map
document.querySelectorAll('.card').forEach(card => {
  card.addEventListener('click', event => {
    controller.dispatchCardAction(card)
  })
})