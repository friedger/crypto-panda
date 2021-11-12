import {
  assertEquals,
  Clarinet,
  Tx,
  Chain,
  Account,
  types,
} from "../src/deps.ts";
import { transfer, list, unlist, buy } from "../src/panda-nft-client.ts";

import { flipMintpassSale, flipSale, mint } from "../src/panda-mint-client.ts";

Clarinet.test({
  name: "Ensure that NFT can be listed and unlisted",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_2 = accounts.get("wallet_2")!;
    let block = chain.mineBlock([
      flipSale(deployer.address),
      mint(wallet_2.address),
      list(822, 51_000_000, deployer.address + ".commission-nop", wallet_2),
      unlist(822, wallet_2),
    ]);
    assertEquals(block.receipts.length, 4);
    assertEquals(block.height, 2);
    block.receipts[0].result.expectOk().expectBool(true);
    block.receipts[1].result.expectOk().expectBool(true);
    block.receipts[2].result.expectOk().expectBool(true);
    block.receipts[3].result.expectOk().expectBool(true);
  },
});

Clarinet.test({
  name: "Ensure that NFT can be listed and bought",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    let wallet_2 = accounts.get("wallet_2")!;
    let block = chain.mineBlock([
      flipSale(deployer.address),
      mint(wallet_2.address),
      list(822, 51_000_000, deployer.address + ".commission-nop", wallet_2),
      buy(822, deployer.address + ".commission-nop", wallet_1),
    ]);
    assertEquals(block.receipts.length, 4);
    assertEquals(block.height, 2);
    block.receipts[0].result.expectOk().expectBool(true);
    block.receipts[1].result.expectOk().expectBool(true);
    block.receipts[2].result.expectOk().expectBool(true);
    block.receipts[3].result.expectOk().expectBool(true);
    let stxEvent = block.receipts[3].events[0];
    let nftEvent = block.receipts[3].events[1];
    let logEvent = block.receipts[3].events[2];
    assertEquals(stxEvent.stx_transfer_event.amount, "51000000");
    assertEquals(nftEvent.nft_transfer_event.recipient, wallet_1.address);
    assertEquals(logEvent.contract_event.value, '{a: "buy-in-ustx", id: u822}');
  },
});

Clarinet.test({
  name: "Ensure that NFT can't be bought with different commission trait",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    let wallet_2 = accounts.get("wallet_2")!;
    let block = chain.mineBlock([
      flipSale(deployer.address),
      mint(wallet_2.address),
      list(822, 51_000_000, deployer.address + ".commission-fixed", wallet_2),
      buy(822, deployer.address + ".commission-nop", wallet_1),
    ]);
    block.receipts[0].result.expectOk().expectBool(true);
    block.receipts[1].result.expectOk().expectBool(true);
    block.receipts[2].result.expectOk().expectBool(true);
    block.receipts[3].result.expectErr().expectUint(301);
  },
});

Clarinet.test({
  name: "Ensure that NFT can't be bought when unlisted",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    let wallet_2 = accounts.get("wallet_2")!;
    let block = chain.mineBlock([
      flipSale(deployer.address),
      mint(wallet_2.address),
      list(822, 51_000_000, deployer.address + ".commission-nop", wallet_2),
      unlist(822, wallet_2),
      buy(822, deployer.address + ".commission-nop", wallet_1),
    ]);
    block.receipts[0].result.expectOk().expectBool(true);
    block.receipts[1].result.expectOk().expectBool(true);
    block.receipts[2].result.expectOk().expectBool(true);
    block.receipts[3].result.expectOk().expectBool(true);
    block.receipts[4].result.expectErr().expectUint(507);
  },
});

Clarinet.test({
  name: "Ensure that NFT can't be transferred when listed",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    let wallet_2 = accounts.get("wallet_2")!;
    let block = chain.mineBlock([
      flipSale(deployer.address),
      mint(wallet_2.address),
      list(822, 51_000_000, deployer.address + ".commission-nop", wallet_2),
      transfer(822, wallet_2, wallet_1),
    ]);
    block.receipts[0].result.expectOk().expectBool(true);
    block.receipts[1].result.expectOk().expectBool(true);
    block.receipts[2].result.expectOk().expectBool(true);
    block.receipts[3].result.expectErr().expectUint(507);
  },
});
