import { CardSuit } from "./CardSuit";

export interface Card {
  id: string;
  num: number;
  suit: CardSuit;
}

export default class card implements Card {
  public id: string;
  public num: number;
  public suit: CardSuit;

  constructor({ id, num, suit }: { id: string; num: number; suit: CardSuit }) {
    this.id = id;
    this.num = num;
    this.suit = suit;
  }
}
