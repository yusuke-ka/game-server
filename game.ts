import * as Express from "express";
import AsyncLock from "async-lock";
import { CardSuit } from "./CardSuit";
import Card from "./Card";
import LocalCard from "./LocalCard";
import { compileFunction } from "vm";

const router = Express.Router();
const lock = new AsyncLock();

const waitTime = 500;

const cards = {
  spade1: new Card({ id: "s1", num: 1, suit: CardSuit.Spades }),
  spade2: new Card({ id: "s2", num: 2, suit: CardSuit.Spades }),
  spade3: new Card({ id: "s3", num: 3, suit: CardSuit.Spades }),
  spade4: new Card({ id: "s4", num: 4, suit: CardSuit.Spades }),
  spade5: new Card({ id: "s5", num: 5, suit: CardSuit.Spades }),
  spade6: new Card({ id: "s6", num: 6, suit: CardSuit.Spades }),
  spade7: new Card({ id: "s7", num: 7, suit: CardSuit.Spades }),
  spade8: new Card({ id: "s8", num: 8, suit: CardSuit.Spades }),
  spade9: new Card({ id: "s9", num: 9, suit: CardSuit.Spades }),
  spade10: new Card({ id: "s10", num: 10, suit: CardSuit.Spades }),
  spade11: new Card({ id: "s11", num: 11, suit: CardSuit.Spades }),
  spade12: new Card({ id: "s12", num: 12, suit: CardSuit.Spades }),
  spade13: new Card({ id: "s13", num: 13, suit: CardSuit.Spades }),
  club1: new Card({ id: "c1", num: 1, suit: CardSuit.Clubs }),
  club2: new Card({ id: "c2", num: 2, suit: CardSuit.Clubs }),
  club3: new Card({ id: "c3", num: 3, suit: CardSuit.Clubs }),
  club4: new Card({ id: "c4", num: 4, suit: CardSuit.Clubs }),
  club5: new Card({ id: "c5", num: 5, suit: CardSuit.Clubs }),
  club6: new Card({ id: "c6", num: 6, suit: CardSuit.Clubs }),
  club7: new Card({ id: "c7", num: 7, suit: CardSuit.Clubs }),
  club8: new Card({ id: "c8", num: 8, suit: CardSuit.Clubs }),
  club9: new Card({ id: "c9", num: 9, suit: CardSuit.Clubs }),
  club10: new Card({ id: "c10", num: 10, suit: CardSuit.Clubs }),
  club11: new Card({ id: "c11", num: 11, suit: CardSuit.Clubs }),
  club12: new Card({ id: "c12", num: 12, suit: CardSuit.Clubs }),
  club13: new Card({ id: "c13", num: 13, suit: CardSuit.Clubs }),
  heart1: new Card({ id: "h1", num: 1, suit: CardSuit.Hearts }),
  heart2: new Card({ id: "h2", num: 2, suit: CardSuit.Hearts }),
  heart3: new Card({ id: "h3", num: 3, suit: CardSuit.Hearts }),
  heart4: new Card({ id: "h4", num: 4, suit: CardSuit.Hearts }),
  heart5: new Card({ id: "h5", num: 5, suit: CardSuit.Hearts }),
  heart6: new Card({ id: "h6", num: 6, suit: CardSuit.Hearts }),
  heart7: new Card({ id: "h7", num: 7, suit: CardSuit.Hearts }),
  heart8: new Card({ id: "h8", num: 8, suit: CardSuit.Hearts }),
  heart9: new Card({ id: "h9", num: 9, suit: CardSuit.Hearts }),
  heart10: new Card({ id: "h10", num: 10, suit: CardSuit.Hearts }),
  heart11: new Card({ id: "h11", num: 11, suit: CardSuit.Hearts }),
  heart12: new Card({ id: "h12", num: 12, suit: CardSuit.Hearts }),
  heart13: new Card({ id: "h13", num: 13, suit: CardSuit.Hearts }),
  diamond1: new Card({ id: "d1", num: 1, suit: CardSuit.Diamonds }),
  diamond2: new Card({ id: "d2", num: 2, suit: CardSuit.Diamonds }),
  diamond3: new Card({ id: "d3", num: 3, suit: CardSuit.Diamonds }),
  diamond4: new Card({ id: "d4", num: 4, suit: CardSuit.Diamonds }),
  diamond5: new Card({ id: "d5", num: 5, suit: CardSuit.Diamonds }),
  diamond6: new Card({ id: "d6", num: 6, suit: CardSuit.Diamonds }),
  diamond7: new Card({ id: "d7", num: 7, suit: CardSuit.Diamonds }),
  diamond8: new Card({ id: "d8", num: 8, suit: CardSuit.Diamonds }),
  diamond9: new Card({ id: "d9", num: 9, suit: CardSuit.Diamonds }),
  diamond10: new Card({ id: "d10", num: 10, suit: CardSuit.Diamonds }),
  diamond11: new Card({ id: "d11", num: 11, suit: CardSuit.Diamonds }),
  diamond12: new Card({ id: "d12", num: 12, suit: CardSuit.Diamonds }),
  diamond13: new Card({ id: "d13", num: 13, suit: CardSuit.Diamonds }),
  joker: new Card({ id: "j0", num: 0, suit: CardSuit.Joker }),
} as const;

interface PlayerData {
  id: number;
  name: string;
  com: boolean;
  cards: LocalCard[];
}

var clients: any[] = [];
var currentGameId: number = -1;
const playerDataList: PlayerData[][] = [];
const turnList: number[] = [];
const winnerList: number[][] = [];

const game = (ws: any, req: any) => {
  clients.push(ws);

  ws.on("message", (message: any) => {
    const json = JSON.parse(message);
    console.log(json.method);
    if (json.method === "client") {
      client(ws, json);
    } else if (json.method === "entry") {
      entry(ws, json);
    } else if (json.method === "user") {
      user(ws, json);
    } else if (json.method === "start") {
      lock.acquire(String(json.gameId), () => {
        start(json);
      });
    } else if (json.method === "pickup") {
      lock.acquire(String(json.gameId), () => {
        pickup(json);
      });
    } else if (json.method === "sort") {
      lock.acquire(String(json.gameId), () => {
        sort(json);
      });
    }
  });

  ws.on("close", () => {
    const name = clients.find((client) => client === ws).name;
    clients = clients.filter((client) => client !== ws);
    clients.forEach((client) => {
      if (ws.readyState == 1) {
        client.send(
          JSON.stringify({
            user: name,
            method: "close",
            clients: clients.map((client) => name),
          })
        );
      }
    });
  });

  function user(ws: any, json: any) {
    for (var i = 0; i < clients.length; i++) {
      if (clients[i] === ws) {
        clients[i].clientId = parseInt(json.clientId);
        clients[i].gameId = parseInt(json.gameId);
        clients[i].userId = parseInt(json.userId);
      }
    }
  }

  function client(ws: any, json: any) {
    for (var i = 0; i < clients.length; i++) {
      if (clients[i] === ws) {
        clients[i].type = "thrown";
        clients[i].gameId = parseInt(json.gameId);
        clients[i].userId = parseInt(json.userId);
      }
    }
  }

  async function start(json: any) {
    var cardList = Object.values(cards);
    var shuffled = shuffle(cardList);
    var localCards = getLocalCard(shuffled);
    var devided = devide({
      array: localCards,
      n: 4,
    });
    setPlayerCards(json.gameId, 0, devided[0]);
    setPlayerCards(json.gameId, 1, devided[1]);
    setPlayerCards(json.gameId, 2, devided[2]);
    setPlayerCards(json.gameId, 3, devided[3]);
    winnerList[json.gameId] = [];
    setNext(json.gameId);
    sendMessageForStart(json.gameId);
    await sleep();
    distribute(json);
    await sleep();
    discard(json);
    await sleep();
    sendMessageForNext(json.gameId);
    sendTarget(json.gameId);
    await sleep();
    com(json.gameId);
  }

  function shuffle(cards: Card[]) {
    let array = cards;
    for (let i = array.length - 1; i >= 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  function getLocalCard(cards: Card[]) {
    let array = cards;
    var i = 0;
    const result = array.map((card) => {
      return new LocalCard({
        id: card.id,
        num: card.num,
        suit: card.suit,
        localId: i++,
      });
    });
    return result;
  }

  function devide({ array, n }: { array: LocalCard[]; n: number }) {
    var length = Math.floor(array.length / n);
    var arrayList = [];
    var idx = 0;
    var arrayNum = 1;
    while (idx < length) {
      if (arrayNum === n) {
        arrayList.push(array);
        return arrayList;
      } else {
        arrayList.push(array.splice(idx, idx + length));
        arrayNum++;
      }
    }
    return arrayList;
  }

  function discardPair(gameId: number, cards: LocalCard[]) {
    let result = [];
    let array1 = cards;
    let skip: number[] = [];
    for (var i = 0; i < array1.length; i++) {
      if (skip.includes(i)) {
        continue;
      }
      let num1 = array1[i].num;
      var contain = false;
      for (var j = i + 1; j < array1.length; j++) {
        let num2 = array1[j].num;
        if (num1 === num2 && !skip.includes(j)) {
          contain = true;
          skip.push(j);
          sendThrownCards(gameId, [array1[i], array1[j]]);
          break;
        }
      }
      if (!contain) {
        result.push(array1[i]);
      }
    }
    return result;
  }

  function distribute(json: any) {
    for (var i = 0; i < clients.length; i++) {
      var client = clients[i];
      if (client.userId >= 0 && client.clientId >= 0) {
        sendPlayerData(json, clients[i]);
      }
    }
  }

  function sendPlayerData(json: any, client: any) {
    console.log(json.gameId + "-" + client.userId + "-" + client.clientId);
    if (json.gameId !== client.gameId) {
      return;
    }
    var targetUser = client.userId + client.clientId;
    targetUser = targetUser > 3 ? targetUser - 4 : targetUser;
    const res = {
      method: json.method,
      userId: client.userId,
      PlayerData: getPlayerData(json.gameId, client.userId, client.clientId),
      turn: turnList[json.gameId],
      rank: winnerList[json.gameId].indexOf(targetUser) + 1,
      finish: winnerList[json.gameId].length >= 3,
    };
    console.log(JSON.stringify(res));
    client.send(JSON.stringify(res));
  }

  function setPlayerCards(gameId: number, userId: number, cards: LocalCard[]) {
    if (playerDataList.length < gameId) {
      playerDataList[gameId] = [];
    }
    for (var i = playerDataList[gameId].length; i < 4; i++) {
      playerDataList[gameId].push({
        id: i,
        name: "COM" + i,
        com: true,
        cards: [],
      });
    }
    playerDataList[gameId][userId].cards = cards;
  }

  function getPlayerData(gameId: number, userId: number, clientId: number) {
    if (clientId === 0) {
      // 本人のデータ
      return playerDataList[gameId][userId];
    }
    var targetIdx = userId + clientId;
    return reverseCard(
      playerDataList[gameId][targetIdx < 4 ? targetIdx : targetIdx - 4]
    );
  }

  function reverseCard(data: PlayerData): PlayerData {
    let array = data.cards;
    const reverse = array.map((card) => {
      return new LocalCard({
        id: "back",
        num: -1,
        suit: -1,
        localId: card.localId,
      });
    });
    return {
      id: data.id,
      name: data.name,
      com: data.com,
      cards: reverse,
    };
  }

  async function pickup(json: any) {
    if (!turnCheck(json.gameId, json.userId)) {
      return false;
    }
    var found = false;
    for (var i = 0; i < 4; i++) {
      if (i === json.userId) {
        continue;
      }
      var newCards: LocalCard[] = [];
      for (var j = 0; j < playerDataList[json.gameId][i].cards.length; j++) {
        var card = playerDataList[json.gameId][i].cards[j];
        if (card.localId === json.localId) {
          if (!targetCheck(json.gameId, i)) {
            return;
          }
          playerDataList[json.gameId][json.userId].cards.push(card);
          found = true;
        } else {
          newCards.push(card);
        }
      }
      if (found) {
        playerDataList[json.gameId][i].cards = newCards;
      }
    }
    if (!found) {
      return;
    }
    winCheck(json.gameId);
    clients.forEach((client) => {
      if (client.userId >= 0 && client.clientId >= 0) {
        sendPlayerData(json, client);
      }
    });
    await sleep();
    discard(json);
    setNext(json.gameId);
    await sleep();
    com(json.gameId);
  }

  function turnCheck(gameId: number, userId: number) {
    if (turnList.length < gameId) {
      return false;
    }
    if (turnList[gameId] !== userId) {
      return false;
    }
    if (winnerList[gameId].length >= 3) {
      return false;
    }
    return true;
  }

  function targetCheck(gameId: number, targetId: number) {
    console.log(
      "targetCheck" + gameId + ":" + targetId + ":" + getTarget(gameId)
    );
    if (getTarget(gameId) === targetId) {
      return true;
    }
    return false;
  }

  function winCheck(gameId: number) {
    for (var i = 0; i < playerDataList[gameId].length; i++) {
      var cards = playerDataList[gameId][i].cards;
      if (cards.length === 0) {
        if (!winnerList[gameId].includes(i)) {
          winnerList[gameId].push(i);
          sendMessageForWin(gameId, i);
        }
      }
    }
  }

  function setNext(gameId: number) {
    if (typeof turnList[gameId] === "undefined") {
      turnList[gameId] = Math.floor(Math.random() * 4);
      return;
    }
    turnList[gameId] = getNext(gameId);
    sendMessageForNext(gameId);
    sendTarget(gameId);
  }

  function getNext(gameId: number) {
    if (typeof turnList[gameId] === "undefined") {
      return Math.floor(Math.random() * 4);
    }
    var next = turnList[gameId] + 1;
    next = next < 4 ? next : 0;
    while (winnerList[gameId].includes(next)) {
      next++;
      next = next < 4 ? next : 0;
    }
    return next;
  }

  function getTarget(gameId: number) {
    var pre = turnList[gameId] - 1;
    pre = pre < 0 ? 3 : pre;
    while (winnerList[gameId].includes(pre)) {
      pre--;
      pre = pre < 0 ? 3 : pre;
    }
    return pre;
  }

  function sendTarget(gameId: number) {
    var next = turnList[gameId];
    var target = getTarget(gameId);
    for (var i = 0; i < clients.length; i++) {
      var client = clients[i];
      if (
        client.gameId === gameId &&
        typeof client.userId != "undefined" &&
        typeof client.clientId != "undefined"
      ) {
        var targetUser = client.userId + client.clientId;
        targetUser = targetUser > 3 ? targetUser - 4 : targetUser;
        const res = {
          method: "target",
          isTarget:
            target === targetUser && client.userId === next && target !== next,
        };
        client.send(JSON.stringify(res));
      }
    }
  }

  function com(gameId: number) {
    var userId = turnList[gameId];
    if (playerDataList[gameId][userId].com) {
      var cards = playerDataList[gameId][getTarget(gameId)].cards;
      var card = cards[Math.floor(Math.random() * cards.length)];
      const json = {
        method: "pickup",
        gameId: gameId,
        userId: userId,
        localId: card.localId,
      };
      pickup(json);
    }
  }

  function discard(json: any) {
    for (var i = 0; i < 4; i++) {
      setPlayerCards(
        json.gameId,
        i,
        discardPair(json.gameId, playerDataList[json.gameId][i].cards)
      );
    }
    winCheck(json.gameId);
    clients.forEach((client) => {
      if (client.userId >= 0 && client.clientId >= 0) {
        sendPlayerData(json, client);
      }
    });
  }

  function sort(json: any) {
    var userCards = playerDataList[json.gameId][json.userId].cards;
    if (userCards.length !== json.cards.length) {
      return;
    }
    var newCards = [];
    for (var i = 0; i < json.cards.length; i++) {
      var localId = json.cards[i].localId;
      console.log("localId：" + localId);
      for (var j = 0; j < userCards.length; j++) {
        var card = userCards[j];
        if (card.localId === localId) {
          newCards.push(card);
        }
      }
    }
    if (userCards.length === newCards.length) {
      playerDataList[json.gameId][json.userId].cards = newCards;
    }
    clients.forEach((client) => {
      if (client.userId >= 0 && client.clientId >= 0) {
        sendPlayerData(json, client);
      }
    });
  }

  function sendThrownCards(gameId: number, cards: LocalCard[]) {
    clients.forEach((client) => {
      if (client.gameId === gameId && client.type === "thrown") {
        const res = {
          method: "thrown",
          gameId: gameId,
          cards: cards,
        };
        client.send(JSON.stringify(res));
      }
    });
  }

  function entry(ws: any, json: any) {
    for (var i = 0; i < clients.length; i++) {
      if (clients[i] === ws) {
        clients[i].gameId = parseInt(json.gameId);
      }
    }
    sendMessageForEntry(json.gameId);
  }

  function sendMessageForEntry(gameId: number) {
    var userLength = playerDataList[gameId].length;
    var message = userLength + "名がエントリーしています。( ";
    playerDataList[gameId].forEach((playerData) => {
      message += playerData.name + " ";
    });
    message += ")";
    sendMessage(gameId, message, false, false);
  }

  function sendMessageForStart(gameId: number) {
    var message = "ゲームをスタートしました。";
    sendMessage(gameId, message, true, false);
  }

  function sendMessageForNext(gameId: number) {
    var next = turnList[gameId];
    var target = getTarget(gameId);
    var nextName = playerDataList[gameId][next].name;
    var targetName = playerDataList[gameId][target].name;
    var message = "";
    if (next === target) {
      message = "ゲーム終了です。" + nextName + "にババが残りました。";
      sendMessage(gameId, message, false, true);
    } else {
      message =
        "次は" +
        nextName +
        "の番です。" +
        targetName +
        "からカードを引いてください。";
      sendMessage(gameId, message, true, false);
    }
  }

  function sendMessageForWin(gameId: number, winId: number) {
    var winnerName = playerDataList[gameId][winId].name;
    var message = winnerName + "があがりました。";
    sendMessage(gameId, message, true, false);
  }

  function sendMessage(
    gameId: number,
    message: string,
    started: boolean,
    initialize: boolean
  ) {
    clients.forEach((client) => {
      if (typeof client.clientId === "undefined") {
        if (client.gameId === gameId) {
          const res = {
            method: "instruction",
            message: message,
            initialize: initialize,
            started: started,
          };
          client.send(JSON.stringify(res));
        }
      }
    });
  }
};

async function sleep() {
  await new Promise((resolve) => setTimeout(resolve, waitTime));
}

// 通常POST用エンドポイント
router.post("/entry", function (req, res) {
  lock.acquire("entry", () => {
    if (currentGameId < 0 || playerDataList[currentGameId].length >= 4) {
      currentGameId++;
      playerDataList.push([]);
    }
    var id = playerDataList[currentGameId].length;
    playerDataList[currentGameId].push({
      id: id,
      name: req.body.userName,
      com: false,
      cards: [],
    });
    res.status(200).json({
      gameId: currentGameId,
      userId: id,
    });
  });
});

// ヘルスチェック用エンドポイント
router.get("/", function (req, res) {
  res.status(200).json({
    check: "ok",
  });
});

module.exports = {
  game: game,
  router: router,
};
