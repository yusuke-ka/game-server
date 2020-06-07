import { Card } from "./Card";
import { CardSuit } from "./CardSuit";

export interface LocalCard extends Card {
  localId: number;
}

export default class localCard implements LocalCard {
  public id: string;
  public num: number;
  public suit: CardSuit;
  public localId: number;

  constructor({
    id,
    num,
    suit,
    localId,
  }: {
    id: string;
    num: number;
    suit: CardSuit;
    localId: number;
  }) {
    this.id = id;
    this.num = num;
    this.suit = suit;
    this.localId = localId;
  }
}
