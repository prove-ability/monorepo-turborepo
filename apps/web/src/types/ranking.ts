export interface Stock {
  current_price: number | null;
}

export interface Holding {
  quantity: number;
  stocks: Stock | null;
}

export interface User {
  user_id: string;
  nickname: string | null;
}

export interface Wallet {
  balance: number | null;
}

export interface Ranking {
  rank: number;
  nickname: string | null;
  totalAsset: number;
}
