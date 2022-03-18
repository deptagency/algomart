from time import sleep, time

import pytest
from algosdk import account, encoding
from algosdk.logic import get_application_address

from contracts.utils import (
    Account,
    closeAuction,
    createAuctionApp,
    createDummyAsset,
    fundAccount,
    getAlgodClient,
    getAppGlobalState,
    getBalances,
    getCreatorAccount,
    getLastBlockTimestamp,
    getTemporaryAccount,
    optInToAsset,
    placeBid,
    setupAuctionApp,
)

# min balance: 0.1 ALGO
# smart contract, base: 0.1 ALGO
# smart contract, bytes: 0.05 * 2 = 0.1 ALGO
# smart contract, ints: 0.0285 * 8 = 0.228 ALGO
# smart contract, escrow: 0.1 + 0.1 + 0.003 = 0.203 ALGO (min, nft, txns)
# smart contract, create + setup + close txns: 0.001 * 3 = 0.003 ALGO
CREATOR_FUNDS = 100_000 + 100_000 + 100_000 + 228_000 + 203_000 + 3000


def test_create():
    client = getAlgodClient()

    funder = getTemporaryAccount(client)
    creator = getCreatorAccount(client, funder, CREATOR_FUNDS)
    _, seller_addr = account.generate_account()  # random address

    nftID = 1  # fake ID
    startTime = int(time()) + 10  # start time is 10 seconds in the future
    endTime = startTime + 60  # end time is 1 minute after start
    reserve = 1_000_000  # 1 Algo
    increment = 100_000  # 0.1 Algo
    fee = 5  # 5% royalty

    appID = createAuctionApp(
        client=client,
        sender=creator,
        seller=seller_addr,
        nftID=nftID,
        startTime=startTime,
        endTime=endTime,
        reserve=reserve,
        minBidIncrement=increment,
        feePercent=fee,
    )

    actual = getAppGlobalState(client, appID)
    expected = {
        b"seller": encoding.decode_address(seller_addr),
        b"nft_id": nftID,
        b"start": startTime,
        b"end": endTime,
        b"reserve_amount": reserve,
        b"min_bid_inc": increment,
        b"bid_account": bytes(32),  # decoded zero address
        b"fee_percent": fee,
    }

    assert actual == expected


def test_setup():
    client = getAlgodClient()

    funder = getTemporaryAccount(client)
    creator = getCreatorAccount(client, funder, CREATOR_FUNDS)
    seller = getTemporaryAccount(client)

    nftAmount = 1
    nftID = createDummyAsset(client, nftAmount, seller)

    startTime = int(time()) + 10  # start time is 10 seconds in the future
    endTime = startTime + 60  # end time is 1 minute after start
    reserve = 1_000_000  # 1 Algo
    increment = 100_000  # 0.1 Algo
    fee = 5  # 5% royalty

    appID = createAuctionApp(
        client=client,
        sender=creator,
        seller=seller.getAddress(),
        nftID=nftID,
        startTime=startTime,
        endTime=endTime,
        reserve=reserve,
        minBidIncrement=increment,
        feePercent=fee,
    )

    setupAuctionApp(
        client=client,
        appID=appID,
        funder=creator,
        nftHolder=seller,
        nftID=nftID,
        nftAmount=nftAmount,
    )

    actualState = getAppGlobalState(client, appID)
    expectedState = {
        b"seller": encoding.decode_address(seller.getAddress()),
        b"nft_id": nftID,
        b"start": startTime,
        b"end": endTime,
        b"reserve_amount": reserve,
        b"min_bid_inc": increment,
        b"bid_account": bytes(32),  # decoded zero address
        b"fee_percent": fee,
    }

    assert actualState == expectedState

    actualBalances = getBalances(client, get_application_address(appID))
    expectedBalances = {0: 2 * 100_000 + 2 * 1_000, nftID: nftAmount}

    assert actualBalances == expectedBalances


def test_first_bid_before_start():
    client = getAlgodClient()

    funder = getTemporaryAccount(client)
    creator = getCreatorAccount(client, funder, CREATOR_FUNDS)
    seller = getTemporaryAccount(client)

    nftAmount = 1
    nftID = createDummyAsset(client, nftAmount, seller)

    startTime = int(time()) + 5 * 60  # start time is 5 minutes in the future
    endTime = startTime + 60  # end time is 1 minute after start
    reserve = 1_000_000  # 1 Algo
    increment = 100_000  # 0.1 Algo
    fee = 5  # 5% royalty

    appID = createAuctionApp(
        client=client,
        sender=creator,
        seller=seller.getAddress(),
        nftID=nftID,
        startTime=startTime,
        endTime=endTime,
        reserve=reserve,
        minBidIncrement=increment,
        feePercent=fee,
    )

    setupAuctionApp(
        client=client,
        appID=appID,
        funder=creator,
        nftHolder=seller,
        nftID=nftID,
        nftAmount=nftAmount,
    )

    bidder = getTemporaryAccount(client)

    _, lastRoundTime = getLastBlockTimestamp(client)
    assert lastRoundTime < startTime

    with pytest.raises(Exception):
        bidAmount = 500_000  # 0.5 Algos
        placeBid(client=client, appID=appID, bidder=bidder, bidAmount=bidAmount)


def test_first_bid():
    client = getAlgodClient()

    funder = getTemporaryAccount(client)
    creator = getCreatorAccount(client, funder, CREATOR_FUNDS)
    seller = getTemporaryAccount(client)

    nftAmount = 1
    nftID = createDummyAsset(client, nftAmount, seller)

    startTime = int(time()) + 10  # start time is 10 seconds in the future
    endTime = startTime + 60  # end time is 1 minute after start
    reserve = 1_000_000  # 1 Algo
    increment = 100_000  # 0.1 Algo
    fee = 5  # 5% royalty

    appID = createAuctionApp(
        client=client,
        sender=creator,
        seller=seller.getAddress(),
        nftID=nftID,
        startTime=startTime,
        endTime=endTime,
        reserve=reserve,
        minBidIncrement=increment,
        feePercent=fee,
    )

    setupAuctionApp(
        client=client,
        appID=appID,
        funder=creator,
        nftHolder=seller,
        nftID=nftID,
        nftAmount=nftAmount,
    )

    bidder = getTemporaryAccount(client)

    _, lastRoundTime = getLastBlockTimestamp(client)
    if lastRoundTime < startTime + 5:
        sleep(startTime + 5 - lastRoundTime)

    bidAmount = 500_000  # 0.5 Algos
    placeBid(client=client, appID=appID, bidder=bidder, bidAmount=bidAmount)

    actualState = getAppGlobalState(client, appID)
    expectedState = {
        b"seller": encoding.decode_address(seller.getAddress()),
        b"nft_id": nftID,
        b"start": startTime,
        b"end": endTime,
        b"reserve_amount": reserve,
        b"min_bid_inc": increment,
        b"num_bids": 1,
        b"fee_percent": fee,
        b"bid_amount": bidAmount,
        b"bid_account": encoding.decode_address(bidder.getAddress()),
    }

    assert actualState == expectedState

    actualBalances = getBalances(client, get_application_address(appID))
    expectedBalances = {0: 2 * 100_000 + 2 * 1_000 + bidAmount, nftID: nftAmount}

    assert actualBalances == expectedBalances


def test_second_bid():
    client = getAlgodClient()

    funder = getTemporaryAccount(client)
    creator = getCreatorAccount(client, funder, CREATOR_FUNDS)
    seller = getTemporaryAccount(client)

    nftAmount = 1
    nftID = createDummyAsset(client, nftAmount, seller)

    startTime = int(time()) + 10  # start time is 10 seconds in the future
    endTime = startTime + 60  # end time is 1 minute after start
    reserve = 1_000_000  # 1 Algo
    increment = 100_000  # 0.1 Algo
    fee = 5  # 5% royalty

    appID = createAuctionApp(
        client=client,
        sender=creator,
        seller=seller.getAddress(),
        nftID=nftID,
        startTime=startTime,
        endTime=endTime,
        reserve=reserve,
        minBidIncrement=increment,
        feePercent=fee,
    )

    setupAuctionApp(
        client=client,
        appID=appID,
        funder=creator,
        nftHolder=seller,
        nftID=nftID,
        nftAmount=nftAmount,
    )

    bidder1 = getTemporaryAccount(client)
    bidder2 = getTemporaryAccount(client)

    _, lastRoundTime = getLastBlockTimestamp(client)
    if lastRoundTime < startTime + 5:
        sleep(startTime + 5 - lastRoundTime)

    bid1Amount = 500_000  # 0.5 Algos
    placeBid(client=client, appID=appID, bidder=bidder1, bidAmount=bid1Amount)

    bidder1AlgosBefore = getBalances(client, bidder1.getAddress())[0]

    with pytest.raises(Exception):
        bid2Amount = bid1Amount + 1_000  # increase is less than min increment amount
        placeBid(
            client=client,
            appID=appID,
            bidder=bidder2,
            bidAmount=bid2Amount,
        )

    bid2Amount = bid1Amount + increment
    placeBid(client=client, appID=appID, bidder=bidder2, bidAmount=bid2Amount)

    actualState = getAppGlobalState(client, appID)
    expectedState = {
        b"seller": encoding.decode_address(seller.getAddress()),
        b"nft_id": nftID,
        b"start": startTime,
        b"end": endTime,
        b"reserve_amount": reserve,
        b"min_bid_inc": increment,
        b"num_bids": 2,
        b"fee_percent": fee,
        b"bid_amount": bid2Amount,
        b"bid_account": encoding.decode_address(bidder2.getAddress()),
    }

    assert actualState == expectedState

    actualAppBalances = getBalances(client, get_application_address(appID))
    expectedAppBalances = {0: 2 * 100_000 + 2 * 1_000 + bid2Amount, nftID: nftAmount}

    assert actualAppBalances == expectedAppBalances

    bidder1AlgosAfter = getBalances(client, bidder1.getAddress())[0]

    # bidder1 should receive a refund of their bid, minus the txn fee
    assert bidder1AlgosAfter - bidder1AlgosBefore >= bid1Amount - 1_000


def test_close_before_start():
    client = getAlgodClient()

    funder = getTemporaryAccount(client)
    creator = getCreatorAccount(client, funder, CREATOR_FUNDS)
    seller = getTemporaryAccount(client)

    nftAmount = 1
    nftID = createDummyAsset(client, nftAmount, seller)

    startTime = int(time()) + 5 * 60  # start time is 5 minutes in the future
    endTime = startTime + 60  # end time is 1 minute after start
    reserve = 1_000_000  # 1 Algo
    increment = 100_000  # 0.1 Algo
    fee = 5  # 5% royalty

    appID = createAuctionApp(
        client=client,
        sender=creator,
        seller=seller.getAddress(),
        nftID=nftID,
        startTime=startTime,
        endTime=endTime,
        reserve=reserve,
        minBidIncrement=increment,
        feePercent=fee,
    )

    setupAuctionApp(
        client=client,
        appID=appID,
        funder=creator,
        nftHolder=seller,
        nftID=nftID,
        nftAmount=nftAmount,
    )

    _, lastRoundTime = getLastBlockTimestamp(client)
    assert lastRoundTime < startTime

    closeAuction(client, appID, creator)

    actualAppBalances = getBalances(client, get_application_address(appID))
    expectedAppBalances = {0: 0}

    assert actualAppBalances == expectedAppBalances

    sellerNftBalance = getBalances(client, seller.getAddress())[nftID]
    assert sellerNftBalance == nftAmount


def test_close_no_bids():
    client = getAlgodClient()

    funder = getTemporaryAccount(client)
    creator = getCreatorAccount(client, funder, CREATOR_FUNDS)
    seller = getTemporaryAccount(client)

    nftAmount = 1
    nftID = createDummyAsset(client, nftAmount, seller)

    startTime = int(time()) + 10  # start time is 10 seconds in the future
    endTime = startTime + 30  # end time is 30 seconds after start
    reserve = 1_000_000  # 1 Algo
    increment = 100_000  # 0.1 Algo
    fee = 5  # 5% royalty

    appID = createAuctionApp(
        client=client,
        sender=creator,
        seller=seller.getAddress(),
        nftID=nftID,
        startTime=startTime,
        endTime=endTime,
        reserve=reserve,
        minBidIncrement=increment,
        feePercent=fee,
    )

    setupAuctionApp(
        client=client,
        appID=appID,
        funder=creator,
        nftHolder=seller,
        nftID=nftID,
        nftAmount=nftAmount,
    )

    _, lastRoundTime = getLastBlockTimestamp(client)
    if lastRoundTime < endTime + 5:
        sleep(endTime + 5 - lastRoundTime)

    closeAuction(client, appID, creator)

    actualAppBalances = getBalances(client, get_application_address(appID))
    expectedAppBalances = {0: 0}

    assert actualAppBalances == expectedAppBalances

    sellerNftBalance = getBalances(client, seller.getAddress())[nftID]
    assert sellerNftBalance == nftAmount


def test_close_reserve_not_met():
    client = getAlgodClient()

    funder = getTemporaryAccount(client)
    creator = getCreatorAccount(client, funder, CREATOR_FUNDS)
    seller = getTemporaryAccount(client)

    nftAmount = 1
    nftID = createDummyAsset(client, nftAmount, seller)

    startTime = int(time()) + 10  # start time is 10 seconds in the future
    endTime = startTime + 30  # end time is 30 seconds after start
    reserve = 1_000_000  # 1 Algo
    increment = 100_000  # 0.1 Algo
    fee = 5  # 5% royalty

    appID = createAuctionApp(
        client=client,
        sender=creator,
        seller=seller.getAddress(),
        nftID=nftID,
        startTime=startTime,
        endTime=endTime,
        reserve=reserve,
        minBidIncrement=increment,
        feePercent=fee,
    )

    setupAuctionApp(
        client=client,
        appID=appID,
        funder=creator,
        nftHolder=seller,
        nftID=nftID,
        nftAmount=nftAmount,
    )

    bidder = getTemporaryAccount(client)

    _, lastRoundTime = getLastBlockTimestamp(client)
    if lastRoundTime < startTime + 5:
        sleep(startTime + 5 - lastRoundTime)

    bidAmount = 500_000  # 0.5 Algos
    placeBid(client=client, appID=appID, bidder=bidder, bidAmount=bidAmount)

    bidderAlgosBefore = getBalances(client, bidder.getAddress())[0]

    _, lastRoundTime = getLastBlockTimestamp(client)
    if lastRoundTime < endTime + 5:
        sleep(endTime + 5 - lastRoundTime)

    closeAuction(client, appID, creator)

    actualAppBalances = getBalances(client, get_application_address(appID))
    expectedAppBalances = {0: 0}

    assert actualAppBalances == expectedAppBalances

    bidderAlgosAfter = getBalances(client, bidder.getAddress())[0]

    # bidder should receive a refund of their bid, minus the txn fee
    assert bidderAlgosAfter - bidderAlgosBefore >= bidAmount - 1_000

    sellerNftBalance = getBalances(client, seller.getAddress())[nftID]
    assert sellerNftBalance == nftAmount


def test_close_reserve_met():
    client = getAlgodClient()

    funder = getTemporaryAccount(client)
    creator = getCreatorAccount(client, funder, CREATOR_FUNDS)
    seller = getTemporaryAccount(client)

    nftAmount = 1
    nftID = createDummyAsset(client, nftAmount, seller)

    startTime = int(time()) + 10  # start time is 10 seconds in the future
    endTime = startTime + 30  # end time is 30 seconds after start
    reserve = 1_000_000  # 1 Algo
    increment = 100_000  # 0.1 Algo
    fee = 5  # 5% royalty

    appID = createAuctionApp(
        client=client,
        sender=creator,
        seller=seller.getAddress(),
        nftID=nftID,
        startTime=startTime,
        endTime=endTime,
        reserve=reserve,
        minBidIncrement=increment,
        feePercent=fee,
    )

    setupAuctionApp(
        client=client,
        appID=appID,
        funder=creator,
        nftHolder=seller,
        nftID=nftID,
        nftAmount=nftAmount,
    )

    creatorAlgosBefore = getBalances(client, creator.getAddress())[0]
    sellerAlgosBefore = getBalances(client, seller.getAddress())[0]

    bidder = getTemporaryAccount(client)

    _, lastRoundTime = getLastBlockTimestamp(client)
    if lastRoundTime < startTime + 5:
        sleep(startTime + 5 - lastRoundTime)

    bidAmount = reserve
    placeBid(client=client, appID=appID, bidder=bidder, bidAmount=bidAmount)

    optInToAsset(client, nftID, bidder)

    _, lastRoundTime = getLastBlockTimestamp(client)
    if lastRoundTime < endTime + 5:
        sleep(endTime + 5 - lastRoundTime)

    closeAuction(client, appID, creator)

    actualAppBalances = getBalances(client, get_application_address(appID))
    expectedAppBalances = {0: 0}

    assert actualAppBalances == expectedAppBalances

    bidderNftBalance = getBalances(client, bidder.getAddress())[nftID]

    assert bidderNftBalance == nftAmount

    actualCreatorBalances = getBalances(client, creator.getAddress())
    actualSellerBalances = getBalances(client, seller.getAddress())

    assert len(actualSellerBalances) == 2
    # seller should receive the bid amount, minus the txn fee and the royalty fee
    assert actualSellerBalances[0] >= sellerAlgosBefore - 1_000 + (
        bidAmount * (1 - fee / 100)
    )
    assert actualSellerBalances[nftID] == 0

    # creator should receive everything else (including the royalty fee)
    assert actualCreatorBalances[0] >= creatorAlgosBefore - 1_000 + (
        bidAmount * (fee / 100)
    )

    # note: at this point the creator account can be closed out
    # i.e. return any remaining funds to a funding wallet


def test_close_reserve_met_no_royalty():
    client = getAlgodClient()

    funder = getTemporaryAccount(client)
    creator = getCreatorAccount(client, funder, CREATOR_FUNDS)
    seller = getTemporaryAccount(client)

    nftAmount = 1
    nftID = createDummyAsset(client, nftAmount, seller)

    startTime = int(time()) + 10  # start time is 10 seconds in the future
    endTime = startTime + 30  # end time is 30 seconds after start
    reserve = 1_000_000  # 1 Algo
    increment = 100_000  # 0.1 Algo
    fee = 0  # 0% royalty

    appID = createAuctionApp(
        client=client,
        sender=creator,
        seller=seller.getAddress(),
        nftID=nftID,
        startTime=startTime,
        endTime=endTime,
        reserve=reserve,
        minBidIncrement=increment,
        feePercent=fee,
    )

    setupAuctionApp(
        client=client,
        appID=appID,
        funder=creator,
        nftHolder=seller,
        nftID=nftID,
        nftAmount=nftAmount,
    )

    creatorAlgosBefore = getBalances(client, creator.getAddress())[0]
    sellerAlgosBefore = getBalances(client, seller.getAddress())[0]

    bidder = getTemporaryAccount(client)

    _, lastRoundTime = getLastBlockTimestamp(client)
    if lastRoundTime < startTime + 5:
        sleep(startTime + 5 - lastRoundTime)

    bidAmount = reserve
    placeBid(client=client, appID=appID, bidder=bidder, bidAmount=bidAmount)

    optInToAsset(client, nftID, bidder)

    _, lastRoundTime = getLastBlockTimestamp(client)
    if lastRoundTime < endTime + 5:
        sleep(endTime + 5 - lastRoundTime)

    closeAuction(client, appID, creator)

    actualAppBalances = getBalances(client, get_application_address(appID))
    expectedAppBalances = {0: 0}

    assert actualAppBalances == expectedAppBalances

    bidderNftBalance = getBalances(client, bidder.getAddress())[nftID]

    assert bidderNftBalance == nftAmount

    actualCreatorBalances = getBalances(client, creator.getAddress())
    actualSellerBalances = getBalances(client, seller.getAddress())

    assert len(actualSellerBalances) == 2
    # seller should receive the bid amount, minus the txn fee and the royalty fee
    assert actualSellerBalances[0] >= sellerAlgosBefore - 1_000 + (
        bidAmount * (1 - fee / 100)
    )
    assert actualSellerBalances[nftID] == 0

    # creator should receive everything else (including the royalty fee)
    assert actualCreatorBalances[0] >= creatorAlgosBefore - 1_000 + (
        bidAmount * (fee / 100)
    )

    # note: at this point the creator account can be closed out
    # i.e. return any remaining funds to a funding wallet
