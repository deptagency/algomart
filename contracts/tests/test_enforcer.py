from base64 import b64decode
from algosdk import *
from algosdk.abi import *
from algosdk.future.transaction import *
from algosdk.atomic_transaction_composer import *
from contracts.enforcer.approval import compile_enforcer_approval
from contracts.enforcer.clear import compile_enforcer_clear
from contracts.utils import Account, getAlgodClient, getAppGlobalState, getBalances, getGenesisAccounts, getTemporaryAccount, payAccount, waitForTransaction

from algosdk.future import transaction
from algosdk.v2client.algod import AlgodClient
from pkg_resources import get_entry_map


ZERO_ADDR = encoding.encode_address(bytes(32))


with open("src/contracts/enforcer/abi.json") as f:
    enforcer_iface = Interface.from_json(f.read())


def fullyCompileContract(client: AlgodClient, teal: str) -> bytes:
    response = client.compile(teal)
    return b64decode(response["result"])


def deploy_nft(client: AlgodClient, creator: Account, enforcer_address: str) -> int:
    signer = AccountTransactionSigner(creator.getPrivateKey())
    sp = client.suggested_params()
    atc = AtomicTransactionComposer()
    atc.add_transaction(
        TransactionWithSigner(
            signer=signer,
            txn=transaction.AssetCreateTxn(
                sender=creator.getAddress(),
                sp=sp,
                total=1,
                decimals=0,
                default_frozen=True,
                asset_name="My NFT",
                clawback=enforcer_address,
                freeze=enforcer_address,
                manager=enforcer_address,
                reserve=enforcer_address,
                unit_name="NFT",
                url="https://example.com"
            )
        )
    )
    result = atc.execute(client, 2)

    response = waitForTransaction(client, result.tx_ids[0])

    assert response.assetIndex is not None and response.assetIndex > 0

    return response.assetIndex


def deploy_enforcer(client: AlgodClient, sender: Account):
    approval = fullyCompileContract(client, compile_enforcer_approval())
    clear = fullyCompileContract(client, compile_enforcer_clear())

    txn = transaction.ApplicationCreateTxn(
        sender=sender.getAddress(),
        on_complete=transaction.OnComplete.NoOpOC,
        approval_program=approval,
        clear_program=clear,
        global_schema=transaction.StateSchema(1, 2),
        local_schema=transaction.StateSchema(0, 16),
        sp=client.suggested_params(),
    )

    signedTxn = txn.sign(sender.getPrivateKey())

    client.send_transaction(signedTxn)

    response = waitForTransaction(client, signedTxn.get_txid())

    assert response.applicationIndex is not None and response.applicationIndex > 0

    payAccount(client, sender, logic.get_application_address(response.applicationIndex), int(1e6))

    return response.applicationIndex


# Utility method til one is provided
def get_method(i: Interface, name: str) -> Method:
    for m in i.methods:
        if m.name == name:
            return m
    raise Exception("No method with the name {}".format(name))


def test_create_enforcer():
    client = getAlgodClient()
    creator = getTemporaryAccount(client)

    enforcerID = deploy_enforcer(client, creator)

    assert enforcerID is not None and enforcerID > 0

    actual = getAppGlobalState(client, enforcerID)
    expected = {
        b"administrator": encoding.decode_address(creator.getAddress()),
    }

    assert actual == expected

def test_set_policy():
    client = getAlgodClient()
    creator = getTemporaryAccount(client)
    royalty = getTemporaryAccount(client)
    creator_signer = AccountTransactionSigner(creator.getPrivateKey())

    enforcerID = deploy_enforcer(client, creator)

    assert enforcerID is not None and enforcerID > 0

    sp = client.suggested_params()
    atc = AtomicTransactionComposer()
    atc.add_method_call(
        enforcerID,
        get_method(enforcer_iface, "set_policy"),
        creator.getAddress(),
        sp,
        creator_signer,
        method_args=[1000, royalty.getAddress()],
    )
    atc.execute(client, 2)

    sp = client.suggested_params()
    atc = AtomicTransactionComposer()
    atc.add_method_call(
        enforcerID,
        get_method(enforcer_iface, "get_policy"),
        creator.getAddress(),
        sp,
        creator_signer,
    )
    result = atc.execute(client, 2)

    assert result.abi_results[0].return_value == [royalty.getAddress(), 1000]

    actual = getAppGlobalState(client, enforcerID)
    expected = {
        b"administrator": encoding.decode_address(creator.getAddress()),
        b"royalty_receiver": encoding.decode_address(royalty.getAddress()),
        b"royalty_basis": 1000,
    }

    assert actual == expected


def test_set_administrator():
    client = getAlgodClient()
    creator = getTemporaryAccount(client)
    admin = getTemporaryAccount(client)
    creator_signer = AccountTransactionSigner(creator.getPrivateKey())

    enforcerID = deploy_enforcer(client, creator)

    assert enforcerID is not None and enforcerID > 0

    sp = client.suggested_params()
    atc = AtomicTransactionComposer()
    atc.add_method_call(
        enforcerID,
        get_method(enforcer_iface, "set_administrator"),
        creator.getAddress(),
        sp,
        creator_signer,
        method_args=[admin.getAddress()],
    )
    atc.execute(client, 2)

    sp = client.suggested_params()
    atc = AtomicTransactionComposer()
    atc.add_method_call(
        enforcerID,
        get_method(enforcer_iface, "get_administrator"),
        creator.getAddress(),
        sp,
        creator_signer,
    )
    result = atc.execute(client, 2)

    assert result.abi_results[0].return_value == admin.getAddress()

    actual = getAppGlobalState(client, enforcerID)
    expected = {
        b"administrator": encoding.decode_address(admin.getAddress()),
    }

    assert actual == expected


def test_create_offer():
    client = getAlgodClient()
    creator = getTemporaryAccount(client)
    royalty = getTemporaryAccount(client)
    auth_seller = getTemporaryAccount(client)
    creator_signer = AccountTransactionSigner(creator.getPrivateKey())

    enforcer_id = deploy_enforcer(client, creator)
    nft_id = deploy_nft(client, creator, logic.get_application_address(enforcer_id))

    sp = client.suggested_params()
    atc = AtomicTransactionComposer()
    atc.add_method_call(
        enforcer_id,
        get_method(enforcer_iface, "set_policy"),
        creator.getAddress(),
        sp,
        creator_signer,
        method_args=[1000, royalty.getAddress()],
    )
    atc.execute(client, 2)

    # Opt-in to app so we can make an offer
    sp = client.suggested_params()
    atc = AtomicTransactionComposer()
    atc.add_transaction(
        TransactionWithSigner(
            signer=creator_signer,
            txn=transaction.ApplicationCallTxn(
                sender=creator.getAddress(),
                sp=sp,
                index=enforcer_id,
                on_complete=transaction.OnComplete.OptInOC,
            )
        )
    )
    atc.execute(client, 2)

    # Make an offer
    sp = client.suggested_params()
    atc = AtomicTransactionComposer()
    atc.add_method_call(
        enforcer_id,
        get_method(enforcer_iface, "offer"),
        creator.getAddress(),
        sp,
        creator_signer,
        [nft_id, 1, auth_seller.getAddress(), 0, ZERO_ADDR]
    )
    atc.execute(client, 2)

    # Get offer details
    sp = client.suggested_params()
    atc = AtomicTransactionComposer()
    atc.add_method_call(
        enforcer_id,
        get_method(enforcer_iface, "get_offer"),
        creator.getAddress(),
        sp,
        creator_signer,
        [nft_id, creator.getAddress()]
    )
    result = atc.execute(client, 2)

    assert result.abi_results[0].return_value == [auth_seller.getAddress(), 1]

def test_royalty_free_move():
    client = getAlgodClient()
    creator = getTemporaryAccount(client)
    royalty = getTemporaryAccount(client)
    auth_seller = getTemporaryAccount(client)
    creator_signer = AccountTransactionSigner(creator.getPrivateKey())
    auth_seller_signer = AccountTransactionSigner(auth_seller.getPrivateKey())
    buyer = getTemporaryAccount(client)
    buyer_signer = AccountTransactionSigner(buyer.getPrivateKey())

    enforcer_id = deploy_enforcer(client, creator)
    nft_id = deploy_nft(client, creator, logic.get_application_address(enforcer_id))

    sp = client.suggested_params()
    atc = AtomicTransactionComposer()
    atc.add_method_call(
        enforcer_id,
        get_method(enforcer_iface, "set_policy"),
        creator.getAddress(),
        sp,
        creator_signer,
        method_args=[1000, royalty.getAddress()],
    )
    atc.execute(client, 2)

    # Opt-in to app so we can make an offer
    sp = client.suggested_params()
    atc = AtomicTransactionComposer()
    atc.add_transaction(
        TransactionWithSigner(
            signer=creator_signer,
            txn=transaction.ApplicationCallTxn(
                sender=creator.getAddress(),
                sp=sp,
                index=enforcer_id,
                on_complete=transaction.OnComplete.OptInOC,
            )
        )
    )
    atc.execute(client, 2)

    # Make an offer
    sp = client.suggested_params()
    atc = AtomicTransactionComposer()
    atc.add_method_call(
        enforcer_id,
        get_method(enforcer_iface, "offer"),
        creator.getAddress(),
        sp,
        creator_signer,
        [nft_id, 1, creator.getAddress(), 0, ZERO_ADDR]
    )
    atc.execute(client, 2)

    # Buyer opt-in to NFT
    sp = client.suggested_params()
    atc = AtomicTransactionComposer()
    atc.add_transaction(
        TransactionWithSigner(
            signer=buyer_signer,
            txn=transaction.AssetTransferTxn(
                sender=buyer.getAddress(),
                sp=sp,
                index=nft_id,
                receiver=buyer.getAddress(),
                amt=0,
            )
        )
    )
    atc.execute(client, 2)

    # Royalty free move
    sp = client.suggested_params()
    sp.fee = 2000 # need to pay for inner txn fee (for asset transfer)
    atc = AtomicTransactionComposer()
    atc.add_method_call(
        enforcer_id,
        get_method(enforcer_iface, "royalty_free_move"),
        creator.getAddress(),
        sp,
        creator_signer,
        [nft_id, 1, creator.getAddress(), buyer.getAddress(), 1]
    )
    atc.execute(client, 2)

    seller_balances = getBalances(client, creator.getAddress())
    buyer_balances = getBalances(client, buyer.getAddress())

    assert seller_balances[nft_id] == 0
    assert buyer_balances[nft_id] == 1

def test_transfer():
    client = getAlgodClient()
    creator = getTemporaryAccount(client)
    royalty = getTemporaryAccount(client)
    auth_seller = getTemporaryAccount(client)
    creator_signer = AccountTransactionSigner(creator.getPrivateKey())
    auth_seller_signer = AccountTransactionSigner(auth_seller.getPrivateKey())
    buyer = getTemporaryAccount(client)
    buyer_signer = AccountTransactionSigner(buyer.getPrivateKey())

    enforcer_id = deploy_enforcer(client, creator)
    nft_id = deploy_nft(client, creator, logic.get_application_address(enforcer_id))

    sp = client.suggested_params()
    atc = AtomicTransactionComposer()
    atc.add_method_call(
        enforcer_id,
        get_method(enforcer_iface, "set_policy"),
        creator.getAddress(),
        sp,
        creator_signer,
        method_args=[1000, royalty.getAddress()],
    )
    atc.execute(client, 2)

    # Opt-in to app so we can make an offer
    sp = client.suggested_params()
    atc = AtomicTransactionComposer()
    atc.add_transaction(
        TransactionWithSigner(
            signer=creator_signer,
            txn=transaction.ApplicationCallTxn(
                sender=creator.getAddress(),
                sp=sp,
                index=enforcer_id,
                on_complete=transaction.OnComplete.OptInOC,
            )
        )
    )
    atc.execute(client, 2)

    # Make an offer
    sp = client.suggested_params()
    atc = AtomicTransactionComposer()
    atc.add_method_call(
        enforcer_id,
        get_method(enforcer_iface, "offer"),
        creator.getAddress(),
        sp,
        creator_signer,
        [nft_id, 1, buyer.getAddress(), 0, ZERO_ADDR]
    )
    atc.execute(client, 2)

    # Buyer opt-in to NFT
    sp = client.suggested_params()
    atc = AtomicTransactionComposer()
    atc.add_transaction(
        TransactionWithSigner(
            signer=buyer_signer,
            txn=transaction.AssetTransferTxn(
                sender=buyer.getAddress(),
                sp=sp,
                index=nft_id,
                receiver=buyer.getAddress(),
                amt=0,
            )
        )
    )
    atc.execute(client, 2)

    # Transfer
    sp = client.suggested_params()
    payTxn = TransactionWithSigner(
        signer=buyer_signer,
        txn=transaction.PaymentTxn(
            sender=buyer.getAddress(),
            sp=sp,
            amt=int(1e7),
            receiver=logic.get_application_address(enforcer_id),
        )
    )
    sp.fee = 4000 # need to pay for inner txn fee (for asset transfer + payments)
    atc = AtomicTransactionComposer()
    atc.add_method_call(
        enforcer_id,
        get_method(enforcer_iface, "transfer"),
        buyer.getAddress(),
        sp,
        buyer_signer,
        [nft_id, 1, creator.getAddress(), buyer.getAddress(), royalty.getAddress(), payTxn, 0, 1]
    )
    atc.execute(client, 2)

    seller_balances = getBalances(client, creator.getAddress())
    buyer_balances = getBalances(client, buyer.getAddress())

    assert seller_balances[nft_id] == 0
    assert buyer_balances[nft_id] == 1
